#!/usr/bin/env node

const crypto = require("crypto");

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const secret = process.env.WEBHOOK_SECRET || "my-secret-key";
const invoiceId = process.argv[2];
const status = process.argv[3] || "paid";

if (!invoiceId) {
  console.error("Usage: node scripts/send-webhook.js <invoiceId> [status]");
  console.error("  status: paid | failed  (default: paid)");
  process.exit(1);
}

const body = JSON.stringify({ invoiceId, status });
const timestamp = String(Date.now());
const nonce = crypto.randomUUID();

const signature = crypto
  .createHmac("sha256", secret)
  .update(`${timestamp}.${body}`)
  .digest("hex");

console.log(`POST ${baseUrl}/webhook`);
console.log(`Body: ${body}`);
console.log("");

fetch(`${baseUrl}/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Signature": signature,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
  },
  body,
})
  .then(async (res) => {
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((err) => {
    console.error("Request failed:", err.message);
    process.exit(1);
  });
