const STATUS_STYLES = {
  Supplying: 'bg-amber-100 text-amber-800 border-amber-300',
  Invoiced: 'bg-blue-100 text-blue-800 border-blue-300',
  Paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const ORDER_STATUSES = ['Supplying', 'Invoiced', 'Paid'];

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}>
      {status}
    </span>
  );
}
