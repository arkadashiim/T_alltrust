import crypto from "crypto";
import { config } from "../config";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export class WebhookService {
  private secret: string;

  constructor(secret: string = config.webhookSecret) {
    this.secret = secret;
  }

  verifySignature(rawBody: Buffer, signature: string, timestamp: string): boolean {
    const payload = `${timestamp}.${rawBody.toString()}`;
    const expected = crypto
      .createHmac("sha256", this.secret)
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");

    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }

  isTimestampValid(timestamp: string): boolean {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    const diff = Math.abs(Date.now() - ts);
    return diff <= TIMESTAMP_TOLERANCE_MS;
  }
}

export const webhookService = new WebhookService();
