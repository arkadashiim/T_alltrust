import { Request, Response, NextFunction } from "express";
import { webhookService } from "../services/webhook";

export function verifyWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const signature = req.headers["x-signature"] as string | undefined;
  const timestamp = req.headers["x-timestamp"] as string | undefined;
  const nonce = req.headers["x-nonce"] as string | undefined;

  if (!signature || !timestamp || !nonce) {
    res.status(401).json({ error: "Missing signature headers" });
    return;
  }

  if (!webhookService.isTimestampValid(timestamp)) {
    res.status(401).json({ error: "Timestamp expired or invalid" });
    return;
  }

  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!rawBody) {
    res.status(400).json({ error: "Missing raw body" });
    return;
  }

  if (!webhookService.verifySignature(rawBody, signature, timestamp)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  next();
}
