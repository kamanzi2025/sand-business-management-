import { Router } from 'express';
import { db } from '../db/init.js';

const router = Router();

// GET /api/vat?from=&to=
router.get('/', (req, res) => {
  const { from, to } = req.query;
  const clauses = [];
  const params = [];

  if (from) {
    clauses.push('po_date >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('po_date <= ?');
    params.push(to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const totals = db
    .prepare(
      `SELECT
        COALESCE(SUM(purchase_vat), 0) AS total_purchasing_vat,
        COALESCE(SUM(selling_vat), 0) AS total_selling_vat,
        COALESCE(SUM(net_after_vat), 0) AS total_net_vat,
        COUNT(*) AS order_count
      FROM orders ${where}`
    )
    .get(...params);

  const monthly = db
    .prepare(
      `SELECT
        strftime('%Y-%m', po_date) AS month,
        COALESCE(SUM(purchase_vat), 0) AS purchasing_vat,
        COALESCE(SUM(selling_vat), 0) AS selling_vat,
        COALESCE(SUM(net_after_vat), 0) AS net_vat
      FROM orders ${where}
      GROUP BY month
      ORDER BY month ASC`
    )
    .all(...params);

  res.json({ ...totals, monthly });
});

export default router;
