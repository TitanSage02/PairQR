import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const ADMIN_SESSION_TTL = parseInt(process.env.ADMIN_SESSION_TTL_HOURS || '24') * 60 * 60 * 1000;

// In-memory storage for admin settings (use database in production)
let adminData = {
  hashedPassword: '',
  salt: '',
  settings: {
    siteName: 'PairQR',
    maxSessionDuration: 2,
    enableAnalytics: true,
    enableFeedback: true,
    maintenanceMode: false,
    allowedFileTypes: ['*'],
    maxFileSize: 100 // MB
  },
  stats: {
    totalSessions: 0,
    activeConnections: 0,
    totalMessages: 0,
    totalFeedback: 0,
    waitlistSignups: 0
  }
};

interface AdminRequest extends Request {
  admin?: boolean;
}

// Hash password with salt
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(32).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return { hash: hash.toString('hex'), salt };
}

// Verify password
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const hashBuffer = Buffer.from(hash, 'hex');
  const verifyBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashBuffer, verifyBuffer);
}

// Initialize admin password from environment
export async function initializeAdmin() {
  if (!adminData.hashedPassword) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    console.warn('⚠️  Admin password not set or using default. Please change ADMIN_PASSWORD in .env');
    
    const { hash, salt } = await hashPassword(adminPassword);
    adminData.hashedPassword = hash;
    adminData.salt = salt;
    
    console.log('✅ Admin password initialized');
  }
}

// Generate JWT token for admin
export function generateAdminToken(): string {
  return jwt.sign(
    { role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: `${process.env.ADMIN_SESSION_TTL_HOURS || 24}h` }
  );
}

// Verify JWT token
export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

// Admin authentication middleware
export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.adminToken;
  
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  req.admin = true;
  next();
}

// Get admin settings
export function getAdminSettings() {
  return adminData.settings;
}

// Update admin settings
export function updateAdminSettings(newSettings: Partial<typeof adminData.settings>) {
  adminData.settings = { ...adminData.settings, ...newSettings };
  return adminData.settings;
}

// Get admin stats
export function getAdminStats() {
  return adminData.stats;
}

// Update admin stats
export function updateAdminStats(updates: Partial<typeof adminData.stats>) {
  adminData.stats = { ...adminData.stats, ...updates };
}

// Increment stat counters
export function incrementStat(statName: keyof typeof adminData.stats, increment: number = 1) {
  if (typeof adminData.stats[statName] === 'number') {
    (adminData.stats[statName] as number) += increment;
  }
}

// Change admin password
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const isValid = await verifyPassword(currentPassword, adminData.hashedPassword, adminData.salt);
  if (!isValid) {
    return false;
  }
  
  const { hash, salt } = await hashPassword(newPassword);
  adminData.hashedPassword = hash;
  adminData.salt = salt;
  
  console.log('✅ Admin password changed successfully');
  return true;
}

// Verify admin login
export async function verifyAdminLogin(password: string): Promise<boolean> {
  return verifyPassword(password, adminData.hashedPassword, adminData.salt);
}

// Get all admin data (for backup/export)
export function getAdminData() {
  return {
    settings: adminData.settings,
    stats: adminData.stats    
  };
}
