import React, { useRef, useState } from 'react';
import { Printer, Download, X, Building2, FolderCheck, Trash2, Edit3 } from 'lucide-react';
import { exportPdfFromElement } from '@/lib/pdfGenerator';

export interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
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

export default function InvoicePdfModal({ isOpen, onClose, invoice: initialInvoice, onDeleteSuccess }: InvoicePdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<any>(initialInvoice);
  const [savingPdf, setSavingPdf] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingNo, setEditingNo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  React.useEffect(() => {
    setInvoice(initialInvoice);
  }, [initialInvoice]);

  if (!isOpen || !invoice) return null;

  const isInterState = invoice.isInterState;
  const companyName = invoice.company?.name || 'BALAJI CONVEYORS';
  const companyGstin = invoice.company?.gstin || '33AANFB9381J1Z0';
  const companyStateCode = invoice.company?.stateCode || '33';
  const companyAddress = invoice.company?.address || '504/4 Chinnaelasagiri, Balaji nagar, Sipcot, Hosur - 635 126.';

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndDownloadPdf = async () => {
    if (!printRef.current) return;
    setSavingPdf(true);
    setSaveStatus(null);
    try {
      const docNo = invoice.invoiceNumber || 'Invoice';
      const result = await exportPdfFromElement(printRef.current, docNo, companyName);
      setSaveStatus(result.message);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setSaveStatus(`Failed to generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingPdf(false);
    }
  };

async function safeJsonParse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  const text = await res.text();
  const titleMatch = text.match(/<title>(.*?)<\/title>/i);
  const errorMessage = titleMatch ? titleMatch[1] : text.slice(0, 150);
  throw new Error(`Server Error (${res.status}): ${errorMessage}`);
}

  const handleEditInvoiceNumber = async () => {
    const newNo = window.prompt('Enter new Tax Invoice Number:', invoice.invoiceNumber);
    if (!newNo || newNo.trim() === '' || newNo.trim() === invoice.invoiceNumber) return;

    setEditingNo(true);
    try {
      const res = await fetch(`/api/sales/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNumber: newNo.trim() }),
      });
      const data = await safeJsonParse(res);
      if (data.success) {
        setInvoice({ ...invoice, invoiceNumber: newNo.trim() });
        setSaveStatus(`Invoice number updated to ${newNo.trim()}`);
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        alert(`Failed to update invoice number: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message || 'Network error'}`);
    } finally {
      setEditingNo(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Invoice ${invoice.invoiceNumber}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      const data = await safeJsonParse(res);
      if (data.success) {
        onClose();
        if (onDeleteSuccess) onDeleteSuccess();
      } else {
        alert(`Failed to delete invoice: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Delete invoice error:', err);
      alert(`Delete failed: ${err.message || 'Network error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const productItems = (invoice.items || []).filter(
    (item: any) => item.itemCode !== 'SRV-TRANSPORT' && !item.description?.toLowerCase().includes('freight & transport')
  );

  const legacyTransportItem = (invoice.items || []).find(
    (item: any) => item.itemCode === 'SRV-TRANSPORT' || item.description?.toLowerCase().includes('freight & transport')
  );

  const transportCharge = Number(
    (invoice.transportCharge !== undefined && invoice.transportCharge > 0
      ? invoice.transportCharge
      : legacyTransportItem
      ? legacyTransportItem.taxableValue || legacyTransportItem.totalAmount
      : 0
    ).toFixed(2)
  );

  const productSubtotal = Number(
    productItems
      .reduce(
        (acc: number, item: any) =>
          acc + (item.taxableValue !== undefined ? item.taxableValue : item.quantity * item.rate - (item.discount || 0)),
        0
      )
      .toFixed(2)
  );

  const taxableValue = Number((productSubtotal + transportCharge).toFixed(2));

  const invoiceDateStr = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : '';

  const poDateStr = invoice.poDate
    ? new Date(invoice.poDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : '';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print-backdrop">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Actions Header */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm tracking-tight">GST Tax Invoice Preview</h3>
            <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono font-bold">
              {invoice.invoiceNumber}
            </span>
            <button
              onClick={handleEditInvoiceNumber}
              disabled={editingNo}
              className="p-1 hover:bg-slate-800 text-blue-300 hover:text-white rounded transition-all cursor-pointer"
              title="Edit Invoice Number"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
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
              onClick={handleDeleteInvoice}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="Delete Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete Invoice'}</span>
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

        {/* Printable Invoice Container */}
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
                {/* Company Header Bar */}
                <div className="grid grid-cols-12 border-b-2 border-black bg-slate-50/80">
                  <div className="col-span-3 p-2.5 text-[10px] leading-tight font-bold border-r-2 border-black flex flex-col justify-center">
                    <p className="text-slate-700">GSTIN : <span className="font-mono font-extrabold text-black text-[10.5px]">{companyGstin}</span></p>
                    <p className="mt-1 text-slate-700">State Code : <span className="font-extrabold text-black">{companyStateCode}</span></p>
                  </div>
                  <div className="col-span-6 p-2 text-center flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-black uppercase tracking-wider font-serif text-black">{companyName}</h1>
                    <p className="text-[9.5px] font-semibold text-slate-700 tracking-tight">Manufacturers of Conveyors & Automation Systems</p>
                    <p className="text-[9.5px] font-medium text-slate-800 mt-0.5">{companyAddress}</p>
                    <div className="mt-1 px-6 py-0.5 bg-black text-white font-black text-xs tracking-widest uppercase rounded-sm shadow-sm">
                      GST TAX INVOICE
                    </div>
                  </div>
                  <div className="col-span-3 p-2.5 text-right text-[10px] leading-tight font-bold border-l-2 border-black flex flex-col justify-center">
                    <p className="text-slate-700">Mobile: <span className="font-mono font-extrabold text-black">9791525307</span></p>
                    <p className="mt-1 text-slate-700"><span className="font-mono font-extrabold text-black">8870864617</span></p>
                  </div>
                </div>

                {/* Receiver Info & Invoice Metadata */}
                <div className="grid grid-cols-12 border-b-2 border-black">
                  {/* Receiver Info */}
                  <div className="col-span-7 border-r-2 border-black p-0 flex flex-col justify-between">
                    <div className="bg-slate-100 border-b-2 border-black px-2.5 py-1 font-extrabold text-[10px] tracking-wider uppercase text-slate-900">
                      BUYER (BILL TO) / RECEIVER DETAILS
                    </div>
                    <div className="p-2.5 text-[11px] leading-snug space-y-1 flex-1">
                      <p><span className="font-bold text-slate-600">NAME : </span><strong className="font-black text-black uppercase text-xs">{invoice.customer?.name}</strong></p>
                      <p className="text-[10.5px] font-medium text-slate-800">{invoice.billingAddress || invoice.customer?.billingAddress}</p>
                      <p className="text-[10.5px] font-bold text-black mt-1">
                        GST NO : <span className="font-mono font-extrabold">{invoice.customer?.gstin || invoice.gstin || 'URP'}</span>
                      </p>
                      <p className="text-[10.5px] font-bold text-black">
                        State Code : {invoice.customer?.stateCode || '33'} ({invoice.placeOfSupply || 'Tamil Nadu'})
                      </p>
                    </div>
                  </div>

                  {/* Metadata Table Grid */}
                  <div className="col-span-5 p-0 text-[10.5px] font-semibold">
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">INVOICE NO:</div>
                      <div className="col-span-3 p-1 border-r border-black font-mono font-black text-center text-blue-900">{invoice.invoiceNumber}</div>
                      <div className="col-span-2 p-1 border-r border-black font-bold text-center bg-slate-50">DATE</div>
                      <div className="col-span-3 p-1 font-mono font-bold text-center">{invoiceDateStr}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Your.PO.No.</div>
                      <div className="col-span-3 p-1 border-r border-black font-mono font-bold text-center">{invoice.poNumber || invoice.reference || ''}</div>
                      <div className="col-span-2 p-1 border-r border-black font-bold text-center bg-slate-50">DATE</div>
                      <div className="col-span-3 p-1 font-mono text-center">{poDateStr}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Vehicle No.</div>
                      <div className="col-span-8 p-1 font-mono font-extrabold text-slate-900">{invoice.vehicleNo || ''}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">E-Way Bill</div>
                      <div className="col-span-8 p-1 font-mono font-bold">{invoice.eWayBillNo || ''}</div>
                    </div>
                    <div className="grid grid-cols-12">
                      <div className="col-span-4 p-1 border-r border-black font-bold bg-slate-50">Net Weight:</div>
                      <div className="col-span-8 p-1 font-mono">{invoice.netWeight || ''}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table Grid */}
                <table className="w-full text-xs border-collapse border-b-2 border-black">
                  <thead>
                    <tr className="bg-slate-100 font-black text-[10.5px] text-center border-b-2 border-black uppercase tracking-wider">
                      <th className="p-1.5 border-r border-black w-8">#</th>
                      <th className="p-1.5 border-r border-black text-left">Description of Goods</th>
                      <th className="p-1.5 border-r border-black w-24">HSN/SAC</th>
                      <th className="p-1.5 border-r border-black w-20">Quantity</th>
                      <th className="p-1.5 border-r border-black w-24 text-right">Rate (₹)</th>
                      <th className="p-1.5 w-28 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {productItems.map((item: any, idx: number) => (
                      <tr key={idx} className="text-center font-medium even:bg-slate-50/40">
                        <td className="p-2 border-r border-black text-center font-bold text-slate-700">{idx + 1}</td>
                        <td className="p-2 border-r border-black text-left font-bold text-slate-950">
                          {item.description || item.item?.name}
                        </td>
                        <td className="p-2 border-r border-black font-mono font-bold text-slate-800">{item.hsnCode || '7308'}</td>
                        <td className="p-2 border-r border-black font-bold">
                          {item.quantity} {item.unit || 'Nos'}
                        </td>
                        <td className="p-2 border-r border-black font-mono text-right font-medium">{item.rate.toFixed(2)}</td>
                        <td className="p-2 font-mono text-right font-black text-black">{item.taxableValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                {/* Account Details & Totals Section */}
                <div className="grid grid-cols-12 border-t-2 border-b-2 border-black">
                  {/* Left Side: Bank Details & Words */}
                  <div className="col-span-7 border-r-2 border-black p-0 flex flex-col justify-between">
                    <div>
                      <div className="bg-slate-100 border-b border-black px-2.5 py-1 font-extrabold text-[10px] text-center uppercase tracking-wider">
                        BANK ACCOUNT DETAILS
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">BANK NAME</div>
                        <div className="col-span-7 p-1 font-extrabold text-black">IDBI BANK , HOSUR</div>
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">ACCOUNT NUMBER</div>
                        <div className="col-span-7 p-1 font-mono font-extrabold text-black">0213102000024824</div>
                      </div>
                      <div className="grid grid-cols-12 border-b border-black text-[10.5px]">
                        <div className="col-span-5 p-1 font-bold border-r border-black bg-slate-50">IFSC CODE</div>
                        <div className="col-span-7 p-1 font-mono font-extrabold text-black">IBKL0000213</div>
                      </div>
                    </div>
                    <div className="p-2 text-[10.5px] bg-slate-50/50 border-t border-black">
                      <span className="font-extrabold uppercase text-slate-800">TOTAL VALUE IN WORDS : </span>
                      <span className="font-extrabold italic font-mono text-black uppercase">{numberToWordsINR(invoice.grandTotal)}</span>
                    </div>
                  </div>

                  {/* Right Side: Totals & Taxes */}
                  <div className="col-span-5 p-0 text-[10.5px] font-semibold">
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-6 p-1 border-r border-black font-bold uppercase bg-slate-50">PRODUCT TOTAL</div>
                      <div className="col-span-6 p-1 text-right font-mono font-bold">{productSubtotal.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black">
                      <div className="col-span-6 p-1 border-r border-black font-bold uppercase bg-amber-50/50 text-slate-900">TRANSPORT CHARGES</div>
                      <div className="col-span-6 p-1 text-right font-mono font-bold">{transportCharge.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-black bg-slate-100 font-extrabold">
                      <div className="col-span-6 p-1 border-r border-black uppercase">TAXABLE VALUE</div>
                      <div className="col-span-6 p-1 text-right font-mono font-bold">{taxableValue.toFixed(2)}</div>
                    </div>
                    {!isInterState ? (
                      <>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">SGST 9%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{invoice.sgstTotal.toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">CGST 9%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{invoice.cgstTotal.toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold text-slate-400">IGST 18%</div>
                          <div className="col-span-6 p-1 text-right font-mono text-slate-400">0.00</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold text-slate-400">SGST 0%</div>
                          <div className="col-span-6 p-1 text-right font-mono text-slate-400">0.00</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold text-slate-400">CGST 0%</div>
                          <div className="col-span-6 p-1 text-right font-mono text-slate-400">0.00</div>
                        </div>
                        <div className="grid grid-cols-12 border-b border-black">
                          <div className="col-span-6 p-1 border-r border-black font-bold">IGST 18%</div>
                          <div className="col-span-6 p-1 text-right font-mono">{invoice.igstTotal.toFixed(2)}</div>
                        </div>
                      </>
                    )}
                    {invoice.roundOff ? (
                      <div className="grid grid-cols-12 border-b border-black text-[10px]">
                        <div className="col-span-6 p-1 border-r border-black font-bold">ROUND OFF</div>
                        <div className="col-span-6 p-1 text-right font-mono">{invoice.roundOff.toFixed(2)}</div>
                      </div>
                    ) : null}
                    <div className="grid grid-cols-12 bg-black text-white font-bold border-t-2 border-black">
                      <div className="col-span-6 p-1 border-r border-white font-black uppercase text-xs tracking-wider">TOTAL VALUE</div>
                      <div className="col-span-6 p-1 text-right font-mono font-black text-xs text-amber-300">₹{invoice.grandTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* GST Legal Certification Text */}
                <div className="p-2 text-[9px] text-justify leading-tight border-b-2 border-black text-slate-800">
                  We certify that our registration certificate under the GST Act 2017 is in force on the date on which the supply of goods specified in this Tax Invoice is made by us & the transaction covered by this Tax Invoice has been effected by us and it shall be accounted for in the turnover of supplies while filing return. Further certified that the particulars given above are true and correct. Interest @18% p.a. charged on outstanding overdue accounts. E.&.O.E.
                </div>

                {/* Footer Signatory Box */}
                <div className="grid grid-cols-2 p-3 text-[10.5px]">
                  <div className="flex flex-col justify-between">
                    <p className="font-bold text-slate-900">Enclosures: Original Tax Invoice</p>
                    <div className="mt-8 text-[9px] text-slate-500 font-mono">
                      System Generated GST Tax Invoice
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end min-h-[95px]">
                    <p className="font-black uppercase text-xs text-black">For {companyName}</p>
                    
                    {/* Signature & Stamp Space */}
                    <div className="my-5 border-b border-dashed border-black w-52 text-center text-[9px] text-slate-400 pb-1">
                      ( Stamp / Signature Space )
                    </div>
                    
                    <p className="font-extrabold text-[10.5px] text-black">Authorized Signatory</p>
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

