'use client';

import React, { useRef } from 'react';
import { Printer, Download, X, Building2, CheckCircle } from 'lucide-react';

export interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function InvoicePdfModal({ isOpen, onClose, invoice }: InvoicePdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInterState = invoice.isInterState;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Actions */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm tracking-tight">GST Tax Invoice Preview</h3>
            <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100" ref={printRef}>
          <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-300 text-slate-900 max-w-3xl mx-auto printable-invoice">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">TAX INVOICE</h1>
                <p className="text-sm font-bold text-blue-900 mt-1">BALAJI CONVEYORS</p>
                <p className="text-xs text-slate-600">504/4 Chinnaelasagiri, Balaji nagar, Sipcot, Hosur, 635 126.</p>
                <p className="text-xs text-slate-600">Mobile: 9791525307, 8870864617</p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  GSTIN: <span className="font-mono text-blue-900">33AANFB9381J1Z0</span> | State Code: 33
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block p-2 bg-slate-50 border border-slate-200 rounded text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase">Invoice No</p>
                  <p className="text-base font-bold text-slate-900 font-mono">{invoice.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Date: <strong>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</strong>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Place of Supply: <strong>{invoice.placeOfSupply}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Billed To / Shipped To */}
            <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-md p-3 mb-4 bg-slate-50/50">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Billed To (Customer)</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{invoice.customer?.name}</p>
                <p className="text-[11px] text-slate-600">{invoice.billingAddress || invoice.customer?.billingAddress}</p>
                <p className="text-[11px] text-slate-800 font-bold mt-1">
                  GSTIN: <span className="font-mono">{invoice.customer?.gstin || 'URP'}</span> | State: {invoice.customer?.state} ({invoice.customer?.stateCode})
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Transport & Supply Details</p>
                <p className="text-[11px] text-slate-700">Reverse Charge: <strong>No</strong></p>
                <p className="text-[11px] text-slate-700">Supply Type: <strong>{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</strong></p>
                <p className="text-[11px] text-slate-700">E-Way Bill Status: <strong>Not Required (&lt; ₹50,000 threshold or local)</strong></p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-xs border-collapse border border-slate-300 mb-4">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-[11px] text-center">
                  <th className="p-2 border border-slate-600 text-left">#</th>
                  <th className="p-2 border border-slate-600 text-left">Item Description</th>
                  <th className="p-2 border border-slate-600">HSN/SAC</th>
                  <th className="p-2 border border-slate-600">Qty</th>
                  <th className="p-2 border border-slate-600">Rate (₹)</th>
                  <th className="p-2 border border-slate-600">Taxable (₹)</th>
                  <th className="p-2 border border-slate-600">GST %</th>
                  <th className="p-2 border border-slate-600">GST Amt (₹)</th>
                  <th className="p-2 border border-slate-600 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item: any, idx: number) => {
                  const itemGst = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
                  return (
                    <tr key={idx} className="border-b border-slate-200 text-center">
                      <td className="p-2 border border-slate-300 text-left">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 text-left font-semibold">
                        {item.description || item.item?.name}
                        <p className="text-[10px] text-slate-500 font-normal">{item.itemCode}</p>
                      </td>
                      <td className="p-2 border border-slate-300 font-mono">{item.hsnCode || '8428'}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{item.quantity} {item.unit}</td>
                      <td className="p-2 border border-slate-300 font-mono">{item.rate.toFixed(2)}</td>
                      <td className="p-2 border border-slate-300 font-mono">{item.taxableValue.toFixed(2)}</td>
                      <td className="p-2 border border-slate-300">{item.gstRate}%</td>
                      <td className="p-2 border border-slate-300 font-mono">{itemGst.toFixed(2)}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold">{item.totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-200 p-3 rounded bg-slate-50 text-xs">
                <p className="font-bold text-slate-700 uppercase mb-1">Bank Details for Payment</p>
                <p>Bank Name: <strong>IDBI BANK , HOSUR</strong></p>
                <p>A/c Name: <strong>BALAJI CONVEYORS</strong></p>
                <p>A/c No: <strong className="font-mono">0213102000024824</strong></p>
                <p>IFSC Code: <strong className="font-mono">IBKL0000213</strong></p>
              </div>

              <div className="border border-slate-300 p-3 rounded bg-white text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Taxable Amount:</span>
                  <span className="font-mono font-bold">₹{invoice.taxableAmount.toFixed(2)}</span>
                </div>
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST Total:</span>
                      <span className="font-mono">₹{invoice.cgstTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST Total:</span>
                      <span className="font-mono">₹{invoice.sgstTotal.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST Total:</span>
                    <span className="font-mono">₹{invoice.igstTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-1 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-blue-900">₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Signatory Footer */}
            <div className="border-t border-slate-300 pt-6 flex justify-between items-end text-xs">
              <div>
                <p className="text-[10px] text-slate-500">Terms & Conditions / Declarations:</p>
                <p className="text-[10px] text-slate-500">1. Goods once sold will not be taken back.</p>
                <p className="text-[10px] text-slate-500">2. E.&.O.E | Interest @18% p.a. charged after 1 month.</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">For BALAJI CONVEYORS ...</p>
                <div className="h-12" />
                <p className="border-t border-slate-400 pt-1 text-[11px] font-semibold text-slate-700">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
