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

export async function isNonceUsed(nonce: string): Promise<boolean> {
  const exists = await client.exists(`nonce:${nonce}`);
  return exists === 1;
}

export async function markNonceUsed(
  nonce: string,
  ttlSeconds: number = 600,
): Promise<void> {
  await client.set(`nonce:${nonce}`, "1", { EX: ttlSeconds });
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.disconnect();
  }
}
