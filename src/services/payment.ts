import crypto from "crypto";
import { Invoice, IInvoice, InvoiceStatus } from "../models/invoice";
import { Merchant } from "../models/merchant";
import { calculateFee, calculateAmountToReceive } from "../utils/math";
import { isNonceUsed, markNonceUsed } from "../utils/redis";

export interface CreateInvoiceInput {
  amount: number;
  currency: string;
  merchantId: string;
}

export interface WebhookPayload {
  invoiceId: string;
  status: "paid" | "failed";
}

export interface WebhookResult {
  updated: boolean;
  invoice?: { invoiceId: string; status: InvoiceStatus };
}

export class PaymentService {
  async createInvoice(input: CreateInvoiceInput): Promise<IInvoice> {
    const { amount, currency, merchantId } = input;

    if (!amount || amount <= 0) {
      throw Object.assign(new Error("amount must be greater than 0"), {
        statusCode: 400,
      });
    }

    if (!currency || typeof currency !== "string") {
      throw Object.assign(new Error("currency is required"), {
        statusCode: 400,
      });
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw Object.assign(new Error("Merchant not found"), { statusCode: 404 });
    }

    const fee = calculateFee(amount, merchant.feePercent);
    const amountToReceive = calculateAmountToReceive(amount, fee);

    const invoice = await Invoice.create({
      invoiceId: crypto.randomUUID(),
      merchantId,
      amount,
      currency,
      feePercent: merchant.feePercent,
      fee,
      amountToReceive,
      status: "pending",
    });

    return invoice;
  }

  async getInvoice(invoiceId: string): Promise<IInvoice | null> {
    return Invoice.findOne({ invoiceId });
  }

  async processWebhook(
    payload: WebhookPayload,
    nonce: string,
  ): Promise<WebhookResult> {
    if (await isNonceUsed(nonce)) {
      const existing = await Invoice.findOne({ invoiceId: payload.invoiceId });
      if (existing) {
        return {
          updated: false,
          invoice: { invoiceId: existing.invoiceId, status: existing.status },
        };
      }
      return { updated: false };
    }

    await markNonceUsed(nonce);

    const updated = await Invoice.findOneAndUpdate(
      { invoiceId: payload.invoiceId, status: "pending" },
      { status: payload.status },
      { returnDocument: "after" },
    );

    if (!updated) {
      const existing = await Invoice.findOne({ invoiceId: payload.invoiceId });
      if (!existing) {
        return { updated: false };
      }
      return {
        updated: false,
        invoice: { invoiceId: existing.invoiceId, status: existing.status },
      };
    }

    return {
      updated: true,
      invoice: { invoiceId: updated.invoiceId, status: updated.status },
    };
  }
}

export const paymentService = new PaymentService();
