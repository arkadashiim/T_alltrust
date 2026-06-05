import mongoose from "mongoose";
import { config } from "./config";
import { Merchant } from "./models/merchant";

async function seed() {
  await mongoose.connect(config.mongoUri);

  const existing = await Merchant.findOne({ merchantId: "merchant-1" });
  if (existing) {
    console.log("Merchant already exists:", existing.merchantId);
  } else {
    const merchant = await Merchant.create({
      merchantId: "merchant-1",
      name: "Test Merchant",
      feePercent: 5,
    });
    console.log("Created merchant:", merchant.merchantId);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
