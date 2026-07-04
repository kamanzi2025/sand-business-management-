import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
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
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_purchase_price REAL NOT NULL DEFAULT 0,
    default_selling_price REAL NOT NULL DEFAULT 0,
    default_vat_percentage REAL NOT NULL DEFAULT 18,
    currency_symbol TEXT NOT NULL DEFAULT 'RWF'
  );
`);

const settingsExists = db.prepare('SELECT COUNT(*) AS count FROM settings').get();
if (settingsExists.count === 0) {
  db.prepare(
    `INSERT INTO settings (id, default_purchase_price, default_selling_price, default_vat_percentage, currency_symbol)
     VALUES (1, 0, 0, 18, 'RWF')`
  ).run();
}

export default db;
