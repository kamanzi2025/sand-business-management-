import { Router } from 'express';
import { db } from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  const customers = db.prepare(`
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
  `).all();
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(name.trim(), phone || null);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const { name, phone } = req.body;
  db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?').run(
    name ?? existing.name,
    phone ?? existing.phone,
    req.params.id
  );
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

export default router;
