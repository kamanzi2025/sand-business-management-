import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import StatusBadge, { ORDER_STATUSES } from '../components/StatusBadge';
import OrderFormModal from '../components/OrderFormModal';
import { formatCurrency, formatDate, formatNumber } from '../utils/format';
import { exportOrdersToExcel, exportOrdersToPdf } from '../utils/export';

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 5000; // matches the backend's MAX_PAGE_SIZE ceiling

const EMPTY_TOTALS = {
  quantity_trucks: 0,
  purchase_total: 0,
  sale_total: 0,
  purchase_vat: 0,
  selling_vat: 0,
  net_after_vat: 0,
};

const COLUMNS = [
  { key: 'po_number', label: 'P.O Number' },
  { key: 'po_date', label: 'P.O Date' },
  { key: 'last_supply_date', label: 'Last Supply Date' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'quantity_trucks', label: 'Qty (Trucks)' },
  { key: 'purchase_unit_price', label: 'Purchase Unit Price' },
  { key: 'selling_unit_price', label: 'Selling Unit Price' },
  { key: 'purchase_total', label: 'Purchase Total' },
  { key: 'sale_total', label: 'Sale Total' },
  { key: 'purchase_vat', label: 'Purchasing VAT' },
  { key: 'selling_vat', label: 'Selling VAT' },
  { key: 'net_after_vat', label: 'Net after VAT' },
  { key: 'status', label: 'Status' },
];

const STATUS_ORDER = ['Supplying', 'Invoiced', 'Paid'];

export default function Orders() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ sortBy: 'po_date', sortDir: 'desc' });
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Any change to what's being filtered/sorted invalidates the current page.
  useEffect(() => {
    setPage(1);
  }, [filters, search, sort]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    setError('');
    api.orders
      .list({ ...filters, search, ...sort, page, pageSize: PAGE_SIZE })
      .then((data) => {
        // Deleting the last row on a page beyond the first can leave `page`
        // pointing past the new last page (e.g. after emptying page 3) --
        // step back rather than showing a blank table with orders elsewhere.
        if (data.orders.length === 0 && page > 1 && data.total > 0) {
          setPage(Math.max(1, Math.ceil(data.total / PAGE_SIZE)));
          return;
        }
        setOrders(data.orders);
        setTotal(data.total);
        setTotals(data.totals);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, search, sort, page]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function toggleSort(key) {
    setSort((prev) =>
      prev.sortBy === key ? { sortBy: key, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc' } : { sortBy: key, sortDir: 'asc' }
    );
  }

  async function handleStatusChange(order, status) {
    const updated = await api.orders.update(order.id, { ...order, status });
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  async function handleDelete(order) {
    if (!confirm(`Delete order from ${formatDate(order.po_date)}? This cannot be undone.`)) return;
    await api.orders.remove(order.id);
    loadOrders();
  }

  async function handleSave(data) {
    if (editingOrder) {
      const updated = await api.orders.update(editingOrder.id, data);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } else {
      await api.orders.create(data);
      loadOrders();
    }
    setShowModal(false);
    setEditingOrder(null);
  }

  // Exports must cover every order matching the current filter, not just the
  // visible page, so they re-fetch with a much larger page size instead of
  // reusing the paginated `orders` state.
  async function handleExport(format) {
    setExporting(true);
    setError('');
    try {
      const data = await api.orders.list({ ...filters, search, ...sort, page: 1, pageSize: EXPORT_PAGE_SIZE });
      if (format === 'excel') await exportOrdersToExcel(data.orders, settings.currency_symbol);
      else await exportOrdersToPdf(data.orders, settings.currency_symbol);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">{total} order{total === 1 ? '' : 's'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('excel')}
            disabled={!total || exporting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={!total || exporting}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => {
              setEditingOrder(null);
              setShowModal(true);
            }}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            + Add New Order
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder="Search customer name, phone, or P.O number…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          title="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
          title="To date"
        />
        {(filters.status || filters.from || filters.to || search) && (
          <button
            onClick={() => {
              setFilters({ status: '', from: '', to: '' });
              setSearchInput('');
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 hover:text-slate-700"
                >
                  {col.label}
                  {sort.sortBy === col.key && <span className="ml-1">{sort.sortDir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-8 text-center text-slate-400">
                  No orders found. Try adjusting filters or add a new order.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-3 py-2.5">{order.po_number || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDate(order.po_date)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatDate(order.last_supply_date)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {order.customer_name || '—'}
                    {order.customer_phone && <div className="text-xs text-slate-400">{order.customer_phone}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">{formatNumber(order.quantity_trucks)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.purchase_unit_price, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.selling_unit_price, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.purchase_total, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.sale_total, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.purchase_vat, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {formatCurrency(order.selling_vat, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                    {formatCurrency(order.net_after_vat, settings.currency_symbol)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                        className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-500"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setEditingOrder(order);
                        setShowModal(true);
                      }}
                      className="mr-2 text-xs font-medium text-orange-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      className="text-xs font-medium text-rose-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {orders.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="px-3 py-2.5" colSpan={4}>
                  Totals
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{formatNumber(totals.quantity_trucks)}</td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5"></td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatCurrency(totals.purchase_total, settings.currency_symbol)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatCurrency(totals.sale_total, settings.currency_symbol)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatCurrency(totals.purchase_vat, settings.currency_symbol)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatCurrency(totals.selling_vat, settings.currency_symbol)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {formatCurrency(totals.net_after_vat, settings.currency_symbol)}
                </td>
                <td className="px-3 py-2.5"></td>
                <td className="px-3 py-2.5"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span>
            Page {page} of {totalPages} &middot; {total} order{total === 1 ? '' : 's'} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <OrderFormModal
          order={editingOrder}
          onClose={() => {
            setShowModal(false);
            setEditingOrder(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
