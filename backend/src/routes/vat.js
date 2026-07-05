import { Router } from 'express';
import { get, all } from '../db/init.js';

const router = Router();

// GET /api/vat?from=&to=
router.get('/', async (req, res, next) => {
  try {
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

    const totals = await get(
      `SELECT
        COALESCE(SUM(purchase_vat), 0) AS total_purchasing_vat,
        COALESCE(SUM(selling_vat), 0) AS total_selling_vat,
        COALESCE(SUM(selling_vat) - SUM(purchase_vat), 0) AS total_net_vat,
        COUNT(*) AS order_count
      FROM orders ${where}`,
      params
    );

    const monthly = await all(
      `SELECT
        strftime('%Y-%m', po_date) AS month,
        COALESCE(SUM(purchase_vat), 0) AS purchasing_vat,
        COALESCE(SUM(selling_vat), 0) AS selling_vat,
        COALESCE(SUM(selling_vat) - SUM(purchase_vat), 0) AS net_vat
      FROM orders ${where}
      GROUP BY month
      ORDER BY month ASC`,
      params
    );

    res.json({ ...totals, monthly });
  } catch (err) {
    next(err);
  }
});

export default router;
