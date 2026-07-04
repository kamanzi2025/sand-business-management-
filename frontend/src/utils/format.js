export function formatCurrency(value, currencySymbol = 'RWF') {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `${currencySymbol} ${formatted}`;
}

export function formatNumber(value) {
  return (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthLabel(yyyyMm) {
  if (!yyyyMm) return '';
  const [year, month] = yyyyMm.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}
