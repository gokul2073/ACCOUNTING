import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = await db.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { item: true } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quotation });
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

    const existing = await db.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // 1. Unlink quotationId from sales orders and sales invoices
      await tx.salesOrder.updateMany({
        where: { quotationId: id },
        data: { quotationId: null },
      });
      await tx.salesInvoice.updateMany({
        where: { quotationId: id },
        data: { quotationId: null },
      });

      // 2. Delete quotation line items
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      // 3. Delete Quotation record
      await tx.quotation.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error: any) {
    console.error('Delete Quotation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete Quotation' }, { status: 500 });
  }
}

