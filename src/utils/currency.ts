/**
 * Formats integer paise into an Indian Rupee (INR) display string.
 * @param paise Amount in integer paise (e.g. 25000 = ₹250.00)
 * @param includeDecimals Whether to include .00 decimals (defaults to false for whole amounts)
 */
export function formatPaise(paise: number, includeDecimals = false): string {
  if (isNaN(paise)) return '₹0';
  const rupees = paise / 100;
  if (includeDecimals || rupees % 1 !== 0) {
    return `₹${rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${rupees.toLocaleString('en-IN')}`;
}

/**
 * Calculates 5% GST on the discounted subtotal.
 * Strict mathematical invariant matching backend.
 */
export function calculateGstPaise(subtotalAfterDiscountPaise: number, gstPercent = 5): number {
  return Math.round((Math.max(0, subtotalAfterDiscountPaise) * gstPercent) / 100);
}
