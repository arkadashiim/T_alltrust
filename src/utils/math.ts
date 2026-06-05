export function calculateFee(amount: number, feePercent: number): number {
  const amountCents = Math.round(amount * 100);
  const feeCents = Math.round((amountCents * feePercent) / 100);
  return feeCents / 100;
}

export function calculateAmountToReceive(
  amount: number,
  fee: number,
): number {
  const amountCents = Math.round(amount * 100);
  const feeCents = Math.round(fee * 100);
  return (amountCents - feeCents) / 100;
}
