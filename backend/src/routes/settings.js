import { Router } from 'express';
import { get, run } from '../db/init.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const settings = await get('SELECT * FROM settings WHERE id = 1');
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const existing = await get('SELECT * FROM settings WHERE id = 1');
    const {
      default_purchase_price = existing.default_purchase_price,
      default_selling_price = existing.default_selling_price,
      default_vat_percentage = existing.default_vat_percentage,
      currency_symbol = existing.currency_symbol,
    } = req.body;

    await run(
      `UPDATE settings SET default_purchase_price = ?, default_selling_price = ?, default_vat_percentage = ?, currency_symbol = ? WHERE id = 1`,
      [default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol]
    );

    const settings = await get('SELECT * FROM settings WHERE id = 1');
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
