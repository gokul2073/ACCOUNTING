import { db } from '@/lib/db';

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  lineNarration?: string;
  partnerType?: 'CUSTOMER' | 'SUPPLIER';
  partnerId?: string;
}

export interface JournalEntryParams {
  companyId: string;
  fyId?: string;
  voucherNumber: string;
  voucherDate: Date;
  voucherType: 'SALES' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'EXPENSE' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'MANUAL';
  referenceNumber?: string;
  referenceType?: string;
  referenceId?: string;
  narration: string;
  createdById?: string;
  lines: JournalLineInput[];
}

/**
 * Validate that Total Debit === Total Credit
 */
export function validateBalancedJournal(lines: JournalLineInput[]): { isValid: boolean; totalDebit: number; totalCredit: number; diff: number } {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    totalDebit += line.debit || 0;
    totalCredit += line.credit || 0;
  }

  totalDebit = Number(totalDebit.toFixed(2));
  totalCredit = Number(totalCredit.toFixed(2));
  const diff = Number(Math.abs(totalDebit - totalCredit).toFixed(2));

  return {
    isValid: diff <= 0.02, // Allow max 2 paise rounding difference tolerance
    totalDebit,
    totalCredit,
    diff,
  };
}

/**
 * Core Journal Entry Creator Engine
 */
export async function createJournalEntry(params: JournalEntryParams) {
  const { isValid, totalDebit, totalCredit, diff } = validateBalancedJournal(params.lines);

  if (!isValid) {
    throw new Error(`Unbalanced Journal Entry! Total Debit (₹${totalDebit}) must equal Total Credit (₹${totalCredit}). Difference: ₹${diff}`);
  }

  const journalEntry = await db.journalEntry.create({
    data: {
      companyId: params.companyId,
      fyId: params.fyId,
      voucherNumber: params.voucherNumber,
      voucherDate: params.voucherDate,
      voucherType: params.voucherType,
      referenceNumber: params.referenceNumber,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      narration: params.narration,
      createdById: params.createdById,
      isPosted: true,
      lines: {
        create: params.lines.map((line) => ({
          accountId: line.accountId,
          debit: Number(line.debit.toFixed(2)),
          credit: Number(line.credit.toFixed(2)),
          lineNarration: line.lineNarration || params.narration,
          partnerType: line.partnerType,
          partnerId: line.partnerId,
        })),
      },
    },
    include: {
      lines: true,
    },
  });

  return journalEntry;
}

/**
 * Auto-Post Sales Invoice Accounting Entry
 * Customer A/C DR (Grand Total)
 *   Sales A/C CR (Taxable Value)
 *   Output CGST CR (CGST Amount)
 *   Output SGST CR (SGST Amount)
 *   Output IGST CR (IGST Amount)
 */
export async function postSalesInvoiceAccounting(params: {
  companyId: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  customerId: string;
  customerName: string;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  isInterState: boolean;
}) {
  const lines: JournalLineInput[] = [
    // Customer AR Debit
    {
      accountId: 'acc-ar',
      debit: params.grandTotal,
      credit: 0,
      lineNarration: `Sales Invoice ${params.invoiceNumber} - ${params.customerName}`,
      partnerType: 'CUSTOMER',
      partnerId: params.customerId,
    },
    // Sales Revenue Credit
    {
      accountId: 'acc-sales',
      debit: 0,
      credit: params.taxableAmount,
      lineNarration: `Sales Taxable Value for Invoice ${params.invoiceNumber}`,
    },
  ];

  if (!params.isInterState) {
    if (params.cgstTotal > 0) {
      lines.push({
        accountId: 'acc-output-cgst',
        debit: 0,
        credit: params.cgstTotal,
        lineNarration: `Output CGST for Invoice ${params.invoiceNumber}`,
      });
    }
    if (params.sgstTotal > 0) {
      lines.push({
        accountId: 'acc-output-sgst',
        debit: 0,
        credit: params.sgstTotal,
        lineNarration: `Output SGST for Invoice ${params.invoiceNumber}`,
      });
    }
  } else {
    if (params.igstTotal > 0) {
      lines.push({
        accountId: 'acc-output-igst',
        debit: 0,
        credit: params.igstTotal,
        lineNarration: `Output IGST for Invoice ${params.invoiceNumber}`,
      });
    }
  }

  return await createJournalEntry({
    companyId: params.companyId,
    voucherNumber: `JV-${params.invoiceNumber}`,
    voucherDate: params.invoiceDate,
    voucherType: 'SALES',
    referenceNumber: params.invoiceNumber,
    referenceType: 'SalesInvoice',
    referenceId: params.invoiceId,
    narration: `Being sales invoice ${params.invoiceNumber} raised to ${params.customerName}`,
    lines,
  });
}

/**
 * Auto-Post Purchase Invoice Accounting Entry
 * Purchase / Inventory A/C DR (Taxable Amount)
 * Input CGST A/C DR (CGST Amount)
 * Input SGST A/C DR (SGST Amount)
 * Input IGST A/C DR (IGST Amount)
 *   Supplier A/C CR (Grand Total)
 */
