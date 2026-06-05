import { createClient } from "redis";
import { config } from "../config";

export type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient;

export async function connectRedis(): Promise<RedisClient> {
  client = createClient({ url: config.redisUrl });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  return client;
}

export function getRedisClient(): RedisClient {
  return client;
}

export async function acquireNonce(
  nonce: string,
  ttlSeconds: number = 600,
): Promise<boolean> {
  const result = await client.set(`nonce:${nonce}`, "1", { NX: true, EX: ttlSeconds });
  return result === "OK";
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.disconnect();
  }
}
