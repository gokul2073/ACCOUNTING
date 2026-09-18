'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, ShoppingCart } from 'lucide-react';
import { calculateGst } from '@/modules/gst/engine';

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState(`BILL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Purchase bill received and verified with GRN.');

  const [lineItems, setLineItems] = useState<any[]>([
    { itemId: '', itemCode: '', description: '', hsnCode: '7208', quantity: 50, unit: 'pcs', rate: 400, discount: 0, gstRate: 18 },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/suppliers')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSuppliers(d.suppliers);
      });

    fetch('/api/items')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItemsMaster(d.items);
      });
  }, []);

  const handleSupplierChange = (id: string) => {
    setSelectedSupplierId(id);
    const found = suppliers.find((s) => s.id === id);
    setSelectedSupplier(found || null);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const masterItem = itemsMaster.find((i) => i.id === itemId);
    if (!masterItem) return;

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      itemId: masterItem.id,
      itemCode: masterItem.itemCode,
      description: masterItem.name,
      hsnCode: masterItem.hsnCode?.code || '7208',
      unit: masterItem.unit?.symbol || 'pcs',
      rate: masterItem.purchasePrice || 0,
      gstRate: masterItem.gstRate?.rate || 18,
    };
    setLineItems(updated);
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const addLine = () => {
    setLineItems([
      ...lineItems,
      { itemId: '', itemCode: '', description: '', hsnCode: '7208', quantity: 1, unit: 'pcs', rate: 0, discount: 0, gstRate: 18 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const companyStateCode = '33'; // Tamil Nadu (Balaji Conveyors)
  const supplierStateCode = selectedSupplier?.stateCode || '33';
  const isInterState = companyStateCode !== supplierStateCode;

  let subtotal = 0;
  let taxableAmount = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const calculatedItems = lineItems.map((item) => {
    const itemSubtotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    const discount = Number(item.discount) || 0;
    const itemTaxable = Math.max(0, itemSubtotal - discount);

    const gstRes = calculateGst(companyStateCode, supplierStateCode, itemTaxable, Number(item.gstRate) || 18);

    subtotal += itemSubtotal;
    taxableAmount += itemTaxable;
    cgstTotal += gstRes.cgstAmount;
    sgstTotal += gstRes.sgstAmount;
    igstTotal += gstRes.igstAmount;

    return {
      ...item,
      taxableValue: itemTaxable,
      cgstAmount: gstRes.cgstAmount,
      sgstAmount: gstRes.sgstAmount,
      igstAmount: gstRes.igstAmount,
      totalAmount: gstRes.grandTotal,
    };
  });

  const grandTotal = Number((taxableAmount + cgstTotal + sgstTotal + igstTotal).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (lineItems.some((i) => !i.itemId)) {
      alert('Please select valid products for all line items.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/purchases/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          supplierInvoiceNo,
          invoiceDate,
          dueDate,
          notes,
          items: calculatedItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/purchase/invoices');
      } else {
        alert(data.error || 'Failed to record purchase bill');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Record Purchase Bill</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Increases stock in Main Godown & posts Accounting Purchase Journal + Input GST ITC.
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Recording Bill...' : 'Post Purchase Bill'}</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Supplier *</label>
          <select
            value={selectedSupplierId}
            onChange={(e) => handleSupplierChange(e.target.value)}
            required
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-semibold"
          >
            <option value="">-- Choose Supplier --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.gstin || 'URP'})
              </option>
            ))}
          </select>
          {selectedSupplier && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedSupplier.name}</p>
              <p className="text-[11px] text-slate-600">GSTIN: {selectedSupplier.gstin || 'URP'}</p>
              <p className="text-[11px] text-slate-600">
                State: {selectedSupplier.state} ({selectedSupplier.stateCode})
              </p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${
                  isInterState ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isInterState ? 'Inter-State (Input IGST Claim)' : 'Intra-State (Input CGST + SGST Claim)'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Bill / Invoice No *</label>
          <input
            type="text"
            value={supplierInvoiceNo}
            onChange={(e) => setSupplierInvoiceNo(e.target.value)}
            required
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
          />

          <label className="block text-xs font-bold text-slate-700 mt-4 mb-1">Bill Date *</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Verification</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">Purchased Items & Input Tax</h3>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-2 w-10">#</th>
              <th className="p-2 w-64">Item / Product</th>
              <th className="p-2 w-20">HSN</th>
              <th className="p-2 w-20">Qty</th>
              <th className="p-2 w-28">Cost (₹)</th>
              <th className="p-2 w-24">GST %</th>
              <th className="p-2 w-28 text-right">Taxable (₹)</th>
              <th className="p-2 w-28 text-right">Total (₹)</th>
              <th className="p-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lineItems.map((item, idx) => {
              const calc = calculatedItems[idx];
              return (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-2 font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-2">
                    <select
                      value={item.itemId}
                      onChange={(e) => handleItemSelect(idx, e.target.value)}
                      required
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-semibold"
                    >
                      <option value="">-- Choose Item --</option>
                      {itemsMaster.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.itemCode})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleLineChange(idx, 'hsnCode', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-mono text-center"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-center"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => handleLineChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-mono text-right"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={item.gstRate}
                      onChange={(e) => handleLineChange(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded text-center font-semibold"
                    >
                      <option value={18}>18%</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0%</option>
                    </select>
                  </td>
                  <td className="p-2 text-right font-mono font-semibold">₹{calc.taxableValue.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">₹{calc.totalAmount.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          type="button"
          onClick={addLine}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-all"
        >
          <Plus className="w-4 h-4" /> Add Line Row
        </button>

        <div className="border-t border-slate-200 pt-4 flex justify-end">
          <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono font-semibold">₹{taxableAmount.toFixed(2)}</span>
            </div>
            {!isInterState ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Input CGST Claim:</span>
                  <span className="font-mono text-blue-600 font-semibold">₹{cgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Input SGST Claim:</span>
                  <span className="font-mono text-blue-600 font-semibold">₹{sgstTotal.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600">
                <span>Input IGST Claim:</span>
                <span className="font-mono text-purple-600 font-semibold">₹{igstTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Bill Payable Total:</span>
              <span className="font-mono">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
