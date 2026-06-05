import mongoose from "mongoose";
import { config } from "./config";
import { connectRedis } from "./utils/redis";
import app from "./app";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  await connectRedis();
  console.log("Connected to Redis");

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
