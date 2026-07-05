import { Router } from 'express';
import { get, all } from '../db/init.js';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    const totals = await get(`SELECT
        COALESCE(SUM(quantity_trucks), 0) AS total_trucks,
        COALESCE(SUM(purchase_total), 0) AS total_purchase_cost,
        COALESCE(SUM(sale_total), 0) AS total_sales_revenue,
        COALESCE(SUM(sale_total - purchase_total - net_after_vat), 0) AS total_net_profit
      FROM orders`);

    const outstanding = await get(
      `SELECT COALESCE(SUM(sale_total + selling_vat), 0) AS outstanding_amount
       FROM orders WHERE status = 'Invoiced'`
    );

    const statusBreakdown = await all(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`);

    const breakdown = { Supplying: 0, Invoiced: 0, Paid: 0 };
    for (const row of statusBreakdown) {
      breakdown[row.status] = row.count;
    }

    res.json({
      ...totals,
      outstanding_amount: outstanding.outstanding_amount,
      status_breakdown: breakdown,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/trend', async (req, res, next) => {
  try {
    const rows = await all(`SELECT
        strftime('%Y-%m', po_date) AS month,
        COALESCE(SUM(sale_total), 0) AS revenue,
        COALESCE(SUM(sale_total - purchase_total - net_after_vat), 0) AS profit
      FROM orders
      GROUP BY month
      ORDER BY month ASC`);

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
