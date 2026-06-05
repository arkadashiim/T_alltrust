import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27018/alltrust",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6380",
  webhookSecret: process.env.WEBHOOK_SECRET || "default-secret",
};
