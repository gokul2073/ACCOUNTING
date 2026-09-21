'use client';

import React, { useRef, useState } from 'react';
import { Printer, Download, X, Building2, FolderCheck, Trash2 } from 'lucide-react';
import { exportPdfFromElement } from '@/lib/pdfGenerator';

export interface QuotationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: any;
  onDeleteSuccess?: () => void;
}

function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'zero rupees only';

  const a = [
    '', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ',
    'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'hundred ' + (n % 100 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'thousand ' + (n % 1000 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'lakh ' + (n % 100000 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'crore ' + (n % 10000000 ? inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let str = inWords(integerPart).trim();
  if (decimalPart > 0) {
    str += ' and ' + inWords(decimalPart).trim() + ' paise';
  }
  return str;
}

export default function QuotationPdfModal({ isOpen, onClose, quotation, onDeleteSuccess }: QuotationPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [savingPdf, setSavingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen || !quotation) return null;

  const isInterState = quotation.customer?.stateCode && quotation.customer?.stateCode !== '33';
  const companyName = quotation.company?.name || 'BALAJI CONVEYORS';
  const companyGstin = quotation.company?.gstin || '33AANFB9381J1Z0';
  const companyStateCode = quotation.company?.stateCode || '33';
  const companyAddress = quotation.company?.address || '504/4 Chinnaelasagiri, Balaji nagar, Sipcot, Hosur - 635 126.';

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndDownloadPdf = async () => {
    if (!printRef.current) return;
    setSavingPdf(true);
    setSaveStatus(null);
    try {
      const docNo = quotation.quotationNumber || 'Quotation';
      const result = await exportPdfFromElement(printRef.current, docNo, companyName);
      setSaveStatus(result.message);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSaveStatus(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingPdf(false);
    }
  };

  const handleDeleteQuotation = async () => {
    if (!quotation?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Quotation ${quotation.quotationNumber}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/quotations/${quotation.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onClose();
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        alert(`Failed to delete quotation: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Delete quotation error:', err);
      alert(`Delete failed: ${err.message || 'Network error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const quotationDateStr = quotation.quotationDate
    ? new Date(quotation.quotationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : '';

  const validUntilStr = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : '';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print-backdrop">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Bar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm tracking-tight">Sales Quotation Preview</h3>
            <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono font-bold">
              {quotation.quotationNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndDownloadPdf}
              disabled={savingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{savingPdf ? 'Saving PDF...' : 'Download & Save PDF'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={handleDeleteQuotation}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="Delete Quotation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2 no-print">
            <FolderCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="truncate font-mono">{saveStatus}</span>
          </div>
        )}

        {/* Printable Voucher */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 printable-invoice-wrapper flex justify-center">
          {/* A4 Container with 1cm (10mm) outer margin gap */}
          <div
            className="bg-white text-black font-sans text-xs printable-invoice flex flex-col justify-between shadow-2xl p-[10mm] box-border"
            style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
            ref={printRef}
          >
            {/* Inner voucher box with solid black line on 4 sides */}
            <div className="border-2 border-black flex-1 flex flex-col justify-between box-border">
              <div>
                {/* Header */}
                <div className="grid grid-cols-12 border-b-2 border-black bg-slate-50">
                  <div className="col-span-3 p-2 text-[10px] leading-tight font-bold border-r-2 border-black flex flex-col justify-center">
                    <p>GSTIN : <span className="font-mono font-bold text-black">{companyGstin}</span></p>
                    <p className="mt-0.5">State Code : <span className="font-bold">{companyStateCode}</span></p>
                  </div>
                  <div className="col-span-6 p-2 text-center flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-black uppercase tracking-wider font-serif text-black">{companyName}</h1>
                    <p className="text-[10px] font-bold text-slate-900 mt-0.5">{companyAddress}</p>
                    <div className="mt-1 px-5 py-0.5 bg-black text-white font-extrabold text-xs tracking-widest uppercase rounded-sm shadow-sm">
                      SALES QUOTATION
                    </div>
                  </div>
                  <div className="col-span-3 p-2 text-right text-[10px] leading-tight font-bold border-l-2 border-black flex flex-col justify-center">
                    <p>Mobile: 9791525307</p>
                    <p className="mt-0.5">8870864617</p>
                  </div>
                </div>

                {/* Billed To / Sales Info */}
                <div className="grid grid-cols-12 border-b-2 border-black">
                  <div className="col-span-7 border-r-2 border-black p-0 flex flex-col justify-between">
                    <div className="bg-slate-100 border-b-2 border-black px-2 py-1 font-extrabold text-[10px] tracking-wider uppercase">
                      QUOTATION FOR (CUSTOMER)
                    </div>
                    <div className="p-2 text-[11px] leading-snug space-y-1">
                      <p><span className="font-bold">NAME : </span><strong className="font-extrabold text-black uppercase text-xs">{quotation.customer?.name}</strong></p>
                      <p className="text-[10.5px] font-medium text-slate-900">{quotation.customer?.billingAddress}</p>
                      <p className="text-[10.5px] font-bold text-black mt-1">
                        GST NO : <span className="font-mono">{quotation.customer?.gstin || 'URP'}</span>
                      </p>
                      <p className="text-[10.5px] font-bold text-black">
                        State Code : {quotation.customer?.stateCode || '33'}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-5 p-0 text-[10.5px] font-semibold">
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">QUOTATION NO:</div>
                      <div className="col-span-3 p-1 border-r border-black font-mono font-extrabold text-center text-blue-900">{quotation.quotationNumber}</div>
                      <div className="col-span-2 p-1 border-r border-black font-bold text-center bg-slate-50">DATE</div>
                      <div className="col-span-3 p-1 font-mono font-bold text-center">{quotationDateStr}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Your.Ref.No.</div>
                      <div className="col-span-3 p-1 border-r border-black font-mono text-center">{quotation.reference || ''}</div>
                      <div className="col-span-2 p-1 border-r border-black font-bold text-center bg-slate-50">VALID</div>
                      <div className="col-span-3 p-1 font-mono text-center">{validUntilStr}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Salesperson</div>
                      <div className="col-span-8 p-1 font-mono">{quotation.salesperson || 'Rajesh Sharma'}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Status</div>
                      <div className="col-span-8 p-1 font-mono text-emerald-800 font-bold">{quotation.status}</div>
                    </div>
                    <div className="grid grid-cols-12">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Net Weight:</div>
                      <div className="col-span-8 p-1 font-mono"></div>
                    </div>
                  </div>
                </div>

                {/* Items Table Grid */}
                <table className="w-full text-xs border-collapse border-b-2 border-black">
                  <thead>
                    <tr className="bg-slate-100 font-extrabold text-[10.5px] text-center border-b-2 border-black">
                      <th className="p-1.5 border-r border-black w-8">#</th>
                      <th className="p-1.5 border-r border-black text-left">Description</th>
                      <th className="p-1.5 border-r border-black w-24">HSN/SAC</th>
                      <th className="p-1.5 border-r border-black w-20">Quantity</th>
                      <th className="p-1.5 border-r border-black w-24 text-right">Rate</th>
                      <th className="p-1.5 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {quotation.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="text-center font-medium">
                        <td className="p-1.5 border-r border-black text-center font-bold">{idx + 1}</td>
                        <td className="p-1.5 border-r border-black text-left font-bold text-slate-950">
                          {item.description || item.item?.name}
                        </td>
                        <td className="p-1.5 border-r border-black font-mono font-bold">{item.hsnCode || '7308'}</td>
                        <td className="p-1.5 border-r border-black font-bold">
                          {item.quantity} {item.unit || 'Nos'}
                        </td>
                        <td className="p-1.5 border-r border-black font-mono text-right">{item.rate.toFixed(2)}</td>
                        <td className="p-1.5 font-mono text-right font-bold text-black">{item.taxableValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                {/* Account Details & Totals */}
                <div className="grid grid-cols-12 border-t-2 border-b-2 border-black">
                  <div className="col-span-7 border-r-2 border-black p-0 flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-100 border-b border-black px-2 py-1 font-extrabold text-[10px] text-center uppercase tracking-wider">
                        ACCOUNT DETAILS
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">BANK NAME</div>
                        <div className="col-span-7 p-1 font-bold">IDBI BANK , HOSUR</div>
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">ACCOUNT NUMBER</div>
                        <div className="col-span-7 p-1 font-mono font-bold text-black">0213102000024824</div>
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">IFSC CODE</div>
                        <div className="col-span-7 p-1 font-mono font-bold text-black">IBKL0000213</div>
                      </div>
                    </div>
                    <div className="p-2 text-[10.5px]">
                      <span className="font-bold uppercase">TOTAL VALUE IN WORDS : </span>
                      <span className="font-bold italic font-mono text-black">{numberToWordsINR(quotation.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="col-span-5 p-0 text-[10.5px] font-semibold">
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-6 p-1 border-r border-black font-bold uppercase bg-slate-50">TOTAL</div>
                      <div className="col-span-6 p-1 text-right font-mono font-bold">{quotation.taxableAmount.toFixed(2)}</div>
                    </div>
                    {!isInterState ? (
                      <>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">SGST 9%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{quotation.sgstTotal.toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">CGST 9%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{quotation.cgstTotal.toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">IGST 18%</div>
                          <div className="col-span-6 p-1 text-right font-mono">0.00</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">SGST 0%</div>
                          <div className="col-span-6 p-1 text-right font-mono">0.00</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">CGST 0%</div>
                          <div className="col-span-6 p-1 text-right font-mono">0.00</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">IGST 18%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{quotation.igstTotal.toFixed(2)}</div>
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-12 bg-slate-100 font-bold border-t border-black">
                      <div className="col-span-6 p-1 border-r border-black font-extrabold uppercase">GRAND TOTAL</div>
                      <div className="col-span-6 p-1 text-right font-mono font-black text-xs text-black">{quotation.grandTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* GST Legal Certification Text */}
                <div className="p-2 text-[9px] text-justify leading-tight border-b-2 border-black text-slate-800">
                  We certify that our registration certificate under the GST Act 2017 is in force on the date on which the supply of goods specified in this Sales Quotation is made by us & the transaction covered by this Sales Quotation has been effected by us. E.&.O.E.
                </div>

                {/* Footer Signatory Box */}
                <div className="grid grid-cols-2 p-3 text-[10.5px]">
                  <div className="flex flex-col justify-between">
                    <p className="font-bold text-slate-900">Enclosures: Sales Quotation</p>
                    <div className="mt-8 text-[9px] text-slate-500 font-mono">
                      System Generated Quotation
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end min-h-[90px]">
                    <p className="font-extrabold uppercase text-xs text-black">For {companyName}</p>
                    
                    {/* Signature & Stamp Space */}
                    <div className="my-6 border-b border-dashed border-black w-48 text-center text-[9px] text-slate-400 pb-1">
                      ( Stamp / Signature Space )
                    </div>
                    
                    <p className="font-bold text-[10.5px] text-black">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
