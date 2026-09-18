/**
 * Centralized Indian GST Engine
 * Calculates CGST, SGST, IGST based on Intra-State vs Inter-State rules
 */

export interface GstItemInput {
  taxableValue: number;
  gstRate: number; // e.g. 18 for 18%
}

export interface GstCalculationResult {
  isInterState: boolean;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
}

/**
 * Determine if a transaction is Inter-State based on State Codes
 */
export function isInterStateTransaction(companyStateCode: string, partyStateCode: string): boolean {
  if (!companyStateCode || !partyStateCode) return false;
  return companyStateCode.trim() !== partyStateCode.trim();
}

/**
 * Calculate GST for a single line item or total taxable value
 */
export function calculateGst(
  companyStateCode: string,
  partyStateCode: string,
  taxableValue: number,
  gstRate: number
): GstCalculationResult {
  const isInterState = isInterStateTransaction(companyStateCode, partyStateCode);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = Number(((taxableValue * igstRate) / 100).toFixed(2));
  } else {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = Number(((taxableValue * cgstRate) / 100).toFixed(2));
    sgstAmount = Number(((taxableValue * sgstRate) / 100).toFixed(2));
  }

  const totalTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const grandTotal = Number((taxableValue + totalTax).toFixed(2));

  return {
    isInterState,
    taxableAmount: Number(taxableValue.toFixed(2)),
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    grandTotal,
  };
}

/**
 * Helper to round off amounts
 */
export function calculateRoundOff(totalAmount: number): { roundedTotal: number; roundOffAmount: number } {
  const roundedTotal = Math.round(totalAmount);
  const roundOffAmount = Number((roundedTotal - totalAmount).toFixed(2));
  return { roundedTotal, roundOffAmount };
}
