import { formatPaise, calculateGstPaise } from '../currency';

describe('Currency Utility (Integer Paise Invariant)', () => {
  test('formatPaise formats whole rupees correctly', () => {
    expect(formatPaise(25000)).toBe('₹250');
    expect(formatPaise(100000)).toBe('₹1,000');
    expect(formatPaise(0)).toBe('₹0');
  });

  test('formatPaise formats fractional rupees when requested or needed', () => {
    expect(formatPaise(25050, true)).toBe('₹250.50');
    expect(formatPaise(25050)).toBe('₹250.50'); // decimals required when not whole
  });

  test('formatPaise handles NaN or invalid inputs gracefully', () => {
    expect(formatPaise(NaN)).toBe('₹0');
    expect(formatPaise(undefined as any)).toBe('₹0');
  });

  test('calculateGstPaise computes exact 5% GST on post-discount subtotal', () => {
    // 5% of 10000 paise (₹100) = 500 paise (₹5)
    expect(calculateGstPaise(10000)).toBe(500);

    // 5% of 25430 paise (₹254.30) = 1271.5 -> rounds to 1272 paise (₹12.72)
    expect(calculateGstPaise(25430)).toBe(1272);

    // 0 or negative subtotal returns 0
    expect(calculateGstPaise(0)).toBe(0);
    expect(calculateGstPaise(-500)).toBe(0);
  });
});
