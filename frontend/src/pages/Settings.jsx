import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../api/client';

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) return setError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('New passwords do not match');

    setSaving(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setMessage('Password changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-semibold text-slate-800">Change Password</h3>
        <p className="text-sm text-slate-500">This is the password everyone uses to open the app.</p>
      </div>

      {message && <p className="rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-600">{message}</p>}
      {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Current Password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">New Password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Confirm New Password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  );
}

export default function Settings() {
  const { settings, updateSettings, loading } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => setForm(settings), [settings]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateSettings({
        default_purchase_price: Number(form.default_purchase_price) || 0,
        default_selling_price: Number(form.default_selling_price) || 0,
        default_vat_percentage: Number(form.default_vat_percentage) || 0,
        currency_symbol: form.currency_symbol || 'RWF',
      });
      setMessage('Settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="max-w-md space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Defaults used to pre-fill new orders</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {message && <p className="rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-600">{message}</p>}
        {error && <p className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Default Purchasing Unit Price</span>
          <input
            type="number"
            min="0"
            value={form.default_purchase_price}
            onChange={(e) => update('default_purchase_price', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Default Selling Unit Price</span>
          <input
            type="number"
            min="0"
            value={form.default_selling_price}
            onChange={(e) => update('default_selling_price', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Default VAT Percentage</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.default_vat_percentage}
            onChange={(e) => update('default_vat_percentage', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Currency Symbol</span>
          <input
            type="text"
            value={form.currency_symbol}
            onChange={(e) => update('currency_symbol', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <ChangePasswordForm />
    </div>
  );
}
