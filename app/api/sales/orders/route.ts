import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSalesOrder } from '@/modules/sales/pipeline';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const salesOrders = await db.salesOrder.findMany({
      where: { companyId },
      include: {
        customer: true,
        items: { include: { item: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    return NextResponse.json({ success: true, salesOrders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const salesOrder = await createSalesOrder({
      companyId: body.companyId || 'abc-engineering-company-id',
      customerId: body.customerId,
      quotationId: body.quotationId,
      orderDate: new Date(body.orderDate || Date.now()),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      terms: body.terms,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, salesOrder });
  } catch (error: any) {
    console.error('Sales Order Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sales order' }, { status: 400 });
  }
}
