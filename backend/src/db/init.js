import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '..', '..', 'data.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(authToken ? { url, authToken } : { url });

let ready;

export function init() {
  if (!ready) {
    ready = db.batch(
      [
        `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          po_date TEXT NOT NULL,
          last_supply_date TEXT,
          quantity_trucks REAL NOT NULL,
          purchase_unit_price REAL NOT NULL,
          selling_unit_price REAL NOT NULL,
          purchase_total REAL NOT NULL,
          sale_total REAL NOT NULL,
          vat_percentage REAL NOT NULL DEFAULT 18,
          purchase_vat REAL NOT NULL,
          selling_vat REAL NOT NULL,
          net_after_vat REAL NOT NULL,
          status TEXT NOT NULL DEFAULT 'Supplying' CHECK (status IN ('Supplying', 'Invoiced', 'Paid')),
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          customer_name TEXT,
          customer_phone TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          default_purchase_price REAL NOT NULL DEFAULT 0,
          default_selling_price REAL NOT NULL DEFAULT 0,
          default_vat_percentage REAL NOT NULL DEFAULT 18,
          currency_symbol TEXT NOT NULL DEFAULT 'RWF'
        )`,
        `INSERT OR IGNORE INTO settings (id, default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol)
         VALUES (1, 0, 0, 18, 'RWF')`,
      ],
      'write'
    );
  }
  return ready;
}

export async function get(sql, args = []) {
  const { rows } = await db.execute({ sql, args });
  return rows[0];
}

export async function all(sql, args = []) {
  const { rows } = await db.execute({ sql, args });
  return rows;
}

export async function run(sql, args = []) {
  const result = await db.execute({ sql, args });
  return { lastInsertRowid: Number(result.lastInsertRowid), rowsAffected: result.rowsAffected };
}

export default db;
