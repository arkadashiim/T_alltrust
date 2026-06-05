import crypto from "crypto";
import { WebhookService } from "../src/services/webhook";
import { config } from "../src/config";

const service = new WebhookService();

function makeSignature(body: string, timestamp: string): string {
  const payload = `${timestamp}.${body}`;
  return crypto
    .createHmac("sha256", config.webhookSecret)
    .update(payload)
    .digest("hex");
}

describe("Signature verification", () => {
  const body = JSON.stringify({ invoiceId: "test-123", status: "paid" });
  const timestamp = Date.now().toString();

  it("accepts a valid signature", () => {
    const sig = makeSignature(body, timestamp);
    expect(service.verifySignature(Buffer.from(body), sig, timestamp)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const badSig = "a".repeat(64);
    expect(service.verifySignature(Buffer.from(body), badSig, timestamp)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const sig = makeSignature(body, timestamp);
    const tampered = JSON.stringify({ invoiceId: "test-123", status: "failed" });
    expect(service.verifySignature(Buffer.from(tampered), sig, timestamp)).toBe(false);
  });

  it("rejects a tampered timestamp", () => {
    const sig = makeSignature(body, timestamp);
    const wrongTs = (Date.now() - 1000).toString();
    expect(service.verifySignature(Buffer.from(body), sig, wrongTs)).toBe(false);
  });
});

describe("Timestamp validation", () => {
  it("accepts a current timestamp", () => {
    expect(service.isTimestampValid(Date.now().toString())).toBe(true);
  });

  it("accepts a timestamp within 5 minutes", () => {
    const ts = (Date.now() - 4 * 60 * 1000).toString();
    expect(service.isTimestampValid(ts)).toBe(true);
  });

  it("rejects a timestamp older than 5 minutes", () => {
    const ts = (Date.now() - 6 * 60 * 1000).toString();
    expect(service.isTimestampValid(ts)).toBe(false);
  });

  it("rejects a future timestamp beyond 5 minutes", () => {
    const ts = (Date.now() + 6 * 60 * 1000).toString();
    expect(service.isTimestampValid(ts)).toBe(false);
  });

  it("rejects non-numeric timestamp", () => {
    expect(service.isTimestampValid("not-a-number")).toBe(false);
  });
});
