'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Receipt,
  Printer,
  ArrowRight,
  FileCheck,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  Trash2,
  X,
} from 'lucide-react';
import DocumentTrail from '@/components/ui/DocumentTrail';
import QuotationPdfModal from '@/components/ui/QuotationPdfModal';
import SalesOrderPdfModal from '@/components/ui/SalesOrderPdfModal';

function SalesOrdersHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'quotations' ? 'quotations' : 'orders';

  const [activeTab, setActiveTab] = useState<'quotations' | 'orders'>(initialTab);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<any>(null);
  const [convertModalOrder, setConvertModalOrder] = useState<any>(null);
  const [convertDetails, setConvertDetails] = useState({
    invoiceNumber: '',
    poNumber: '',
    poDate: '',
    vehicleNo: '',
    eWayBillNo: '',
    netWeight: '',
  });
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/sales/quotations').then((res) => res.json()),
      fetch('/api/sales/orders').then((res) => res.json()),
    ])
      .then(([qData, oData]) => {
        if (qData.success) setQuotations(qData.quotations);
        if (oData.success) setSalesOrders(oData.salesOrders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConvertQuotation = async (id: string) => {
    if (!confirm('Convert this Quotation into a Sales Order?')) return;
    setConvertingId(id);
    try {
      const res = await fetch(`/api/sales/quotations/${id}/convert`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Quotation successfully converted to Sales Order!');
        setActiveTab('orders');
        loadData();
      } else {
        alert(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConvertingId(null);
    }
  };

  const handleOpenConvertModal = (order: any) => {
    setConvertModalOrder(order);
    setConvertDetails({
      invoiceNumber: '',
      poNumber: order.poNumber || order.reference || '',
      poDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : '',
      vehicleNo: order.vehicleNo || '',
      eWayBillNo: '',
      netWeight: '',
    });
  };

  const handleConfirmConvertSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalOrder) return;

    setConvertingId(convertModalOrder.id);
    try {
      const res = await fetch(`/api/sales/orders/${convertModalOrder.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertDetails),
      });
      const data = await res.json();
      if (data.success) {
        setConvertModalOrder(null);
        alert('Sales Order successfully converted & posted as GST Tax Invoice!');
        router.push('/sales/invoices');
      } else {
        alert(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error converting Sales Order');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeleteQuotation = async (id: string, quotationNumber: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Quotation ${quotationNumber}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/sales/quotations/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(`Failed to delete quotation: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Network error'}`);
    }
  };

  const handleDeleteSalesOrder = async (id: string, orderNumber: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Sales Order ${orderNumber}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/sales/orders/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(`Failed to delete sales order: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message || 'Network error'}`);
    }
  };

  // KPIs
  const totalQuotationValue = quotations.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
  const totalOrderValue = salesOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
  const activeOrdersCount = salesOrders.filter((o) => o.status === 'CONFIRMED').length;

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = salesOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Document Trail Header */}
      <DocumentTrail
        steps={[
          { label: '1. Quotation', docNumber: 'QT-26-27/00001', status: activeTab === 'quotations' ? 'ACTIVE' : 'COMPLETED' },
          { label: '2. Sales Order', docNumber: 'SO-26-27/00001', status: activeTab === 'orders' ? 'ACTIVE' : 'PENDING' },
          { label: '3. Delivery Challan', docNumber: 'DC-26-27/00001', status: 'PENDING' },
          { label: '4. GST Tax Invoice', docNumber: 'INV-26-27/00001', status: 'PENDING' },
        ]}
      />

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            Quotations & Sales Orders
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer price quotations, confirm sales orders, and convert directly into GST invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sales/quotations/new"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
          <Link
            href="/sales/orders/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Quotations Value</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">₹{totalQuotationValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{quotations.length} total issued</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sales Orders</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">{activeOrdersCount} Open</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Ready for dispatch / invoicing</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders Value</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1 font-mono">₹{totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">{salesOrders.length} confirmed orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === 'quotations' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quotations ({quotations.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === 'orders' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Orders ({salesOrders.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'quotations' ? 'Search Quotations...' : 'Search Sales Orders...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Tab 1: Quotations Table */}
        {activeTab === 'quotations' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading quotations...</div>
            ) : filteredQuotations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p>No quotations found.</p>
                <Link
                  href="/sales/quotations/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Create Quotation
                </Link>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Quotation No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Valid Until</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">Grand Total (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{q.quotationNumber}</td>
                      <td className="p-3">{new Date(q.quotationDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-slate-500">{new Date(q.validUntil).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 font-semibold text-slate-900">{q.customer?.name}</td>
                      <td className="p-3 text-right font-mono">₹{q.taxableAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{q.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'CONVERTED'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => setSelectedQuotation(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleConvertQuotation(q.id)}
                            disabled={convertingId === q.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Convert to SO</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteQuotation(q.id, q.quotationNumber)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-all cursor-pointer"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Sales Orders Table */}
        {activeTab === 'orders' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading sales orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-3">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p>No sales orders found.</p>
                <Link
                  href="/sales/orders/new"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Create Sales Order
                </Link>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Order No</th>
                    <th className="p-3">Order Date</th>
                    <th className="p-3">Delivery Date</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-right">Grand Total (₹)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-600">{o.orderNumber}</td>
                      <td className="p-3">{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-slate-500">
                        {o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">{o.customer?.name}</td>
                      <td className="p-3 text-right font-mono">₹{o.taxableAmount.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₹{o.grandTotal.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'INVOICED'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-center space-x-2">
                        <button
                          onClick={() => setSelectedSalesOrder(o)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        {o.status !== 'INVOICED' && (
                          <button
                            onClick={() => handleOpenConvertModal(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition-all cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Post Invoice</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSalesOrder(o.id, o.orderNumber)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition-all cursor-pointer"
                          title="Delete Sales Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Convert Sales Order to GST Tax Invoice Modal */}
      {convertModalOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Convert Sales Order to GST Invoice</h3>
                <p className="text-xs text-blue-300 font-mono mt-0.5">{convertModalOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setConvertModalOrder(null)}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConvertSalesOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Invoice Number <span className="text-slate-400 font-normal">(Auto-generated if blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-26-27/00001 or BC/2026/101"
                  value={convertDetails.invoiceNumber}
                  onChange={(e) => setConvertDetails({ ...convertDetails, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vehicle Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TN 37 AB 1234"
                  value={convertDetails.vehicleNo}
                  onChange={(e) => setConvertDetails({ ...convertDetails, vehicleNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Customer PO Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-0099"
                    value={convertDetails.poNumber}
                    onChange={(e) => setConvertDetails({ ...convertDetails, poNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PO Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={convertDetails.poDate}
                    onChange={(e) => setConvertDetails({ ...convertDetails, poDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-Way Bill No <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 241098234123"
                    value={convertDetails.eWayBillNo}
                    onChange={(e) => setConvertDetails({ ...convertDetails, eWayBillNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Net Weight <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 450 Kg"
                    value={convertDetails.netWeight}
                    onChange={(e) => setConvertDetails({ ...convertDetails, netWeight: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertModalOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertingId === convertModalOrder.id}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{convertingId ? 'Converting...' : 'Generate GST Tax Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modals */}
      <QuotationPdfModal
        isOpen={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        quotation={selectedQuotation}
        onDeleteSuccess={loadData}
      />

      <SalesOrderPdfModal
        isOpen={!!selectedSalesOrder}
        onClose={() => setSelectedSalesOrder(null)}
        salesOrder={selectedSalesOrder}
        onDeleteSuccess={loadData}
      />
    </div>
  );
}


export default function SalesOrdersHubPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading...</div>}>
      <SalesOrdersHubContent />
    </Suspense>
  );
}

