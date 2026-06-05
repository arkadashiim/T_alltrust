import mongoose, { Schema, Document } from "mongoose";

export interface IMerchant extends Document {
  merchantId: string;
  name: string;
  feePercent: number;
}

const merchantSchema = new Schema<IMerchant>(
  {
    merchantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    feePercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true },
);

export const Merchant = mongoose.model<IMerchant>("Merchant", merchantSchema);
