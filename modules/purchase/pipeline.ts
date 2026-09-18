import { db } from '@/lib/db';
import { calculateGst } from '@/modules/gst/engine';
import { postPurchaseInvoiceAccounting, postPaymentAccounting } from '@/modules/accounting/engine';
import { recordStockMovement } from '@/modules/inventory/engine';
import { getNextDocumentNumber } from '@/modules/company/numbering';

export interface PurchaseInvoiceItemInput {
  itemId: string;
  itemCode: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  discount?: number;
  gstRate: number;
}

export interface CreatePurchaseInvoiceInput {
  companyId: string;
  supplierId: string;
  supplierInvoiceNo: string;
  purchaseOrderId?: string;
  warehouseId?: string;
  invoiceDate: Date;
  dueDate: Date;
  notes?: string;
  items: PurchaseInvoiceItemInput[];
}

/**
 * Post Purchase Invoice with atomic Inventory, Input GST & Accounting updates
 */
export async function createPurchaseInvoice(input: CreatePurchaseInvoiceInput) {
  const company = await db.company.findUnique({ where: { id: input.companyId } });
  const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!company || !supplier) throw new Error('Company or Supplier not found');

  const invoiceNumber = await getNextDocumentNumber(input.companyId, 'PURCHASE_INVOICE');
  const isInterState = company.stateCode !== supplier.stateCode;

  let subtotal = 0;
  let discountTotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems = input.items.map((item) => {
    const itemSubtotal = item.quantity * item.rate;
    const discount = item.discount || 0;
    const itemTaxable = Math.max(0, itemSubtotal - discount);

    const gstRes = calculateGst(company.stateCode, supplier.stateCode, itemTaxable, item.gstRate);

    subtotal += itemSubtotal;
    discountTotal += discount;
    taxableAmount += itemTaxable;
    cgstTotal += gstRes.cgstAmount;
    sgstTotal += gstRes.sgstAmount;
    igstTotal += gstRes.igstAmount;

    return {
      itemId: item.itemId,
      itemCode: item.itemCode,
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      discount,
      taxableValue: itemTaxable,
      gstRate: item.gstRate,
      cgstAmount: gstRes.cgstAmount,
      sgstAmount: gstRes.sgstAmount,
      igstAmount: gstRes.igstAmount,
      totalAmount: gstRes.grandTotal,
    };
  });

  const grandTotal = Number((taxableAmount + cgstTotal + sgstTotal + igstTotal).toFixed(2));

  // 1. Create Purchase Invoice Record
  const purchaseInvoice = await db.purchaseInvoice.create({
    data: {
      companyId: input.companyId,
      invoiceNumber,
      supplierInvoiceNo: input.supplierInvoiceNo,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      supplierId: input.supplierId,
      purchaseOrderId: input.purchaseOrderId,
      warehouseId: input.warehouseId,
      gstin: supplier.gstin,
      placeOfSupply: supplier.state,
      isInterState,
      status: 'POSTED',
      paymentStatus: 'UNPAID',
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      notes: input.notes,
      items: {
        create: processedItems,
      },
    },
    include: { items: true },
  });

  // 2. Record Stock Addition for Goods items
  const warehouseId = input.warehouseId || 'wh-main-godown';
  for (const item of input.items) {
    const itemData = await db.item.findUnique({ where: { id: item.itemId } });
    if (itemData && itemData.itemType === 'GOODS') {
      await recordStockMovement({
        companyId: input.companyId,
        itemId: item.itemId,
        warehouseId,
        transactionDate: input.invoiceDate,
        transactionType: 'PURCHASE',
        referenceType: 'PurchaseInvoice',
        referenceId: purchaseInvoice.id,
        quantityIn: item.quantity,
        quantityOut: 0,
        rate: item.rate,
      });
    }
  }

  // 3. Post Accounting Entry
  await postPurchaseInvoiceAccounting({
    companyId: input.companyId,
    purchaseInvoiceId: purchaseInvoice.id,
    invoiceNumber: purchaseInvoice.invoiceNumber,
    supplierInvoiceNo: input.supplierInvoiceNo,
    invoiceDate: input.invoiceDate,
    supplierId: supplier.id,
    supplierName: supplier.name,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    grandTotal,
    isInterState,
  });

  // 4. Log Input GST Transaction
  await db.gstTransaction.create({
    data: {
      companyId: input.companyId,
      docType: 'PURCHASE_INVOICE',
      docId: purchaseInvoice.id,
      docNumber: purchaseInvoice.supplierInvoiceNo,
      docDate: input.invoiceDate,
      supplierId: supplier.id,
      gstin: supplier.gstin,
      placeOfSupply: supplier.state,
      isInterState,
      taxableAmount,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      totalTax: cgstTotal + sgstTotal + igstTotal,
      grandTotal,
    },
  });

  return purchaseInvoice;
}

/**
 * Record Supplier Payment and allocate to purchase invoices
 */
export async function createPayment(input: {
  companyId: string;
  supplierId: string;
  paymentDate: Date;
  paymentMode: string;
  bankAccountId?: string;
  amount: number;
  referenceNo?: string;
  notes?: string;
  allocations: { purchaseInvoiceId: string; amount: number }[];
}) {
  const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier) throw new Error('Supplier not found');

  const paymentNumber = await getNextDocumentNumber(input.companyId, 'PAYMENT');

  // 1. Create Payment Record
  const payment = await db.payment.create({
    data: {
      companyId: input.companyId,
      paymentNumber,
      paymentDate: input.paymentDate,
      supplierId: input.supplierId,
      paymentMode: input.paymentMode,
      bankAccountId: input.bankAccountId,
      amount: input.amount,
      referenceNo: input.referenceNo,
      notes: input.notes,
      status: 'POSTED',
      allocations: {
        create: input.allocations,
      },
    },
  });

  // 2. Update Purchase Invoice Paid / Balance amounts & Payment Status
  for (const alloc of input.allocations) {
    const inv = await db.purchaseInvoice.findUnique({ where: { id: alloc.purchaseInvoiceId } });
    if (inv) {
      const newPaid = Number((inv.paidAmount + alloc.amount).toFixed(2));
      const newBalance = Number(Math.max(0, inv.grandTotal - newPaid).toFixed(2));
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

      await db.purchaseInvoice.update({
        where: { id: inv.id },
        data: { paidAmount: newPaid, balanceAmount: newBalance, paymentStatus: newStatus },
      });
    }
  }

  // 3. Post Payment Accounting Entry
  await postPaymentAccounting({
    companyId: input.companyId,
    paymentId: payment.id,
    paymentNumber: payment.paymentNumber,
    paymentDate: input.paymentDate,
    supplierId: supplier.id,
    supplierName: supplier.name,
    amount: input.amount,
    bankAccountId: input.bankAccountId,
    paymentMode: input.paymentMode,
  });

  return payment;
}
