import { prisma } from '@/lib/prisma';

export type AuthAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT';

export interface LogAuthEventInput {
  action: AuthAction;
  userId?: string;
  email: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  errorReason?: string;
  metadata?: Record<string, unknown>;
}

export interface LoginAttemptsResult {
  isLocked: boolean;
  lockUntil: Date | null;
  attemptCount: number;
}

let tablesEnsured = false;

async function ensureTables(): Promise<void> {
  if (tablesEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        error_reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0
    `);
    tablesEnsured = true;
  } catch {
    // Tabelas podem já existir ou DB está offline
  }
}

const LOCKOUT_RULES = [
  { threshold: 10, windowMs: 24 * 60 * 60 * 1000, lockMs: 24 * 60 * 60 * 1000 },
  { threshold: 5, windowMs: 15 * 60 * 1000, lockMs: 30 * 60 * 1000 },
  { threshold: 3, windowMs: 5 * 60 * 1000, lockMs: 5 * 60 * 1000 },
] as const;

const DB_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const METADATA_MAX_BYTES = 1024;

interface LockoutEntry {
  count: number;
  firstFailAt: number;
  lastFailAt: number;
  lockedUntil: number | null;
}

const lockoutCache = new Map<string, LockoutEntry>();

function cacheKey(email: string, ipAddress: string): string {
  return `${email.toLowerCase()}:${ipAddress}`;
}

function purgeExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of lockoutCache) {
    if (now - entry.lastFailAt > CACHE_TTL_MS) {
      lockoutCache.delete(key);
    }
  }
}

function applyLockoutRules(attemptCount: number, now: number, firstFailAt: number): number | null {
  for (const rule of LOCKOUT_RULES) {
    if (attemptCount >= rule.threshold) {
      if (now - firstFailAt <= rule.windowMs) {
        return now + rule.lockMs;
      }
    }
  }
  return null;
}

async function queryLoginAttempts(email: string, ipAddress: string): Promise<{ count: number; firstFailAt: Date }> {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const recent = await prisma.loginAttempt.findMany({
    where: {
      OR: [
        { email: email.toLowerCase(), timestamp: { gte: fifteenMinAgo } },
        { ipAddress, timestamp: { gte: fifteenMinAgo } },
      ],
      success: false,
    },
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true },
  });

  if (recent.length === 0) {
    return { count: 0, firstFailAt: new Date() };
  }

  return {
    count: recent.length,
    firstFailAt: recent[0].timestamp,
  };
}

export async function logAuthEvent(input: LogAuthEventInput): Promise<void> {
  try {
    await ensureTables();
    const safeMetadata = input.metadata
      ? JSON.parse(JSON.stringify(input.metadata, (key, value) => {
          if (typeof value === 'string' && value.length > 500) {
            return value.slice(0, 500) + '...';
          }
          return value;
        }))
      : null;

    const metadataJson = safeMetadata
      ? (JSON.stringify(safeMetadata).length > METADATA_MAX_BYTES
          ? { _truncated: true, ...safeMetadata }
          : safeMetadata)
      : null;

    await prisma.auditLog.create({
      data: {
        userId: input.userId || null,
        action: input.action,
        email: input.email.toLowerCase(),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent || null,
        success: input.success,
        errorReason: input.errorReason || null,
        metadata: metadataJson as any,
      },
    });
  } catch {
    // Logging nunca deve interromper o fluxo principal
  }
}

export async function checkLoginAttempts(
  email: string,
  ipAddress: string
): Promise<LoginAttemptsResult> {
  const now = Date.now();
  const key = cacheKey(email, ipAddress);

  purgeExpiredCacheEntries();

  const cached = lockoutCache.get(key);

  if (cached && cached.lockedUntil && cached.lockedUntil > now) {
    return {
      isLocked: true,
      lockUntil: new Date(cached.lockedUntil),
      attemptCount: cached.count,
    };
  }

  if (cached && cached.lockedUntil && cached.lockedUntil <= now) {
    lockoutCache.delete(key);
  }

  try {
    await ensureTables();
    const { count, firstFailAt } = await queryLoginAttempts(email, ipAddress);

    const lockedUntil = applyLockoutRules(count, now, firstFailAt.getTime());

    if (count > 0) {
      lockoutCache.set(key, {
        count,
        firstFailAt: firstFailAt.getTime(),
        lastFailAt: now,
        lockedUntil,
      });
    }

    return {
      isLocked: lockedUntil !== null && lockedUntil > now,
      lockUntil: lockedUntil && lockedUntil > now ? new Date(lockedUntil) : null,
      attemptCount: count,
    };
  } catch {
    if (cached) {
      return {
        isLocked: false,
        lockUntil: null,
        attemptCount: cached.count,
      };
    }
    return { isLocked: false, lockUntil: null, attemptCount: 0 };
  }
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  const now = Date.now();
  const key = cacheKey(email, ipAddress);

  try {
    await ensureTables();
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        timestamp: new Date(now),
        success,
      },
    });
  } catch {
    // Não crítico
  }

  if (success) {
    lockoutCache.delete(key);
  } else {
    const cached = lockoutCache.get(key);
    const firstFailAt = cached ? cached.firstFailAt : now;
    const newCount = cached ? cached.count + 1 : 1;
    const lockedUntil = applyLockoutRules(newCount, now, firstFailAt);

    lockoutCache.set(key, {
      count: newCount,
      firstFailAt,
      lastFailAt: now,
      lockedUntil,
    });
  }

  try {
    const cutoff = new Date(Date.now() - DB_RETENTION_MS);
    await prisma.loginAttempt.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
  } catch {
    // Cleanup não crítico
  }
}

export function extractRequestMetadata(req: { headers: { get: (name: string) => string | null } }): {
  ip: string;
  userAgent: string;
} {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}
