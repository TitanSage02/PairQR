import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const scryptAsync = promisify(scrypt);

// --- Env & constants ---
const IS_PROD = process.env.NODE_ENV === 'production';

const JWT_SECRET_ENV = process.env.JWT_SECRET || '';
if (IS_PROD && !JWT_SECRET_ENV) {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET = JWT_SECRET_ENV || 'change-me-in-development';

const ADMIN_SESSION_TTL_HOURS = parseInt(process.env.ADMIN_SESSION_TTL_HOURS || '24', 10);
const ADMIN_PASSWORD_PEPPER = process.env.ADMIN_PASSWORD_PEPPER || ''; // optional but recommended
const JWT_ISSUER = process.env.JWT_ISSUER || 'pairqr';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'pairqr-admin';

// --- Types ---
export interface AdminSettings {
  siteName: string;
  maxSessionDuration: number; // hours
  enableAnalytics: boolean;
  enableFeedback: boolean;
  maintenanceMode: boolean;
  allowedFileTypes: string[]; // e.g. ['image/png','image/jpeg']
  maxFileSize: number; // MB
}

export interface AdminStats {
  totalSessions: number;
  activeConnections: number;
  totalMessages: number;
  totalFeedback: number;
  waitlistSignups: number;
}

type AdminJwt = {
  role: 'admin';
  iat: number;
  exp: number;
  sub?: string;
};

// --- State (in-memory; to persist if needed) ---
let adminData: {
  hashedPassword: string;
  salt: string;
  settings: AdminSettings;
  stats: AdminStats;
} = {
  hashedPassword: '',
  salt: '',
  settings: {
    siteName: 'PairQR',
    maxSessionDuration: 2,
    enableAnalytics: true,
    enableFeedback: true,
    maintenanceMode: false,
    allowedFileTypes: ['*'],
    maxFileSize: 100,
  },
  stats: {
    totalSessions: 0,
    activeConnections: 0,
    totalMessages: 0,
    totalFeedback: 0,
    waitlistSignups: 0,
  },
};

// --- Password hashing ---
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(32).toString('hex');
  const toHash = password + ADMIN_PASSWORD_PEPPER;
  const hash = (await scryptAsync(toHash, salt, 64)) as Buffer;
  return { hash: hash.toString('hex'), salt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const hashBuffer = Buffer.from(hash, 'hex');
    const toHash = password + ADMIN_PASSWORD_PEPPER;
    const verifyBuffer = (await scryptAsync(toHash, salt, 64)) as Buffer;
    // timingSafeEqual requires buffers of the same length
    if (hashBuffer.length !== verifyBuffer.length) return false;
    return timingSafeEqual(hashBuffer, verifyBuffer);
  } catch {
    return false;
  }
}

// --- Bootstrap admin ---
export async function initializeAdmin() {
  if (!adminData.hashedPassword) {
    const envPassword = process.env.ADMIN_PASSWORD;
    if (IS_PROD && !envPassword) {
      throw new Error('ADMIN_PASSWORD must be set in production');
    }
    if (!envPassword) {
      console.warn('⚠️  ADMIN_PASSWORD not set; using dev default (admin123). Set it in .env');
    }
    const { hash, salt } = await hashPassword(envPassword || 'admin123');
    adminData.hashedPassword = hash;
    adminData.salt = salt;
    console.log('✅ Admin password initialized');
  }
}

// --- JWT helpers ---
export function generateAdminToken(subject = 'admin'): string {
  return jwt.sign(
    { role: 'admin' },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: ADMIN_SESSION_TTL_HOURS * 3600, // seconds
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject,
    }
  );
}

export function verifyAdminToken(token: string): AdminJwt | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as AdminJwt;
    return decoded?.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

// --- Middleware ---
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // 1) Authorization: Bearer <token>
  const auth = req.headers.authorization;
  let token: string | undefined;
  if (auth && /^Bearer\s+/i.test(auth)) token = auth.replace(/^Bearer\s+/i, '').trim();

  // 2) Optional cookie (requires cookie-parser on app side)
  // @ts-ignore - cookies can be added by cookie-parser
  if (!token && (req as any).cookies?.adminToken) token = (req as any).cookies.adminToken;

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as any).admin = true;
  return next();
}

// --- Settings ---
export function getAdminSettings(): AdminSettings {
  return adminData.settings;
}

export function updateAdminSettings(newSettings: Partial<AdminSettings>): AdminSettings {
  // Basic validations
  if (newSettings.maxSessionDuration !== undefined) {
    if (!Number.isFinite(newSettings.maxSessionDuration) || newSettings.maxSessionDuration <= 0 || newSettings.maxSessionDuration > 24 * 7) {
      throw new Error('maxSessionDuration must be between 1 and 168 hours');
    }
  }
  if (newSettings.maxFileSize !== undefined) {
    if (!Number.isFinite(newSettings.maxFileSize) || newSettings.maxFileSize <= 0 || newSettings.maxFileSize > 1024) {
      throw new Error('maxFileSize must be between 1 and 1024 MB');
    }
  }
  if (newSettings.allowedFileTypes && !Array.isArray(newSettings.allowedFileTypes)) {
    throw new Error('allowedFileTypes must be an array of strings');
  }

  adminData.settings = { ...adminData.settings, ...newSettings };
  return adminData.settings;
}

// --- Stats ---
export function getAdminStats(): AdminStats {
  return adminData.stats;
}

export function updateAdminStats(updates: Partial<AdminStats>) {
  adminData.stats = { ...adminData.stats, ...updates };
}

export function incrementStat(statName: keyof AdminStats, increment = 1) {
  const current = adminData.stats[statName] as unknown;
  if (typeof current === 'number' && Number.isFinite(current)) {
    (adminData.stats[statName] as number) = current + increment;
  }
}

// --- Password change ---
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const isValid = await verifyPassword(currentPassword, adminData.hashedPassword, adminData.salt);
  if (!isValid) return false;

  const { hash, salt } = await hashPassword(newPassword);
  adminData.hashedPassword = hash;
  adminData.salt = salt;

  // NOTE: without a revocation list, existing tokens remain valid until exp.
  console.log('✅ Admin password changed successfully');
  return true;
}

// --- Login check ---
export async function verifyAdminLogin(password: string): Promise<boolean> {
  return verifyPassword(password, adminData.hashedPassword, adminData.salt);
}

// --- Export (without secrets) ---
export function getAdminData() {
  return { settings: adminData.settings, stats: adminData.stats };
}