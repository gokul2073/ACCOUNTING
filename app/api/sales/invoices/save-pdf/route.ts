import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { invoiceNumber, docNumber, companyName, pdfBase64 } = await req.json();
    const docNo = docNumber || invoiceNumber;

    if (!docNo || !pdfBase64) {
      return NextResponse.json(
        { error: 'Document number and PDF base64 content are required' },
        { status: 400 }
      );
    }

    const cleanCompanyName = (companyName || 'BALAJI CONVEYORS')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim();

    const baseDir = path.join('C:', 'Users', 'gokul', 'OneDrive', 'Documents', 'bc_invoice', 'BC_Invoice');
    const targetDir = path.join(baseDir, cleanCompanyName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeDocNo = docNo.replace(/[\\/:*?"<>|]/g, '_');
    const filePath = path.join(targetDir, `${safeDocNo}.pdf`);

    // Robustly extract base64 data regardless of data URI headers (e.g. data:application/pdf;filename=...;base64,)
    const base64Data = pdfBase64.includes('base64,')
      ? pdfBase64.split('base64,')[1]
      : pdfBase64;

    const buffer = Buffer.from(base64Data.trim(), 'base64');

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath,
      message: `Document PDF successfully saved to ${filePath}`,
    });
  } catch (error: any) {
    console.error('Save PDF Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save document PDF' }, { status: 500 });
  }
}