export async function postPurchaseInvoiceAccounting(params: {
  companyId: string;
  purchaseInvoiceId: string;
  invoiceNumber: string;
  supplierInvoiceNo: string;
  invoiceDate: Date;
  supplierId: string;
  supplierName: string;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  isInterState: boolean;
}) {
  const lines: JournalLineInput[] = [
    // Purchase Account Debit
    {
      accountId: 'acc-purchases',
      debit: params.taxableAmount,
      credit: 0,
      lineNarration: `Purchase Taxable Value for Bill ${params.supplierInvoiceNo}`,
    },
  ];

  if (!params.isInterState) {
    if (params.cgstTotal > 0) {
      lines.push({
        accountId: 'acc-input-cgst',
        debit: params.cgstTotal,
        credit: 0,
        lineNarration: `Input CGST for Bill ${params.supplierInvoiceNo}`,
      });
    }
    if (params.sgstTotal > 0) {
      lines.push({
        accountId: 'acc-input-sgst',
        debit: params.sgstTotal,
        credit: 0,
        lineNarration: `Input SGST for Bill ${params.supplierInvoiceNo}`,
      });
    }
  } else {
    if (params.igstTotal > 0) {
      lines.push({
        accountId: 'acc-input-igst',
        debit: params.igstTotal,
        credit: 0,
        lineNarration: `Input IGST for Bill ${params.supplierInvoiceNo}`,
      });
    }
  }

  // Supplier AP Credit
  lines.push({
    accountId: 'acc-ap',
    debit: 0,
    credit: params.grandTotal,
    lineNarration: `Purchase Bill ${params.supplierInvoiceNo} - ${params.supplierName}`,
    partnerType: 'SUPPLIER',
    partnerId: params.supplierId,
  });

  return await createJournalEntry({
    companyId: params.companyId,
    voucherNumber: `JV-P-${params.invoiceNumber}`,
    voucherDate: params.invoiceDate,
    voucherType: 'PURCHASE',
    referenceNumber: params.invoiceNumber,
    referenceType: 'PurchaseInvoice',
    referenceId: params.purchaseInvoiceId,
    narration: `Being purchase bill ${params.supplierInvoiceNo} recorded from ${params.supplierName}`,
    lines,
  });
}

/**
 * Auto-Post Customer Receipt Entry
 * Cash/Bank DR (Amount)
 *   Customer A/C CR (Amount)
 */
export async function postReceiptAccounting(params: {
  companyId: string;
  receiptId: string;
  receiptNumber: string;
  receiptDate: Date;
  customerId: string;
  customerName: string;
  amount: number;
  bankAccountId?: string;
  paymentMode: string;
}) {
  const bankGlAccountId = params.bankAccountId ? 'acc-bank-hdfc' : 'acc-cash';

  const lines: JournalLineInput[] = [
    {
      accountId: bankGlAccountId,
      debit: params.amount,
      credit: 0,
      lineNarration: `Receipt ${params.receiptNumber} via ${params.paymentMode}`,
    },
    {
      accountId: 'acc-ar',
      debit: 0,
      credit: params.amount,
      lineNarration: `Amount received from ${params.customerName}`,
      partnerType: 'CUSTOMER',
      partnerId: params.customerId,
    },
  ];

  return await createJournalEntry({
    companyId: params.companyId,
    voucherNumber: `JV-${params.receiptNumber}`,
    voucherDate: params.receiptDate,
    voucherType: 'RECEIPT',
    referenceNumber: params.receiptNumber,
    referenceType: 'Receipt',
    referenceId: params.receiptId,
    narration: `Being amount ₹${params.amount} received from ${params.customerName} via ${params.paymentMode}`,
    lines,
  });
}

/**
 * Auto-Post Supplier Payment Entry
 * Supplier A/C DR (Amount)
 *   Cash/Bank CR (Amount)
 */
export async function postPaymentAccounting(params: {
  companyId: string;
  paymentId: string;
  paymentNumber: string;
  paymentDate: Date;
  supplierId: string;
  supplierName: string;
  amount: number;
  bankAccountId?: string;
  paymentMode: string;
}) {
  const bankGlAccountId = params.bankAccountId ? 'acc-bank-hdfc' : 'acc-cash';

  const lines: JournalLineInput[] = [
    {
      accountId: 'acc-ap',
      debit: params.amount,
      credit: 0,
      lineNarration: `Payment to ${params.supplierName}`,
      partnerType: 'SUPPLIER',
      partnerId: params.supplierId,
    },
    {
      accountId: bankGlAccountId,
      debit: 0,
      credit: params.amount,
      lineNarration: `Payment ${params.paymentNumber} via ${params.paymentMode}`,
    },
  ];

  return await createJournalEntry({
    companyId: params.companyId,
    voucherNumber: `JV-${params.paymentNumber}`,
    voucherDate: params.paymentDate,
    voucherType: 'PAYMENT',
    referenceNumber: params.paymentNumber,
    referenceType: 'Payment',
    referenceId: params.paymentId,
    narration: `Being payment ₹${params.amount} paid to ${params.supplierName} via ${params.paymentMode}`,
    lines,
  });
}
