'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Printer, CheckCircle, Trash2 } from 'lucide-react';
import InvoicePdfModal from '@/components/ui/InvoicePdfModal';
import DocumentTrail from '@/components/ui/DocumentTrail';

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchInvoices = () => {
    setLoading(true);
    fetch('/api/sales/invoices')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Invoice ${invoiceNumber}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/sales/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchInvoices();
      } else {
        alert(`Failed to delete invoice: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Network error'}`);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Document Trail Header */}
      <DocumentTrail
        steps={[
          { label: '1. Quotation', docNumber: 'QT-00012', status: 'COMPLETED' },
          { label: '2. Sales Order', docNumber: 'SO-00018', status: 'COMPLETED' },
          { label: '3. Delivery Challan', docNumber: 'DC-00025', status: 'COMPLETED' },
          { label: '4. GST Tax Invoice', docNumber: 'INV-00001', status: 'ACTIVE' },
          { label: '5. Receipt', docNumber: 'REC-00019', status: 'PENDING' },
        ]}
      />

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">GST Tax Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage sales invoices, print GST tax invoices, track customer receivables and accounting posting.
          </p>
        </div>
        <Link
          href="/sales/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Sales Invoice</span>
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Invoice No or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Invoices: {filteredInvoices.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading sales invoices...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3 text-right">Taxable (₹)</th>
                <th className="p-3 text-right">GST (₹)</th>
                <th className="p-3 text-right">Grand Total (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.map((inv) => {
                const totalTax = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3 font-semibold text-slate-900">{inv.customer?.name}</td>
                    <td className="p-3 font-mono text-slate-500">{inv.customer?.gstin || 'URP'}</td>
                    <td className="p-3 text-right font-mono">₹{inv.taxableAmount.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">₹{totalTax.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        POSTED
                      </span>
                    </td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold shadow-sm transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / View</span>
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-all cursor-pointer"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice PDF Modal */}
      <InvoicePdfModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onDeleteSuccess={fetchInvoices}
      />
    </div>
  );
}
