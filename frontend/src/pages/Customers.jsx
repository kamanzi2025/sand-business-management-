import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency, formatNumber } from '../utils/format';

function AddCustomerForm({ onAdd }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    setError('');
    try {
      await onAdd({ name: name.trim(), phone: phone.trim() || null });
      setName('');
      setPhone('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
      </label>
      <label className="flex flex-1 min-w-[140px] flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Phone</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {saving ? 'Adding…' : '+ Add Customer'}
      </button>
      {error && <p className="w-full text-sm text-rose-600">{error}</p>}
    </form>
  );
}

export default function Customers() {
  const { settings } = useSettings();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadCustomers() {
    setLoading(true);
    api.customers
      .list()
      .then(setCustomers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function handleAdd(data) {
    await api.customers.create(data);
    loadCustomers();
  }

  async function handleDelete(customer) {
    if (!confirm(`Delete customer "${customer.name}"? Their orders will be kept but unlinked.`)) return;
    await api.customers.remove(customer.id);
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Customers</h2>
        <p className="text-sm text-slate-500">{customers.length} customer{customers.length === 1 ? '' : 's'}</p>
      </div>

      <AddCustomerForm onAdd={handleAdd} />

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5">Total Orders</th>
              <th className="px-3 py-2.5">Total Billed</th>
              <th className="px-3 py-2.5">Amount Owed</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">{c.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{c.phone || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatNumber(c.total_orders)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatCurrency(c.total_billed, settings.currency_symbol)}</td>
                  <td className={`whitespace-nowrap px-3 py-2.5 font-medium ${c.amount_owed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(c.amount_owed, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <button onClick={() => handleDelete(c)} className="text-xs font-medium text-rose-500 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
