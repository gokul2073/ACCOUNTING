import { toPng, toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface ExportPdfResult {
  success: boolean;
  message: string;
  filePath?: string;
}

/**
 * High-fidelity A4 PDF Exporter using browser-native rendering.
 * Captures the rendered DOM node directly with html-to-image to guarantee 100% visual fidelity.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  docNumber: string,
  companyName: string
): Promise<ExportPdfResult> {
  if (!element) {
    throw new Error('Target printable element not found');
  }

  try {
    // Render the visible element directly to PNG using html-to-image
    let imgData: string;
    try {
      imgData = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
    } catch (renderErr) {
      // Fallback to toCanvas if toPng fails
      const canvas = await toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      imgData = canvas.toDataURL('image/png', 1.0);
    }

    if (!imgData || imgData === 'data:,' || imgData.length < 100) {
      throw new Error('Canvas rendering yielded an empty image');
    }

    // Create A4 PDF with jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = 210;
    const pageHeight = 297;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add rendered invoice image to A4 PDF page
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pageHeight));

    // Handle multipage overflow if content exceeds 1 page
    let heightLeft = pdfHeight - pageHeight;
    let position = -pageHeight;
    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
    }

    const docNo = docNumber || 'document';
    const fileName = `${docNo.replace(/[\\/:*?"<>|]/g, '_')}.pdf`;

    // 1. Trigger browser download
    pdf.save(fileName);

    // 2. Send Base64 copy to server API for disk saving
    const pdfBase64 = pdf.output('datauristring');
    try {
      const res = await fetch('/api/sales/invoices/save-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNumber: docNo,
          companyName: companyName,
          pdfBase64,
        }),
      });

      const data = await res.json();
      if (data.success) {
        return {
          success: true,
          message: `Downloaded & Saved to disk: ${data.filePath}`,
          filePath: data.filePath,
        };
      } else {
        return {
          success: true,
          message: `Downloaded to browser. (Disk save note: ${data.error})`,
        };
      }
    } catch (apiErr: any) {
      return {
        success: true,
        message: 'Downloaded to browser.',
      };
    }
  } catch (err: any) {
    console.error('PDF export error:', err);
    throw new Error(`PDF Generation failed: ${err.message || err}`);
  }
}
