import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createQuotation } from '@/modules/sales/pipeline';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';

    const quotations = await db.quotation.findMany({
      where: { companyId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            state: true,
          },
        },
        items: {
          select: {
            id: true,
            itemId: true,
            itemCode: true,
            description: true,
            hsnCode: true,
            quantity: true,
            unit: true,
            rate: true,
            discount: true,
            taxableValue: true,
            gstRate: true,
            cgstAmount: true,
            sgstAmount: true,
            igstAmount: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { quotationDate: 'desc' },
    });

    return NextResponse.json(
      { success: true, quotations },
      { headers: { 'Cache-Control': 'public, max-age=3, stale-while-revalidate=15' } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const quotation = await createQuotation({
      companyId: body.companyId || 'abc-engineering-company-id',
      customerId: body.customerId,
      quotationDate: new Date(body.quotationDate || Date.now()),
      validUntil: new Date(body.validUntil || Date.now() + 30 * 86400000),
      salesperson: body.salesperson,
      reference: body.reference,
      terms: body.terms,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, quotation });
  } catch (error: any) {
    console.error('Quotation Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create quotation' }, { status: 400 });
  }
}
