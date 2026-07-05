import { Router } from 'express';
import { get, all, run } from '../db/init.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const customers = await all(`
      SELECT
        c.id,
        c.name,
        c.phone,
        c.created_at,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.sale_total + o.selling_vat), 0) AS total_billed,
        COALESCE(SUM(CASE WHEN o.status != 'Paid' THEN o.sale_total + o.selling_vat ELSE 0 END), 0) AS amount_owed
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      GROUP BY c.id
      ORDER BY c.name COLLATE NOCASE
    `);
    res.json(customers);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const customer = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const result = await run('INSERT INTO customers (name, phone) VALUES (?, ?)', [name.trim(), phone || null]);
    const customer = await get('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(customer);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const { name, phone } = req.body;
    await run('UPDATE customers SET name = ?, phone = ? WHERE id = ?', [
      name ?? existing.name,
      phone ?? existing.phone,
      req.params.id,
    ]);
    const customer = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    res.json(customer);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });
    await run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
