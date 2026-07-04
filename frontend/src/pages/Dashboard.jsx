import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import SummaryCard from '../components/SummaryCard';
import TrendChart from '../components/TrendChart';
import { formatCurrency, formatNumber } from '../utils/format';

const STATUS_META = [
  { key: 'Supplying', color: 'bg-amber-400' },
  { key: 'Invoiced', color: 'bg-blue-400' },
  { key: 'Paid', color: 'bg-emerald-400' },
];

export default function Dashboard() {
  const { settings } = useSettings();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.dashboard.summary(), api.dashboard.trend()])
      .then(([summaryData, trendData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setTrend(trendData);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const currency = settings.currency_symbol;
  const totalOrders = summary
    ? summary.status_breakdown.Supplying + summary.status_breakdown.Invoiced + summary.status_breakdown.Paid
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of sand supply operations</p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <SummaryCard
              label="Total Trucks Supplied"
              value={formatNumber(summary.total_trucks)}
              icon="🚚"
              accent="orange"
            />
            <SummaryCard
              label="Total Purchase Cost"
              value={formatCurrency(summary.total_purchase_cost, currency)}
              icon="🛒"
              accent="slate"
            />
            <SummaryCard
              label="Total Sales Revenue"
              value={formatCurrency(summary.total_sales_revenue, currency)}
              icon="💰"
              accent="blue"
            />
            <SummaryCard
              label="Total Net Profit"
              value={formatCurrency(summary.total_net_profit, currency)}
              icon="📈"
              accent="emerald"
            />
            <SummaryCard
              label="Outstanding (Invoiced)"
              value={formatCurrency(summary.outstanding_amount, currency)}
              icon="⏳"
              accent="rose"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Orders by Status</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              {STATUS_META.map(({ key, color }) => {
                const count = summary.status_breakdown[key] || 0;
                const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
                return (
                  <div key={key} className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        {key}
                      </span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TrendChart data={trend} currencySymbol={currency} />
        </>
      )}
    </div>
  );
}
