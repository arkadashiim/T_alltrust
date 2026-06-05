import mongoose, { Schema, Document } from "mongoose";

export type InvoiceStatus = "pending" | "paid" | "failed";

export interface IInvoice extends Document {
  invoiceId: string;
  merchantId: string;
  amount: number;
  currency: string;
  feePercent: number;
  fee: number;
  amountToReceive: number;
  status: InvoiceStatus;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, required: true, unique: true },
    merchantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    feePercent: { type: Number, required: true },
    fee: { type: Number, required: true },
    amountToReceive: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Invoice = mongoose.model<IInvoice>("Invoice", invoiceSchema);
