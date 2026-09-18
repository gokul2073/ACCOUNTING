import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let company = await db.company.findFirst({
      include: {
        bankAccounts: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Fetch Company Error:', error);
    return NextResponse.json({ error: 'Failed to fetch company details' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, legalName, address, city, state, stateCode, pinCode, phone, email, website, gstin, pan, cin, bankName, accountNumber, ifscCode, branch } = body;

    let company = await db.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: 'Company record not found' }, { status: 404 });
    }

    const updatedCompany = await db.company.update({
      where: { id: company.id },
      data: {
        name,
        legalName,
        address,
        city,
        state,
        stateCode,
        pinCode,
        phone,
        email,
        website,
        gstin,
        pan,
        cin,
      },
    });

    // Update primary bank account if provided
    if (bankName || accountNumber || ifscCode) {
      const primaryBank = await db.bankAccount.findFirst({
        where: { companyId: company.id },
      });

      if (primaryBank) {
        await db.bankAccount.update({
          where: { id: primaryBank.id },
          data: {
            bankName: bankName || primaryBank.bankName,
            accountName: name || primaryBank.accountName,
            accountNumber: accountNumber || primaryBank.accountNumber,
            ifscCode: ifscCode || primaryBank.ifscCode,
            branch: branch || primaryBank.branch,
          },
        });
      }
    }

    return NextResponse.json({ success: true, company: updatedCompany });
  } catch (error: any) {
    console.error('Update Company Error:', error);
    return NextResponse.json({ error: 'Failed to update company details' }, { status: 500 });
  }
}
