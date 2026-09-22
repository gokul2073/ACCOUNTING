import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';
    const query = searchParams.get('q') || '';

    const customers = await db.customer.findMany({
      where: {
        companyId,
        isActive: true,
        OR: query
          ? [
              { name: { contains: query } },
              { customerCode: { contains: query } },
              { gstin: { contains: query } },
            ]
          : undefined,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      { success: true, customers },
      { headers: { 'Cache-Control': 'public, max-age=5, stale-while-revalidate=30' } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await db.customer.create({
      data: {
        companyId: body.companyId || 'abc-engineering-company-id',
        customerCode: body.customerCode || `CUST-${Date.now().toString().slice(-4)}`,
        name: body.name,
        legalName: body.legalName,
        gstin: body.gstin,
        pan: body.pan,
        phone: body.phone,
        email: body.email,
        billingAddress: body.billingAddress,
        shippingAddress: body.shippingAddress,
        state: body.state || 'Maharashtra',
        stateCode: body.stateCode || '27',
        pinCode: body.pinCode || '400001',
        creditLimit: Number(body.creditLimit || 0),
        creditDays: Number(body.creditDays || 30),
        contactPerson: body.contactPerson,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
