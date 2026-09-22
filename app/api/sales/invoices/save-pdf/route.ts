import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    const safeDocNo = docNo.replace(/[\\/:*?"<>|]/g, '_');
    const base64Data = pdfBase64.includes('base64,')
      ? pdfBase64.split('base64,')[1]
      : pdfBase64;
    const buffer = Buffer.from(base64Data.trim(), 'base64');

    let filePath: string | null = null;
    try {
      const baseDir = process.env.VERCEL
        ? os.tmpdir()
        : path.join('C:', 'Users', 'gokul', 'OneDrive', 'Documents', 'bc_invoice', 'BC_Invoice');
      const targetDir = process.env.VERCEL ? baseDir : path.join(baseDir, cleanCompanyName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      filePath = path.join(targetDir, `${safeDocNo}.pdf`);
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn('Local file write skipped (Vercel serverless or read-only filesystem):', fsErr);
    }

    return NextResponse.json({
      success: true,
      filePath: filePath || 'Browser Download',
      message: filePath ? `Document PDF successfully saved to ${filePath}` : 'Document PDF ready for download',
    });
  } catch (error: any) {
    console.error('Save PDF Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save document PDF' }, { status: 500 });
  }
}
