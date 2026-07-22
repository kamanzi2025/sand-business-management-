import { Router } from 'express';
import { get, run } from '../db/init.js';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../utils/auth.js';

const router = Router();
const COOKIE_NAME = 'sand_session';
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      })
  );
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

export function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  if (verifySessionToken(cookies[COOKIE_NAME])) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

router.get('/status', (req, res) => {
  const cookies = parseCookies(req);
  res.json({ authenticated: verifySessionToken(cookies[COOKIE_NAME]) });
});

router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const settings = await get('SELECT password_hash FROM settings WHERE id = 1');
    if (!verifyPassword(password, settings?.password_hash)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    setSessionCookie(res, createSessionToken());
    res.json({ authenticated: true });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ authenticated: false });
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const settings = await get('SELECT password_hash FROM settings WHERE id = 1');
    if (!verifyPassword(currentPassword, settings?.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await run('UPDATE settings SET password_hash = ? WHERE id = 1', [hashPassword(newPassword)]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
