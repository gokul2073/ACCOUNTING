'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, Pencil } from 'lucide-react';

let cachedItems: any[] | null = null;

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>(cachedItems || []);
  const [loading, setLoading] = useState(!cachedItems);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    sku: '',
    itemType: 'GOODS',
    purchasePrice: '400',
    salesPrice: '550',
    reorderLevel: '20',
    openingStock: '50',
  });

  const loadItems = () => {
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          cachedItems = data.items;
          setItems(data.items);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      itemCode: '',
      sku: '',
      itemType: 'GOODS',
      purchasePrice: '400',
      salesPrice: '550',
      reorderLevel: '20',
      openingStock: '50',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      itemCode: item.itemCode || '',
      sku: item.sku || '',
      itemType: item.itemType || 'GOODS',
      purchasePrice: (item.purchasePrice || 0).toString(),
      salesPrice: (item.salesPrice || 0).toString(),
      reorderLevel: (item.reorderLevel || 0).toString(),
      openingStock: (item.currentStock || item.openingStock || 0).toString(),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/items/${editingId}` : '/api/items';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      loadItems();
    } else {
      alert(data.error || 'Failed to save product');
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.itemCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product & Item Master</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage goods and service items, HSN/SAC classifications, GST tax rates, prices, and manual stock updates.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product / Service</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Product Name or Item Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Items: {filtered.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading items...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Item Code</th>
                <th className="p-3">Product Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">HSN Code</th>
                <th className="p-3">GST Rate</th>
                <th className="p-3 text-right">Purchase Price (₹)</th>
                <th className="p-3 text-right">Sales Price (₹)</th>
                <th className="p-3 text-center">Stock Quantity</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-600">{item.itemCode}</td>
                  <td className="p-3 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.itemType === 'GOODS' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}>
                      {item.itemType}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{item.hsnCode?.code || '7208'}</td>
                  <td className="p-3 font-semibold text-slate-700">{item.gstRate?.name || '18%'}</td>
                  <td className="p-3 text-right font-mono">₹{item.purchasePrice.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">₹{item.salesPrice.toFixed(2)}</td>
                  <td className="p-3 text-center font-bold font-mono">
                    {item.itemType === 'GOODS' ? (
                      <span className={`px-2.5 py-1 rounded-full ${item.currentStock <= item.reorderLevel ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-800'}`}>
                        {item.currentStock} {item.unit?.symbol || 'pcs'}
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A Service</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded shadow-sm transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? 'Edit Product / Service' : 'Add New Product / Service'}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Code / SKU</label>
                <input
                  type="text"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono"
                  placeholder="ITEM-003"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={formData.itemType}
                  onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-semibold"
                >
                  <option value="GOODS">GOODS (Manual Stock)</option>
                  <option value="SERVICES">SERVICES (No Stock)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Purchase Price (₹)</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sales Price (₹)</label>
                <input
                  type="number"
                  value={formData.salesPrice}
                  onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Manual Stock Quantity</label>
                <input
                  type="number"
                  value={formData.openingStock}
                  onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono font-bold text-blue-700"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow"
              >
                {editingId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
