import { Router } from 'express';
import { get, run } from '../db/init.js';

const router = Router();

// password_hash lives in this same table but must never reach the client.
const PUBLIC_COLUMNS = 'id, default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol';

router.get('/', async (req, res, next) => {
  try {
    const settings = await get(`SELECT ${PUBLIC_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

router.put('/', async (req, res, next) => {
  try {
    const existing = await get(`SELECT ${PUBLIC_COLUMNS} FROM settings WHERE id = 1`);
    const {
      default_purchase_price = existing.default_purchase_price,
      default_selling_price = existing.default_selling_price,
      default_vat_percentage = existing.default_vat_percentage,
      currency_symbol = existing.currency_symbol,
    } = req.body;

    if (Number(default_purchase_price) < 0 || Number(default_selling_price) < 0) {
      return res.status(400).json({ error: 'Default prices must be non-negative' });
    }
    if (Number(default_vat_percentage) < 0 || Number(default_vat_percentage) > 100) {
      return res.status(400).json({ error: 'Default VAT % must be between 0 and 100' });
    }

    await run(
      `UPDATE settings SET default_purchase_price = ?, default_selling_price = ?, default_vat_percentage = ?, currency_symbol = ? WHERE id = 1`,
      [default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol]
    );

    const settings = await get(`SELECT ${PUBLIC_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

export default router;
