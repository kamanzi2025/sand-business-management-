import { useEffect, useState } from 'react';
import { ORDER_STATUSES } from './StatusBadge';
import { formatCurrency, todayISO } from '../utils/format';
import { useSettings } from '../context/SettingsContext';
import { computeOrderTotals } from '../../../shared/calc.js';

function emptyForm(settings) {
  return {
    po_date: todayISO(),
    last_supply_date: '',
    quantity_trucks: '',
    purchase_unit_price: settings.default_purchase_price || '',
    selling_unit_price: settings.default_selling_price || '',
    vat_percentage: settings.default_vat_percentage ?? 18,
    customer_name: '',
    customer_phone: '',
    status: 'Supplying',
    notes: '',
  };
}

export default function OrderFormModal({ order, onClose, onSave }) {
  const { settings } = useSettings();
  const [form, setForm] = useState(() =>
    order
      ? {
          po_date: order.po_date?.slice(0, 10) || '',
          last_supply_date: order.last_supply_date?.slice(0, 10) || '',
          quantity_trucks: order.quantity_trucks,
          purchase_unit_price: order.purchase_unit_price,
          selling_unit_price: order.selling_unit_price,
          vat_percentage: order.vat_percentage,
          customer_name: order.customer_name || '',
          customer_phone: order.customer_phone || '',
          status: order.status,
          notes: order.notes || '',
        }
      : emptyForm(settings)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const totals = computeOrderTotals(form);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.po_date) return setError('P.O Date is required');
    if (!form.quantity_trucks || Number(form.quantity_trucks) <= 0) return setError('Quantity must be greater than 0');
    if (form.purchase_unit_price === '' || form.selling_unit_price === '') {
      return setError('Purchasing and selling unit prices are required');
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        quantity_trucks: Number(form.quantity_trucks),
        purchase_unit_price: Number(form.purchase_unit_price),
        selling_unit_price: Number(form.selling_unit_price),
        vat_percentage: Number(form.vat_percentage),
        last_supply_date: form.last_supply_date || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{order ? 'Edit Order' : 'Add New Order'}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-rose-50 p-2.5 text-sm text-rose-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-1 flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">P.O Date *</span>
              <input
                type="date"
                required
                value={form.po_date}
                onChange={(e) => update('po_date', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
            <label className="col-span-1 flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Last Supply Date</span>
              <input
                type="date"
                value={form.last_supply_date}
                onChange={(e) => update('last_supply_date', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Quantity (Trucks) *</span>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.quantity_trucks}
              onChange={(e) => update('quantity_trucks', e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Purchasing Unit Price *</span>
              <input
                type="number"
                min="0"
                required
                value={form.purchase_unit_price}
                onChange={(e) => update('purchase_unit_price', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Selling Unit Price *</span>
              <input
                type="number"
                min="0"
                required
                value={form.selling_unit_price}
                onChange={(e) => update('selling_unit_price', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">VAT % (editable assumption)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.vat_percentage}
              onChange={(e) => update('vat_percentage', e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Customer Name</span>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Customer Phone</span>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={(e) => update('customer_phone', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              />
            </label>
          </div>

          {order && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Auto-calculated
            </p>
            <dl className="grid grid-cols-2 gap-y-1.5">
              <dt className="text-slate-500">Purchase Total</dt>
              <dd className="text-right font-medium text-slate-800">
                {formatCurrency(totals.purchase_total, settings.currency_symbol)}
              </dd>
              <dt className="text-slate-500">Sale Total</dt>
              <dd className="text-right font-medium text-slate-800">
                {formatCurrency(totals.sale_total, settings.currency_symbol)}
              </dd>
              <dt className="text-slate-500">Purchasing VAT</dt>
              <dd className="text-right font-medium text-slate-800">
                {formatCurrency(totals.purchase_vat, settings.currency_symbol)}
              </dd>
              <dt className="text-slate-500">Selling VAT</dt>
              <dd className="text-right font-medium text-slate-800">
                {formatCurrency(totals.selling_vat, settings.currency_symbol)}
              </dd>
              <dt className="font-semibold text-slate-600">Net after VAT</dt>
              <dd className="text-right font-semibold text-slate-900">
                {formatCurrency(totals.net_after_vat, settings.currency_symbol)}
              </dd>
            </dl>
            <p className="mt-2 text-xs text-slate-400">
              Net after VAT = (Sale Total − Purchase Total) − (Selling VAT − Purchasing VAT): profit on this
              order after remitting net VAT.
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : order ? 'Save Changes' : 'Add Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
