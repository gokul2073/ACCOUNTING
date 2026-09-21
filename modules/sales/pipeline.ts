import { db } from '@/lib/db';
import { calculateGst } from '@/modules/gst/engine';
import { postSalesInvoiceAccounting, postReceiptAccounting } from '@/modules/accounting/engine';
import { recordStockMovement } from '@/modules/inventory/engine';
import { getNextDocumentNumber } from '@/modules/company/numbering';

export interface SalesInvoiceItemInput {
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

export interface CreateSalesInvoiceInput {
  companyId: string;
  customerId: string;
  quotationId?: string;
  salesOrderId?: string;
  warehouseId?: string;
  invoiceNumber?: string;
  invoiceDate: Date;
  dueDate: Date;
  poNumber?: string;
  poDate?: Date;
  vehicleNo?: string;
  eWayBillNo?: string;
  netWeight?: string;
  notes?: string;
  items: SalesInvoiceItemInput[];
}

/**
 * Post Sales Invoice with atomic Inventory, GST & Accounting updates
 */
export async function createSalesInvoice(input: CreateSalesInvoiceInput) {
  const company = await db.company.findUnique({ where: { id: input.companyId } });
  const customer = await db.customer.findUnique({ where: { id: input.customerId } });
  if (!company || !customer) throw new Error('Company or Customer not found');

  const invoiceNumber = input.invoiceNumber?.trim()
    ? input.invoiceNumber.trim()
    : await getNextDocumentNumber(input.companyId, 'SALES_INVOICE');
  const isInterState = company.stateCode !== customer.stateCode;

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

    const gstRes = calculateGst(company.stateCode, customer.stateCode, itemTaxable, item.gstRate);

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

  // 1. Create Sales Invoice Record
  const invoice = await db.salesInvoice.create({
    data: {
      companyId: input.companyId,
      invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      poNumber: input.poNumber,
      poDate: input.poDate,
      vehicleNo: input.vehicleNo,
      eWayBillNo: input.eWayBillNo,
      netWeight: input.netWeight,
      customerId: input.customerId,
      quotationId: input.quotationId,
      salesOrderId: input.salesOrderId,
      warehouseId: input.warehouseId,
      gstin: customer.gstin,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress || customer.billingAddress,
      placeOfSupply: customer.state,
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

  // 2. Record Inventory Movement for Goods items
  const warehouseId = input.warehouseId || 'wh-main-godown';
  for (const item of input.items) {
    const itemData = await db.item.findUnique({ where: { id: item.itemId } });
    if (itemData && itemData.itemType === 'GOODS') {
      await recordStockMovement({
        companyId: input.companyId,
        itemId: item.itemId,
        warehouseId,
        transactionDate: input.invoiceDate,
        transactionType: 'SALES',
        referenceType: 'SalesInvoice',
        referenceId: invoice.id,
        quantityIn: 0,
        quantityOut: item.quantity,
        rate: item.rate,
      });
    }
  }

  // 3. Post Accounting Journal Entry
  await postSalesInvoiceAccounting({
    companyId: input.companyId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: input.invoiceDate,
    customerId: customer.id,
    customerName: customer.name,
    taxableAmount,
    cgstTotal,
    sgstTotal,
    igstTotal,
    grandTotal,
    isInterState,
  });

  // 4. Log GST Transaction Record
  await db.gstTransaction.create({
    data: {
      companyId: input.companyId,
      docType: 'SALES_INVOICE',
      docId: invoice.id,
      docNumber: invoice.invoiceNumber,
      docDate: input.invoiceDate,
      customerId: customer.id,
      gstin: customer.gstin,
      placeOfSupply: customer.state,
      isInterState,
      taxableAmount,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      totalTax: cgstTotal + sgstTotal + igstTotal,
      grandTotal,
    },
  });

  return invoice;
}

/**
 * Record Customer Receipt and allocate to invoices
 */
export async function createReceipt(input: {
  companyId: string;
  customerId: string;
  receiptDate: Date;
  paymentMode: string;
  bankAccountId?: string;
  amount: number;
  referenceNo?: string;
  notes?: string;
  allocations: { salesInvoiceId: string; amount: number }[];
}) {
  const customer = await db.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new Error('Customer not found');

  const receiptNumber = await getNextDocumentNumber(input.companyId, 'RECEIPT');

  // 1. Create Receipt Record
  const receipt = await db.receipt.create({
    data: {
      companyId: input.companyId,
      receiptNumber,
      receiptDate: input.receiptDate,
      customerId: input.customerId,
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

  // 2. Update Invoice Paid / Balance amounts & Payment Status
  for (const alloc of input.allocations) {
    const inv = await db.salesInvoice.findUnique({ where: { id: alloc.salesInvoiceId } });
    if (inv) {
      const newPaid = Number((inv.paidAmount + alloc.amount).toFixed(2));
      const newBalance = Number(Math.max(0, inv.grandTotal - newPaid).toFixed(2));
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

      await db.salesInvoice.update({
        where: { id: inv.id },
        data: { paidAmount: newPaid, balanceAmount: newBalance, paymentStatus: newStatus },
      });
    }
  }

  // 3. Post Receipt Accounting Entry
  await postReceiptAccounting({
    companyId: input.companyId,
    receiptId: receipt.id,
    receiptNumber: receipt.receiptNumber,
    receiptDate: input.receiptDate,
    customerId: customer.id,
    customerName: customer.name,
    amount: input.amount,
    bankAccountId: input.bankAccountId,
    paymentMode: input.paymentMode,
  });

  return receipt;
}

export interface CreateQuotationInput {
  companyId: string;
  customerId: string;
  quotationDate: Date;
  validUntil: Date;
  salesperson?: string;
  reference?: string;
  terms?: string;
  notes?: string;
  items: SalesInvoiceItemInput[];
}

/**
 * Create a new Quotation with GST calculations
 */
export async function createQuotation(input: CreateQuotationInput) {
  const company = await db.company.findUnique({ where: { id: input.companyId } });
  const customer = await db.customer.findUnique({ where: { id: input.customerId } });
  if (!company || !customer) throw new Error('Company or Customer not found');

  const quotationNumber = await getNextDocumentNumber(input.companyId, 'QUOTATION');

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

    const gstRes = calculateGst(company.stateCode, customer.stateCode, itemTaxable, item.gstRate);

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

  const quotation = await db.quotation.create({
    data: {
      companyId: input.companyId,
      quotationNumber,
      quotationDate: input.quotationDate,
      validUntil: input.validUntil,
      customerId: input.customerId,
      salesperson: input.salesperson,
      reference: input.reference,
      status: 'SENT',
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      grandTotal,
      terms: input.terms,
      notes: input.notes,
      items: {
        create: processedItems,
      },
    },
    include: { items: true, customer: true },
  });

  return quotation;
}

export interface CreateSalesOrderInput {
  companyId: string;
  customerId: string;
  quotationId?: string;
  orderDate: Date;
  deliveryDate?: Date;
  poNumber?: string;
  poDate?: Date;
  vehicleNo?: string;
  terms?: string;
  notes?: string;
  items: SalesInvoiceItemInput[];
}

/**
 * Create a new Sales Order with GST calculations
 */
export async function createSalesOrder(input: CreateSalesOrderInput) {
  const company = await db.company.findUnique({ where: { id: input.companyId } });
  const customer = await db.customer.findUnique({ where: { id: input.customerId } });
  if (!company || !customer) throw new Error('Company or Customer not found');

  const orderNumber = await getNextDocumentNumber(input.companyId, 'SALES_ORDER');

  let subtotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems = input.items.map((item) => {
    const itemSubtotal = item.quantity * item.rate;
    const discount = item.discount || 0;
    const itemTaxable = Math.max(0, itemSubtotal - discount);

    const gstRes = calculateGst(company.stateCode, customer.stateCode, itemTaxable, item.gstRate);

    subtotal += itemSubtotal;
    taxableAmount += itemTaxable;
    cgstTotal += gstRes.cgstAmount;
    sgstTotal += gstRes.sgstAmount;
    igstTotal += gstRes.igstAmount;

    return {
      itemId: item.itemId,
      itemCode: item.itemCode,
      description: item.description,
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

  const salesOrder = await db.salesOrder.create({
    data: {
      companyId: input.companyId,
      orderNumber,
      orderDate: input.orderDate,
      deliveryDate: input.deliveryDate,
      poNumber: input.poNumber,
      poDate: input.poDate,
      vehicleNo: input.vehicleNo,
      customerId: input.customerId,
      quotationId: input.quotationId,
      status: 'CONFIRMED',
      subtotal: Number(subtotal.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      grandTotal,
      terms: input.terms,
      notes: input.notes,
      items: {
        create: processedItems,
      },
    },
    include: { items: true, customer: true },
  });

  if (input.quotationId) {
    await db.quotation.update({
      where: { id: input.quotationId },
      data: { status: 'CONVERTED' },
    });
  }

  return salesOrder;
}

/**
 * Convert Quotation to Sales Order
 */
export async function convertQuotationToSalesOrder(quotationId: string, companyId: string) {
  const quotation = await db.quotation.findUnique({
    where: { id: quotationId },
    include: { items: true },
  });
  if (!quotation) throw new Error('Quotation not found');

  const salesOrder = await createSalesOrder({
    companyId,
    customerId: quotation.customerId,
    quotationId: quotation.id,
    orderDate: new Date(),
    deliveryDate: new Date(Date.now() + 15 * 86400000),
    terms: quotation.terms || undefined,
    notes: quotation.notes || undefined,
    items: quotation.items.map((i) => ({
      itemId: i.itemId,
      itemCode: i.itemCode,
      description: i.description,
      hsnCode: i.hsnCode || undefined,
      quantity: i.quantity,
      unit: i.unit,
      rate: i.rate,
      discount: i.discount,
      gstRate: i.gstRate,
    })),
  });

  return salesOrder;
}

/**
 * Convert Sales Order to Sales Invoice
 */
export async function convertSalesOrderToInvoice(
  salesOrderId: string,
  companyId: string,
  extraDetails?: {
    invoiceNumber?: string;
    poNumber?: string;
    poDate?: Date;
    vehicleNo?: string;
    eWayBillNo?: string;
    netWeight?: string;
  }
) {
  const salesOrder = await db.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });
  if (!salesOrder) throw new Error('Sales Order not found');

  const invoice = await createSalesInvoice({
    companyId,
    customerId: salesOrder.customerId,
    salesOrderId: salesOrder.id,
    invoiceNumber: extraDetails?.invoiceNumber || undefined,
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 86400000),
    poNumber: extraDetails?.poNumber || salesOrder.poNumber || undefined,
    poDate: extraDetails?.poDate || salesOrder.poDate || undefined,
    vehicleNo: extraDetails?.vehicleNo || salesOrder.vehicleNo || undefined,
    eWayBillNo: extraDetails?.eWayBillNo || undefined,
    netWeight: extraDetails?.netWeight || undefined,
    notes: salesOrder.notes || undefined,
    items: salesOrder.items.map((i) => ({
      itemId: i.itemId,
      itemCode: i.itemCode,
      description: i.description,
      quantity: i.quantity,
      unit: i.unit,
      rate: i.rate,
      discount: i.discount,
      gstRate: i.gstRate,
    })),
  });

  await db.salesOrder.update({
    where: { id: salesOrderId },
    data: { status: 'INVOICED' },
  });

  return invoice;
}



