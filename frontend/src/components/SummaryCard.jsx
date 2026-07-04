export default function SummaryCard({ label, value, accent = 'slate', icon }) {
  const accents = {
    slate: 'bg-slate-100 text-slate-700',
    orange: 'bg-orange-100 text-orange-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${accents[accent] || accents.slate}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
