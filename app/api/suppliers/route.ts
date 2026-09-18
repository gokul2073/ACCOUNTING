import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || 'abc-engineering-company-id';
    const query = searchParams.get('q') || '';

    const suppliers = await db.supplier.findMany({
      where: {
        companyId,
        isActive: true,
        OR: query
          ? [
              { name: { contains: query } },
              { supplierCode: { contains: query } },
              { gstin: { contains: query } },
            ]
          : undefined,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supplier = await db.supplier.create({
      data: {
        companyId: body.companyId || 'abc-engineering-company-id',
        supplierCode: body.supplierCode || `SUPP-${Date.now().toString().slice(-4)}`,
        name: body.name,
        legalName: body.legalName,
        gstin: body.gstin,
        pan: body.pan,
        phone: body.phone,
        email: body.email,
        address: body.address,
        state: body.state || 'Maharashtra',
        stateCode: body.stateCode || '27',
        pinCode: body.pinCode || '400001',
        creditDays: Number(body.creditDays || 30),
        contactPerson: body.contactPerson,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
