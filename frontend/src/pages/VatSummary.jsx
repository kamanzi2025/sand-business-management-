import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import SummaryCard from '../components/SummaryCard';
import { formatCurrency, monthLabel } from '../utils/format';

const COLORS = { purchasing: '#2a78d6', selling: '#008300' };

function ChartTooltip({ active, payload, label, currencySymbol }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-slate-700">{monthLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatCurrency(entry.value, currencySymbol)}
        </p>
      ))}
    </div>
  );
}

export default function VatSummary() {
  const { settings } = useSettings();
  const [range, setRange] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.vat
      .summary(range)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [range]);

  const currency = settings.currency_symbol;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">VAT Summary</h2>
        <p className="text-sm text-slate-500">For tax filing — purchasing vs selling VAT over a date range</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          From
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          To
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          />
        </label>
        {(range.from || range.to) && (
          <button
            onClick={() => setRange({ from: '', to: '' })}
            className="rounded-lg px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Total Purchasing VAT"
              value={formatCurrency(data.total_purchasing_vat, currency)}
              icon="🧾"
              accent="blue"
            />
            <SummaryCard
              label="Total Selling VAT"
              value={formatCurrency(data.total_selling_vat, currency)}
              icon="💵"
              accent="emerald"
            />
            <SummaryCard
              label="Net VAT Payable"
              value={formatCurrency(data.total_net_vat, currency)}
              icon="🧮"
              accent="orange"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Monthly VAT Breakdown</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS.purchasing }} />
                  Purchasing VAT
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS.selling }} />
                  Selling VAT
                </span>
              </div>
            </div>
            {data.monthly.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-slate-400">No orders in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e1e0d9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={monthLabel}
                    tick={{ fill: '#898781', fontSize: 12 }}
                    axisLine={{ stroke: '#c3c2b7' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#898781', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tickFormatter={(v) => formatCurrency(v, '').trim()}
                  />
                  <Tooltip content={<ChartTooltip currencySymbol={currency} />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="purchasing_vat" name="Purchasing VAT" fill={COLORS.purchasing} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="selling_vat" name="Selling VAT" fill={COLORS.selling} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5">Month</th>
                  <th className="px-3 py-2.5">Purchasing VAT</th>
                  <th className="px-3 py-2.5">Selling VAT</th>
                  <th className="px-3 py-2.5">Net VAT</th>
                </tr>
              </thead>
              <tbody>
                {data.monthly.map((row) => (
                  <tr key={row.month} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5">{monthLabel(row.month)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatCurrency(row.purchasing_vat, currency)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{formatCurrency(row.selling_vat, currency)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium">{formatCurrency(row.net_vat, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
