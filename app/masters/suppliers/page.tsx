'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    gstin: '',
    pan: '',
    phone: '',
    email: '',
    address: '',
    state: 'Maharashtra',
    stateCode: '27',
    pinCode: '400001',
    creditDays: '30',
    contactPerson: '',
  });

  const loadSuppliers = () => {
    fetch('/api/suppliers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSuppliers(data.suppliers);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      loadSuppliers();
    } else {
      alert(data.error);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Supplier Master</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage vendor details, GSTIN tax credentials, address, and credit terms.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Supplier Name or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total Suppliers: {filtered.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">Loading suppliers...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3">State & Code</th>
                <th className="p-3">Phone & Email</th>
                <th className="p-3 text-center">Credit Days</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((supp) => (
                <tr key={supp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{supp.supplierCode}</td>
                  <td className="p-3 font-bold text-slate-900">{supp.name}</td>
                  <td className="p-3 font-mono text-slate-600">{supp.gstin || 'URP'}</td>
                  <td className="p-3">{supp.state} ({supp.stateCode})</td>
                  <td className="p-3 text-slate-600">{supp.phone}</td>
                  <td className="p-3 text-center font-semibold">{supp.creditDays} days</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add New Supplier</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono uppercase"
                  placeholder="24AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State Name</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">State Code</label>
                <input
                  type="text"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Credit Days</label>
                <input
                  type="number"
                  value={formData.creditDays}
                  onChange={(e) => setFormData({ ...formData, creditDays: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Address *</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded"
                  rows={2}
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
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded shadow"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
