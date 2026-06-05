import crypto from "crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import app from "../src/app";
import { Invoice } from "../src/models/invoice";
import { Merchant } from "../src/models/merchant";
import { config } from "../src/config";

const usedNonces = new Set<string>();

jest.mock("../src/utils/redis", () => ({
  isNonceUsed: jest.fn(async (nonce: string) => usedNonces.has(nonce)),
  markNonceUsed: jest.fn(async (nonce: string) => {
    usedNonces.add(nonce);
  }),
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  getRedisClient: jest.fn(),
}));

let mongoServer: MongoMemoryServer;

function makeHeaders(body: string) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID();
  const payload = `${timestamp}.${body}`;
  const signature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(payload)
    .digest("hex");
  return { "X-Signature": signature, "X-Timestamp": timestamp, "X-Nonce": nonce };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Invoice.deleteMany({});
  await Merchant.deleteMany({});
  usedNonces.clear();
  jest.clearAllMocks();
});

describe("POST /webhook", () => {
  async function seedInvoice(status: "pending" | "paid" | "failed" = "pending") {
    await Merchant.create({ merchantId: "m1", name: "Test Merchant", feePercent: 5 });
    return Invoice.create({
      invoiceId: "inv-001",
      merchantId: "m1",
      amount: 100,
      currency: "USD",
      feePercent: 5,
      fee: 5,
      amountToReceive: 95,
      status,
    });
  }

  it("updates a pending invoice to paid", async () => {
    await seedInvoice("pending");
    const body = JSON.stringify({ invoiceId: "inv-001", status: "paid" });
    const headers = makeHeaders(body);

    const res = await request(app)
      .post("/webhook")
      .set(headers)
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.updated).toBe(true);
    expect(res.body.invoice.status).toBe("paid");

    const invoice = await Invoice.findOne({ invoiceId: "inv-001" });
    expect(invoice!.status).toBe("paid");
  });

  it("updates a pending invoice to failed", async () => {
    await seedInvoice("pending");
    const body = JSON.stringify({ invoiceId: "inv-001", status: "failed" });
    const headers = makeHeaders(body);

    const res = await request(app)
      .post("/webhook")
      .set(headers)
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);
    expect(res.body.invoice.status).toBe("failed");
  });

  it("does not update an already-paid invoice (idempotent)", async () => {
    await seedInvoice("paid");
    const body = JSON.stringify({ invoiceId: "inv-001", status: "paid" });
    const headers = makeHeaders(body);

    const res = await request(app)
      .post("/webhook")
      .set(headers)
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(false);
    expect(res.body.invoice.status).toBe("paid");
  });

  it("rejects replay with same nonce", async () => {
    await seedInvoice("pending");
    const body = JSON.stringify({ invoiceId: "inv-001", status: "paid" });
    const timestamp = Date.now().toString();
    const nonce = "fixed-nonce";
    const payload = `${timestamp}.${body}`;
    const signature = crypto
      .createHmac("sha256", config.webhookSecret)
      .update(payload)
      .digest("hex");

    const headers = {
      "X-Signature": signature,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
    };

    const res1 = await request(app)
      .post("/webhook")
      .set(headers)
      .set("Content-Type", "application/json")
      .send(body);

    expect(res1.status).toBe(200);
    expect(res1.body.updated).toBe(true);

    const res2 = await request(app)
      .post("/webhook")
      .set(headers)
      .set("Content-Type", "application/json")
      .send(body);

    expect(res2.status).toBe(200);
    expect(res2.body.updated).toBe(false);
  });

  it("rejects invalid signature", async () => {
    const body = JSON.stringify({ invoiceId: "inv-001", status: "paid" });
    const res = await request(app)
      .post("/webhook")
      .set("X-Signature", "invalid")
      .set("X-Timestamp", Date.now().toString())
      .set("X-Nonce", "nonce-1")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(401);
  });

  it("rejects missing signature headers", async () => {
    const body = JSON.stringify({ invoiceId: "inv-001", status: "paid" });
    const res = await request(app)
      .post("/webhook")
      .set("Content-Type", "application/json")
      .send(body);

    expect(res.status).toBe(401);
  });
});

describe("POST /invoice", () => {
  it("creates an invoice with correct fee calculation", async () => {
    await Merchant.create({ merchantId: "m1", name: "Test Merchant", feePercent: 5 });

    const res = await request(app)
      .post("/invoice")
      .send({ amount: 200, currency: "USD", merchantId: "m1" });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(200);
    expect(res.body.fee).toBe(10);
    expect(res.body.amountToReceive).toBe(190);
    expect(res.body.status).toBe("pending");
    expect(res.body.invoiceId).toBeDefined();
  });

  it("returns 404 for unknown merchant", async () => {
    const res = await request(app)
      .post("/invoice")
      .send({ amount: 100, currency: "USD", merchantId: "unknown" });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid amount", async () => {
    await Merchant.create({ merchantId: "m1", name: "Test", feePercent: 5 });
    const res = await request(app)
      .post("/invoice")
      .send({ amount: -10, currency: "USD", merchantId: "m1" });

    expect(res.status).toBe(400);
  });
});

describe("GET /invoice/:id", () => {
  it("returns invoice by id", async () => {
    await Invoice.create({
      invoiceId: "inv-get-1",
      merchantId: "m1",
      amount: 50,
      currency: "EUR",
      feePercent: 3,
      fee: 1.5,
      amountToReceive: 48.5,
      status: "pending",
    });

    const res = await request(app).get("/invoice/inv-get-1");
    expect(res.status).toBe(200);
    expect(res.body.invoiceId).toBe("inv-get-1");
    expect(res.body.amount).toBe(50);
  });

  it("returns 404 for unknown invoice", async () => {
    const res = await request(app).get("/invoice/nonexistent");
    expect(res.status).toBe(404);
  });
});
