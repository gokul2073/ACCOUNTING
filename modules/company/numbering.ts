import { db } from '@/lib/db';

export async function getNextDocumentNumber(companyId: string, docType: string): Promise<string> {
  let seq = await db.documentSequence.findFirst({
    where: { companyId, docType },
  });

  if (!seq) {
    const prefixes: Record<string, string> = {
      QUOTATION: 'QT-',
      SALES_ORDER: 'SO-',
      DELIVERY_CHALLAN: 'DC-',
      SALES_INVOICE: 'INV-',
      CREDIT_NOTE: 'CN-',
      RECEIPT: 'REC-',
      PURCHASE_ORDER: 'PO-',
      GOODS_RECEIPT: 'GRN-',
      PURCHASE_INVOICE: 'PINV-',
      DEBIT_NOTE: 'DN-',
      PAYMENT: 'PAY-',
      EXPENSE: 'EXP-',
      JOURNAL: 'JV-',
    };

    seq = await db.documentSequence.create({
      data: {
        companyId,
        docType,
        prefix: prefixes[docType] || `${docType}-`,
        nextNumber: 1,
        padding: 5,
        fyName: '26-27',
      },
    });
  }

  const numStr = String(seq.nextNumber).padStart(seq.padding, '0');
  const formattedNumber = `${seq.prefix}${seq.fyName ? seq.fyName + '/' : ''}${numStr}`;

  // Increment sequence for next call
  await db.documentSequence.update({
    where: { id: seq.id },
    data: { nextNumber: seq.nextNumber + 1 },
  });

  return formattedNumber;
}
