import { Router } from 'express';
import { get, all, run } from '../db/init.js';
import { computeOrderTotals } from '../../../shared/calc.js';

const router = Router();

const ORDER_STATUSES = new Set(['Supplying', 'Invoiced', 'Paid']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

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

// Validates the fields that drive computeOrderTotals and the status enum,
// since this API has no auth wall in front of it -- the client's own
// validation (native date inputs, min="0") isn't the last line of defense.
function validateOrderFields({ po_date, last_supply_date, quantity_trucks, purchase_unit_price, selling_unit_price, vat_percentage, status }) {
  if (po_date != null && !ISO_DATE.test(po_date)) {
    return 'P.O Date must be a valid date (YYYY-MM-DD)';
  }
  if (last_supply_date != null && last_supply_date !== '' && !ISO_DATE.test(last_supply_date)) {
    return 'Last Supply Date must be a valid date (YYYY-MM-DD)';
  }
  if (quantity_trucks != null && (!Number.isFinite(Number(quantity_trucks)) || Number(quantity_trucks) <= 0)) {
    return 'Quantity (Trucks) must be a positive number';
  }
  if (purchase_unit_price != null && (!Number.isFinite(Number(purchase_unit_price)) || Number(purchase_unit_price) < 0)) {
    return 'Purchasing Unit Price must be a non-negative number';
  }
  if (selling_unit_price != null && (!Number.isFinite(Number(selling_unit_price)) || Number(selling_unit_price) < 0)) {
    return 'Selling Unit Price must be a non-negative number';
  }
  if (vat_percentage != null && (!Number.isFinite(Number(vat_percentage)) || Number(vat_percentage) < 0 || Number(vat_percentage) > 100)) {
    return 'VAT % must be between 0 and 100';
  }
  if (status != null && !ORDER_STATUSES.has(status)) {
    return `Status must be one of: ${[...ORDER_STATUSES].join(', ')}`;
  }
  return null;
}

async function upsertCustomer({ customer_id, customer_name, customer_phone }) {
  if (customer_id) {
    const existing = await get('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (existing) return existing;
  }
  const name = customer_name && customer_name.trim();
  if (name) {
    const byName = await get('SELECT * FROM customers WHERE name = ? COLLATE NOCASE', [name]);
    if (byName) return byName;

    const result = await run('INSERT INTO customers (name, phone) VALUES (?, ?)', [name, customer_phone || null]);
    return get('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid]);
  }
  return null;
}

// GET /api/orders?status=&from=&to=&search=&sortBy=&sortDir=
router.get('/', async (req, res, next) => {
  try {
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

    const orders = await all(
      `SELECT * FROM orders ${where} ORDER BY ${orderColumn} ${orderDir}, id ${orderDir}`,
      params
    );

    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
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

    const validationError = validateOrderFields({
      po_date,
      last_supply_date,
      quantity_trucks,
      purchase_unit_price,
      selling_unit_price,
      vat_percentage,
      status,
    });
    if (validationError) return res.status(400).json({ error: validationError });

    const settings = await get('SELECT * FROM settings WHERE id = 1');
    const vatRate = vat_percentage != null ? vat_percentage : settings.default_vat_percentage;

    const totals = computeOrderTotals({
      quantity_trucks,
      purchase_unit_price,
      selling_unit_price,
      vat_percentage: vatRate,
    });

    const customer = await upsertCustomer({ customer_id, customer_name, customer_phone });

    const result = await run(
      `INSERT INTO orders (
        po_date, last_supply_date, quantity_trucks, purchase_unit_price, selling_unit_price,
        purchase_total, sale_total, vat_percentage, purchase_vat, selling_vat, net_after_vat,
        status, customer_id, customer_name, customer_phone, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        notes || null,
      ]
    );

    const order = await get('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const merged = { ...existing, ...req.body };

    const validationError = validateOrderFields(merged);
    if (validationError) return res.status(400).json({ error: validationError });

    const totals = computeOrderTotals({
      quantity_trucks: merged.quantity_trucks,
      purchase_unit_price: merged.purchase_unit_price,
      selling_unit_price: merged.selling_unit_price,
      vat_percentage: merged.vat_percentage,
    });

    const customer = await upsertCustomer({
      customer_id: merged.customer_id,
      customer_name: merged.customer_name,
      customer_phone: merged.customer_phone,
    });

    await run(
      `UPDATE orders SET
        po_date = ?, last_supply_date = ?, quantity_trucks = ?, purchase_unit_price = ?, selling_unit_price = ?,
        purchase_total = ?, sale_total = ?, vat_percentage = ?, purchase_vat = ?, selling_vat = ?, net_after_vat = ?,
        status = ?, customer_id = ?, customer_name = ?, customer_phone = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [
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
        req.params.id,
      ]
    );

    const order = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    await run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
