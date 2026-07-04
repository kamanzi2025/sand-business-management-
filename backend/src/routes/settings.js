import { Router } from 'express';
import { db } from '../db/init.js';

const router = Router();

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

router.put('/', (req, res) => {
  const existing = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const {
    default_purchase_price = existing.default_purchase_price,
    default_selling_price = existing.default_selling_price,
    default_vat_percentage = existing.default_vat_percentage,
    currency_symbol = existing.currency_symbol,
  } = req.body;

  db.prepare(
    `UPDATE settings SET default_purchase_price = ?, default_selling_price = ?, default_vat_percentage = ?, currency_symbol = ? WHERE id = 1`
  ).run(default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol);

  const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(settings);
});

export default router;
