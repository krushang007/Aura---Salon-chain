import crypto from 'crypto';
import { cookies } from 'next/headers';

const AUTH_SECRET = process.env.AUTH_SECRET || 'aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa';
const COOKIE_NAME = 'aura_session';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF' | 'TENANT_ADMIN';
  tenantId?: string | null;
  storeId?: string | null;
}

/**
 * Deterministic PBKDF2 Password Hashing with Salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 600000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${salt}:${iterations}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // Reject legacy plaintext hashes — force password reset for these accounts
  if (!storedHash.includes(':')) return false;

  const parts = storedHash.split(':');
  if (parts.length === 3) {
    // Current format: salt:iterations:hash
    const [salt, iterStr, key] = parts;
    const iterations = Number(iterStr);
    if (!iterations || iterations < 1) return false;
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
  }
  if (parts.length === 2) {
    // Legacy format: salt:hash (1000 iterations) — still verifiable but new hashes use 600k
    const [salt, key] = parts;
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
  }
  return false;
}

/**
 * Lightweight, tamper-proof signed session token (HMAC-SHA256)
 */
export function signSession(user: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expected) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      tenantId: data.tenantId,
      storeId: data.storeId,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySession(token);
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}
