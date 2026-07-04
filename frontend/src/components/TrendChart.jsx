import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency, monthLabel } from '../utils/format';

const COLORS = {
  revenue: '#2a78d6',
  profit: '#008300',
};

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

export default function TrendChart({ data, currencySymbol }) {
  if (!data?.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
        No orders yet — add an order to see revenue and profit trend.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Revenue &amp; Profit Trend</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS.revenue }} />
            Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS.profit }} />
            Profit
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
          <Tooltip content={<ChartTooltip currencySymbol={currencySymbol} />} />
          <Legend wrapperStyle={{ display: 'none' }} />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={COLORS.revenue}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.revenue, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke={COLORS.profit}
            strokeWidth={2}
            dot={{ r: 3, fill: COLORS.profit, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
