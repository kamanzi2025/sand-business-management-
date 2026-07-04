import { Router } from 'express';
import { db } from '../db/init.js';
import { computeOrderTotals } from '../utils/calc.js';

const router = Router();

const SORTABLE_COLUMNS = new Set([
  'po_date',
  'last_supply_date',
  'quantity_trucks',
  'purchase_unit_price',
  'selling_unit_price',
  'purchase_total',
  'sale_total',
  'purchase_vat',
  'selling_vat',
  'net_after_vat',
  'status',
  'customer_name',
]);

function upsertCustomer({ customer_id, customer_name, customer_phone }) {
  if (customer_id) {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
    if (existing) return existing;
  }
  const name = customer_name && customer_name.trim();
  if (name) {
    const byName = db
      .prepare('SELECT * FROM customers WHERE name = ? COLLATE NOCASE')
      .get(name);
    if (byName) return byName;

    const result = db
      .prepare('INSERT INTO customers (name, phone) VALUES (?, ?)')
      .run(name, customer_phone || null);
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  }
  return null;
}

// GET /api/orders?status=&from=&to=&search=&sortBy=&sortDir=
router.get('/', (req, res) => {
  const { status, from, to, search, sortBy, sortDir } = req.query;

  const clauses = [];
  const params = [];

  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (from) {
    clauses.push('po_date >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('po_date <= ?');
    params.push(to);
  }
  if (search) {
    clauses.push('(customer_name LIKE ? OR customer_phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const orderColumn = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'po_date';
  const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const orders = db
    .prepare(`SELECT * FROM orders ${where} ORDER BY ${orderColumn} ${orderDir}, id ${orderDir}`)
    .all(...params);

  res.json(orders);
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/', (req, res) => {
  const {
    po_date,
    last_supply_date,
    quantity_trucks,
    purchase_unit_price,
    selling_unit_price,
    vat_percentage,
    status,
    customer_id,
    customer_name,
    customer_phone,
    notes,
  } = req.body;

  if (!po_date) return res.status(400).json({ error: 'P.O Date is required' });
  if (quantity_trucks == null || purchase_unit_price == null || selling_unit_price == null) {
    return res.status(400).json({ error: 'Quantity, purchase price, and selling price are required' });
  }

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const vatRate = vat_percentage != null ? vat_percentage : settings.default_vat_percentage;

  const totals = computeOrderTotals({
    quantity_trucks,
    purchase_unit_price,
    selling_unit_price,
    vat_percentage: vatRate,
  });

  const customer = upsertCustomer({ customer_id, customer_name, customer_phone });

  const result = db
    .prepare(
      `INSERT INTO orders (
        po_date, last_supply_date, quantity_trucks, purchase_unit_price, selling_unit_price,
        purchase_total, sale_total, vat_percentage, purchase_vat, selling_vat, net_after_vat,
        status, customer_id, customer_name, customer_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      po_date,
      last_supply_date || null,
      quantity_trucks,
      purchase_unit_price,
      selling_unit_price,
      totals.purchase_total,
      totals.sale_total,
      vatRate,
      totals.purchase_vat,
      totals.selling_vat,
      totals.net_after_vat,
      status || 'Supplying',
      customer?.id || null,
      customer?.name || customer_name || null,
      customer?.phone || customer_phone || null,
      notes || null
    );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(order);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });

  const merged = { ...existing, ...req.body };
  const totals = computeOrderTotals({
    quantity_trucks: merged.quantity_trucks,
    purchase_unit_price: merged.purchase_unit_price,
    selling_unit_price: merged.selling_unit_price,
    vat_percentage: merged.vat_percentage,
  });

  const customer = upsertCustomer({
    customer_id: merged.customer_id,
    customer_name: merged.customer_name,
    customer_phone: merged.customer_phone,
  });

  db.prepare(
    `UPDATE orders SET
      po_date = ?, last_supply_date = ?, quantity_trucks = ?, purchase_unit_price = ?, selling_unit_price = ?,
      purchase_total = ?, sale_total = ?, vat_percentage = ?, purchase_vat = ?, selling_vat = ?, net_after_vat = ?,
      status = ?, customer_id = ?, customer_name = ?, customer_phone = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    merged.po_date,
    merged.last_supply_date || null,
    merged.quantity_trucks,
    merged.purchase_unit_price,
    merged.selling_unit_price,
    totals.purchase_total,
    totals.sale_total,
    merged.vat_percentage,
    totals.purchase_vat,
    totals.selling_vat,
    totals.net_after_vat,
    merged.status,
    customer?.id || merged.customer_id || null,
    customer?.name || merged.customer_name || null,
    customer?.phone || merged.customer_phone || null,
    merged.notes || null,
    req.params.id
  );

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(order);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
