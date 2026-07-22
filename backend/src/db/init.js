import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../utils/auth.js';

// Change this immediately after first deploy via Settings -> Change Password.
const DEFAULT_PASSWORD = 'SandSupply#2026';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, '..', '..', 'data.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(authToken ? { url, authToken } : { url });

let ready;

// Adds columns that postdate a table's original CREATE TABLE. Safe to run
// on every cold start: it inspects the live schema first and only alters
// tables that actually predate the column, so it never touches data.
async function addColumnIfMissing(table, column, definition) {
  const { rows } = await db.execute(`PRAGMA table_info(${table})`);
  const exists = rows.some((row) => row.name === column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function setDefaultPasswordIfMissing() {
  const { rows } = await db.execute('SELECT password_hash FROM settings WHERE id = 1');
  if (!rows[0]?.password_hash) {
    await db.execute({
      sql: 'UPDATE settings SET password_hash = ? WHERE id = 1',
      args: [hashPassword(DEFAULT_PASSWORD)],
    });
  }
}

export function init() {
  if (!ready) {
    ready = db
      .batch(
        [
          `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
          )`,
          `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT,
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
      )
      .then(() => addColumnIfMissing('orders', 'po_number', 'TEXT'))
      .then(() => addColumnIfMissing('settings', 'password_hash', 'TEXT'))
      .then(() => setDefaultPasswordIfMissing())
      .catch((err) => {
        // Don't let one transient failure (e.g. a momentary network blip to
        // Turso) wedge this warm instance forever -- without this, every
        // request on this instance would keep reusing the same rejected
        // promise until Vercel recycles it, long after the blip passed.
        ready = null;
        throw err;
      });
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
