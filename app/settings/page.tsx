'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Save, CheckCircle, Landmark, ShieldCheck, MapPin, Phone, Mail, FileText } from 'lucide-react';

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: 'BALAJI CONVEYORS',
    legalName: 'BALAJI CONVEYORS',
    address: '504/4 Chinnaelasagiri, Balaji nagar, Sipcot',
    city: 'Hosur',
    state: 'Tamil Nadu',
    stateCode: '33',
    pinCode: '635 126',
    phone: '9791525307, 8870864617',
    email: 'info@balajiconveyors.com',
    website: 'https://balajiconveyors.com',
    gstin: '33AANFB9381J1Z0',
    pan: 'AANFB9381J',
    cin: 'U28110TN2020PTC345678',
    bankName: 'IDBI BANK , HOSUR',
    accountNumber: '0213102000024824',
    ifscCode: 'IBKL0000213',
    branch: 'Hosur Branch',
  });

  useEffect(() => {
    fetch('/api/company')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.company) {
          const c = data.company;
          const b = c.bankAccounts && c.bankAccounts[0] ? c.bankAccounts[0] : {};
          setForm({
            name: c.name || '',
            legalName: c.legalName || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            stateCode: c.stateCode || '',
            pinCode: c.pinCode || '',
            phone: c.phone || '',
            email: c.email || '',
            website: c.website || '',
            gstin: c.gstin || '',
            pan: c.pan || '',
            cin: c.cin || '',
            bankName: b.bankName || '',
            accountNumber: b.accountNumber || '',
            ifscCode: b.ifscCode || '',
            branch: b.branch || '',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch company details', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Company details updated successfully!');
      } else {
        setMessage('Failed to update company: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setMessage('Error updating company details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
        Loading Company Settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl flex items-center justify-between border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold tracking-tight">Company Profile & GST Configuration</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Manage your organization details, GST registration, address, and primary bank account.
          </p>
        </div>
        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
          <ShieldCheck className="w-4 h-4" /> Active GST Entity
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-xs font-semibold flex items-center gap-2 ${
          message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Business Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" /> Organization Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Company Display Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Legal Registered Name</label>
              <input
                type="text"
                name="legalName"
                value={form.legalName}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">GSTIN Number *</label>
              <input
                type="text"
                name="gstin"
                value={form.gstin}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-blue-900 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">PAN Number</label>
              <input
                type="text"
                name="pan"
                value={form.pan}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Address & Contact */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Address & Contact Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Registered Address *</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">State & State Code *</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  placeholder="State"
                  className="col-span-2 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="stateCode"
                  value={form.stateCode}
                  onChange={handleChange}
                  required
                  placeholder="Code (e.g. 33)"
                  className="p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-center font-bold"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">PIN Code *</label>
              <input
                type="text"
                name="pinCode"
                value={form.pinCode}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile / Phone Numbers *</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Website</label>
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-600" /> Primary Bank Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={form.accountNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase font-bold text-blue-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Branch Location</label>
              <input
                type="text"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Company Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
