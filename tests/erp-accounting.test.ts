import { describe, test, expect } from 'vitest';
import { calculateGst } from '../modules/gst/engine';
import { validateBalancedJournal } from '../modules/accounting/engine';

describe('Indian Accounting & GST ERP System Unit Tests', () => {
  test('GST Calculation: Intra-state transaction (Maharashtra 27 to Maharashtra 27)', () => {
    const res = calculateGst('27', '27', 10000, 18);
    expect(res.isInterState).toBe(false);
    expect(res.cgstRate).toBe(9);
    expect(res.sgstRate).toBe(9);
    expect(res.igstRate).toBe(0);
    expect(res.cgstAmount).toBe(900);
    expect(res.sgstAmount).toBe(900);
    expect(res.igstAmount).toBe(0);
    expect(res.totalTax).toBe(1800);
    expect(res.grandTotal).toBe(11800);
  });

  test('GST Calculation: Inter-state transaction (Maharashtra 27 to Delhi 07)', () => {
    const res = calculateGst('27', '07', 10000, 18);
    expect(res.isInterState).toBe(true);
    expect(res.cgstAmount).toBe(0);
    expect(res.sgstAmount).toBe(0);
    expect(res.igstAmount).toBe(1800);
    expect(res.totalTax).toBe(1800);
    expect(res.grandTotal).toBe(11800);
  });

  test('Double-Entry Accounting: Balanced Journal Entry validation (Debit == Credit)', () => {
    const lines = [
      { accountId: 'acc-ar', debit: 11800, credit: 0 },
      { accountId: 'acc-sales', debit: 0, credit: 10000 },
      { accountId: 'acc-output-cgst', debit: 0, credit: 900 },
      { accountId: 'acc-output-sgst', debit: 0, credit: 900 },
    ];
    const validation = validateBalancedJournal(lines);
    expect(validation.isValid).toBe(true);
    expect(validation.totalDebit).toBe(11800);
    expect(validation.totalCredit).toBe(11800);
    expect(validation.diff).toBe(0);
  });

  test('Double-Entry Accounting: Unbalanced Journal Entry should be rejected', () => {
    const lines = [
      { accountId: 'acc-ar', debit: 12000, credit: 0 },
      { accountId: 'acc-sales', debit: 0, credit: 10000 },
    ];
    const validation = validateBalancedJournal(lines);
    expect(validation.isValid).toBe(false);
    expect(validation.diff).toBe(2000);
  });
});
