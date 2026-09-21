import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await db.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { item: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
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

    const existing = await db.salesOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Sales Order not found' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      // 1. Unlink salesOrderId from any sales invoices
      await tx.salesInvoice.updateMany({
        where: { salesOrderId: id },
        data: { salesOrderId: null },
      });

      // 2. Unlink delivery challans
      await tx.deliveryChallan.updateMany({
        where: { salesOrderId: id },
        data: { salesOrderId: null },
      });

      // 3. Reset linked quotation status to SENT if exists
      if (existing.quotationId) {
        await tx.quotation.update({
          where: { id: existing.quotationId },
          data: { status: 'SENT' },
        });
      }

      // 4. Delete sales order line items
      await tx.salesOrderItem.deleteMany({
        where: { salesOrderId: id },
      });

      // 5. Delete Sales Order record
      await tx.salesOrder.delete({
        where: { id },
      });
    });

    return NextResponse.json({ success: true, message: 'Sales Order deleted successfully' });
  } catch (error: any) {
    console.error('Delete Sales Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete Sales Order' }, { status: 500 });
  }
}

