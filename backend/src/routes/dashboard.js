import { Router } from 'express';
import { db } from '../db/init.js';

const router = Router();

router.get('/summary', (req, res) => {
  const totals = db
    .prepare(
      `SELECT
        COALESCE(SUM(quantity_trucks), 0) AS total_trucks,
        COALESCE(SUM(purchase_total), 0) AS total_purchase_cost,
        COALESCE(SUM(sale_total), 0) AS total_sales_revenue,
        COALESCE(SUM(sale_total - purchase_total - net_after_vat), 0) AS total_net_profit
      FROM orders`
    )
    .get();

  const outstanding = db
    .prepare(
      `SELECT COALESCE(SUM(sale_total + selling_vat), 0) AS outstanding_amount
       FROM orders WHERE status = 'Invoiced'`
    )
    .get();

  const statusBreakdown = db
    .prepare(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`)
    .all();

  const breakdown = { Supplying: 0, Invoiced: 0, Paid: 0 };
  for (const row of statusBreakdown) {
    breakdown[row.status] = row.count;
  }

  res.json({
    ...totals,
    outstanding_amount: outstanding.outstanding_amount,
    status_breakdown: breakdown,
  });
});

router.get('/trend', (req, res) => {
  const rows = db
    .prepare(
      `SELECT
        strftime('%Y-%m', po_date) AS month,
        COALESCE(SUM(sale_total), 0) AS revenue,
        COALESCE(SUM(sale_total - purchase_total - net_after_vat), 0) AS profit
      FROM orders
      GROUP BY month
      ORDER BY month ASC`
    )
    .all();

  res.json(rows);
});

export default router;
