import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('hex');
}

export function createSessionToken() {
  const payload = String(Date.now());
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false;

  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < SESSION_MAX_AGE_MS;
}
