import { calculateFee, calculateAmountToReceive } from "../src/utils/math";

describe("Commission calculation", () => {
  it("calculates 5% fee on 100", () => {
    const fee = calculateFee(100, 5);
    expect(fee).toBe(5);
    expect(calculateAmountToReceive(100, fee)).toBe(95);
  });

  it("calculates 10% fee on 250.50", () => {
    const fee = calculateFee(250.5, 10);
    expect(fee).toBe(25.05);
    expect(calculateAmountToReceive(250.5, fee)).toBe(225.45);
  });

  it("calculates 1.5% fee on 200", () => {
    const fee = calculateFee(200, 1.5);
    expect(fee).toBe(3);
    expect(calculateAmountToReceive(200, fee)).toBe(197);
  });

  it("calculates 7.3% fee on 99.99", () => {
    const fee = calculateFee(99.99, 7.3);
    expect(fee).toBe(7.3);
    expect(calculateAmountToReceive(99.99, fee)).toBe(92.69);
  });

  it("handles zero fee percentage", () => {
    const fee = calculateFee(500, 0);
    expect(fee).toBe(0);
    expect(calculateAmountToReceive(500, fee)).toBe(500);
  });

  it("handles 100% fee", () => {
    const fee = calculateFee(123.45, 100);
    expect(fee).toBe(123.45);
    expect(calculateAmountToReceive(123.45, fee)).toBe(0);
  });

  it("rounds correctly for 3.33% on 10.00", () => {
    const fee = calculateFee(10, 3.33);
    expect(fee).toBe(0.33);
    expect(calculateAmountToReceive(10, fee)).toBe(9.67);
  });

  it("handles small amounts", () => {
    const fee = calculateFee(0.01, 5);
    expect(fee).toBe(0);
    expect(calculateAmountToReceive(0.01, fee)).toBe(0.01);
  });
});
