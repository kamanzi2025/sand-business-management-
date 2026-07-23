import { Router } from 'express';
import { createClient } from '@libsql/client';
import { all, get } from '../db/init.js';

const router = Router();
const SNAPSHOTS_TO_KEEP = 14; // ~2 weeks of daily rolling backups

function backupClient() {
  const url = process.env.BACKUP_TURSO_DATABASE_URL;
  const authToken = process.env.BACKUP_TURSO_AUTH_TOKEN;
  if (!url) return null;
  return createClient(authToken ? { url, authToken } : { url });
}

// GET /api/cron/backup -- triggered daily by Vercel Cron (see vercel.json).
// Vercel attaches `Authorization: Bearer <CRON_SECRET>` to its own cron
// requests when CRON_SECRET is set as a project env var, so this can't be
// triggered by anyone else hitting the URL.
router.get('/backup', async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      // Fail closed: if CRON_SECRET is ever unset (misconfiguration, a
      // botched env var edit), this must reject everyone, not silently
      // become an open endpoint.
      return res.status(401).json({ error: 'Not authorized' });
    }

    const backup = backupClient();
    if (!backup) {
      return res.status(500).json({ error: 'Backup database is not configured' });
    }

    await backup.execute(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        data TEXT NOT NULL
      )
    `);

    const [customers, orders, settings] = await Promise.all([
      all('SELECT * FROM customers'),
      all('SELECT * FROM orders'),
      get('SELECT * FROM settings WHERE id = 1'),
    ]);

    const snapshot = JSON.stringify({ customers, orders, settings });
    await backup.execute({ sql: 'INSERT INTO snapshots (data) VALUES (?)', args: [snapshot] });

    // Prune to the last N snapshots so this doesn't grow forever.
    await backup.execute(`
      DELETE FROM snapshots
      WHERE id NOT IN (SELECT id FROM snapshots ORDER BY id DESC LIMIT ${SNAPSHOTS_TO_KEEP})
    `);

    res.json({
      ok: true,
      backed_up: { customers: customers.length, orders: orders.length },
      at: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
