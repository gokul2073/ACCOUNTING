import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await db.salesInvoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { item: true } },
        company: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Sales Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.salesInvoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Atomic multi-table cleanup inside a transaction to prevent FK constraint failures
    await db.$transaction(async (tx) => {
      // 1. Delete associated receipt allocations
      await tx.receiptAllocation.deleteMany({
        where: { salesInvoiceId: id },
      });

      // 2. Unlink or delete associated credit notes
      await tx.creditNote.updateMany({
        where: { salesInvoiceId: id },
        data: { salesInvoiceId: null },
      });

      // 3. Delete stock transactions recorded for this invoice
      await tx.stockTransaction.deleteMany({
        where: { referenceType: 'SalesInvoice', referenceId: id },
      });

      // 4. Delete journal entries & lines posted for this invoice
      const journalEntries = await tx.journalEntry.findMany({
        where: { referenceType: 'SalesInvoice', referenceId: id },
        select: { id: true },
      });
      const jeIds = journalEntries.map((je) => je.id);
      if (jeIds.length > 0) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: { in: jeIds } },
        });
        await tx.journalEntry.deleteMany({
          where: { id: { in: jeIds } },
        });
      }

      // 5. Delete GST audit transaction entries
      await tx.gstTransaction.deleteMany({
        where: { docType: 'SALES_INVOICE', docId: id },
      });

      // 6. Delete invoice line items
      await tx.salesInvoiceItem.deleteMany({
        where: { salesInvoiceId: id },
      });

      // 7. Reset linked Sales Order status to CONFIRMED if present
      if (existing.salesOrderId) {
        await tx.salesOrder.update({
          where: { id: existing.salesOrderId },
          data: { status: 'CONFIRMED' },
        });
      }

      // 8. Delete the Sales Invoice record
      await tx.salesInvoice.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Delete Invoice Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete invoice' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { invoiceNumber, vehicleNo, poNumber, poDate, eWayBillNo, netWeight, transportCharge, transportGstRate, notes } = body;

    const existing = await db.salesInvoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      // If invoiceNumber changed, update references in JournalEntry & GstTransaction
      if (invoiceNumber && invoiceNumber.trim() !== existing.invoiceNumber) {
        const newNo = invoiceNumber.trim();
        await tx.journalEntry.updateMany({
          where: { referenceType: 'SalesInvoice', referenceId: id },
          data: { voucherNumber: newNo, referenceNumber: newNo },
        });
        await tx.gstTransaction.updateMany({
          where: { docType: 'SALES_INVOICE', docId: id },
          data: { docNumber: newNo },
        });
      }

      return await tx.salesInvoice.update({
        where: { id },
        data: {
          ...(invoiceNumber ? { invoiceNumber: invoiceNumber.trim() } : {}),
          ...(vehicleNo !== undefined ? { vehicleNo } : {}),
          ...(poNumber !== undefined ? { poNumber } : {}),
          ...(poDate !== undefined ? { poDate: poDate ? new Date(poDate) : null } : {}),
          ...(eWayBillNo !== undefined ? { eWayBillNo } : {}),
          ...(netWeight !== undefined ? { netWeight } : {}),
          ...(transportCharge !== undefined ? { transportCharge: parseFloat(transportCharge) || 0 } : {}),
          ...(transportGstRate !== undefined ? { transportGstRate: parseFloat(transportGstRate) || 18 } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
        include: {
          customer: true,
          items: { include: { item: true } },
          company: true,
        },
      });
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error: any) {
    console.error('Update Invoice Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}


