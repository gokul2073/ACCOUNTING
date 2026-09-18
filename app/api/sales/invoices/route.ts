import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSalesInvoice } from '@/modules/sales/pipeline';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const invoices = await db.salesInvoice.findMany({
      where: { companyId },
      include: {
        customer: true,
        items: { include: { item: true } },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const invoice = await createSalesInvoice({
      companyId: body.companyId || 'abc-engineering-company-id',
      customerId: body.customerId,
      warehouseId: body.warehouseId || 'wh-main-godown',
      invoiceDate: new Date(body.invoiceDate || Date.now()),
      dueDate: new Date(body.dueDate || Date.now()),
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Sales Invoice Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create sales invoice' }, { status: 400 });
  }
}
