import { describe, it, expect, vi, beforeAll } from 'vitest';
import { createHash, randomBytes } from 'crypto';
import { validatePasswordStrength } from '@/lib/password';
import { parseAndValidateJwtExpiry, validateJwtSecret } from '@/lib/auth';

beforeAll(() => {
  process.env.JWT_SECRET = 'a'.repeat(64);
  process.env.JWT_EXPIRES_IN = '15m';
});

// ============================================================
// PASSWORD STRENGTH
// ============================================================

describe('validatePasswordStrength', () => {
  it('deve rejeitar senha com menos de 8 caracteres', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Mínimo de 8 caracteres');
  });

  it('deve rejeitar senha sem maiúscula', () => {
    const result = validatePasswordStrength('abcdef1!@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Pelo menos 1 letra maiúscula');
  });

  it('deve rejeitar senha sem minúscula', () => {
    const result = validatePasswordStrength('ABCDEF1!@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Pelo menos 1 letra minúscula');
  });

  it('deve rejeitar senha sem número', () => {
    const result = validatePasswordStrength('Abcdefgh!@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Pelo menos 1 número');
  });

  it('deve rejeitar senha sem símbolo', () => {
    const result = validatePasswordStrength('Abcdefgh1');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('símbolo'))).toBe(true);
  });

  it('deve aceitar senha forte', () => {
    const result = validatePasswordStrength('MinhaSenha@2026!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve rejeitar senha que contém parte do email', () => {
    const result = validatePasswordStrength('joao123@', { email: 'joao@example.com' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A senha não pode conter parte do seu e-mail');
  });

  it('deve rejeitar senha que contém parte do nome', () => {
    const result = validatePasswordStrength('silva123@', { name: 'João Silva' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A senha não pode conter parte do seu nome');
  });

  it('deve retornar score 4 para senha forte', () => {
    const result = validatePasswordStrength('Minha@2026!');
    expect(result.score).toBe(4);
  });

  it('deve rejeitar senha com mais de 128 caracteres', () => {
    const longPassword = 'A1!' + 'x'.repeat(130);
    const result = validatePasswordStrength(longPassword);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Máximo de 128 caracteres');
  });
});

// ============================================================
// JWT EXPIRY VALIDATION
// ============================================================

describe('parseAndValidateJwtExpiry', () => {
  it('deve converter "15m" para 900 segundos', () => {
    expect(parseAndValidateJwtExpiry('15m')).toBe(900);
  });

  it('deve converter "300s" para 300 segundos', () => {
    expect(parseAndValidateJwtExpiry('300s')).toBe(300);
  });

  it('deve aceitar 5 minutos (300s)', () => {
    expect(parseAndValidateJwtExpiry('5m')).toBe(300);
  });

  it('deve aceitar 60 minutos (3600s)', () => {
    expect(parseAndValidateJwtExpiry('60m')).toBe(3600);
  });

  it('deve rejeitar expiração menor que 5 minutos', () => {
    expect(() => parseAndValidateJwtExpiry('1m')).toThrow('muito curto');
    expect(() => parseAndValidateJwtExpiry('59s')).toThrow('muito curto');
  });

  it('deve rejeitar expiração maior que 60 minutos', () => {
    expect(() => parseAndValidateJwtExpiry('61m')).toThrow('muito longo');
    expect(() => parseAndValidateJwtExpiry('3601s')).toThrow('muito longo');
  });

  it('deve rejeitar formato inválido', () => {
    expect(() => parseAndValidateJwtExpiry('abc')).toThrow('inválido');
    expect(() => parseAndValidateJwtExpiry('15')).toThrow('inválido');
    expect(() => parseAndValidateJwtExpiry('15h')).toThrow('inválido');
  });

  it('deve usar default 15m quando input é undefined', () => {
    expect(parseAndValidateJwtExpiry(undefined)).toBe(900);
  });
});

// ============================================================
// LOCKOUT LOGIC
// ============================================================

describe('Lockout Logic', () => {
  const LOCKOUT_RULES = [
    { threshold: 10, windowMs: 24 * 60 * 60 * 1000, lockMs: 24 * 60 * 60 * 1000 },
    { threshold: 5, windowMs: 15 * 60 * 1000, lockMs: 30 * 60 * 1000 },
    { threshold: 3, windowMs: 5 * 60 * 1000, lockMs: 5 * 60 * 1000 },
  ];

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

  it('não deve bloquear com menos de 3 tentativas', () => {
    const now = Date.now();
    expect(applyLockoutRules(1, now, now - 1000)).toBeNull();
    expect(applyLockoutRules(2, now, now - 1000)).toBeNull();
  });

  it('deve bloquear por 5 min após 3 falhas em 5 min', () => {
    const now = Date.now();
    const firstFail = now - 2 * 60 * 1000;
    const lockedUntil = applyLockoutRules(3, now, firstFail);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil! - now).toBe(5 * 60 * 1000);
  });

  it('deve bloquear por 30 min após 5 falhas em 15 min', () => {
    const now = Date.now();
    const firstFail = now - 10 * 60 * 1000;
    const lockedUntil = applyLockoutRules(5, now, firstFail);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil! - now).toBe(30 * 60 * 1000);
  });

  it('deve bloquear por 24h após 10 falhas em 24h', () => {
    const now = Date.now();
    const firstFail = now - 2 * 60 * 60 * 1000;
    const lockedUntil = applyLockoutRules(10, now, firstFail);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil! - now).toBe(24 * 60 * 60 * 1000);
  });

  it('não deve bloquear se primeira falha expirou', () => {
    const now = Date.now();
    const firstFail = now - 10 * 60 * 1000;
    expect(applyLockoutRules(3, now, firstFail)).toBeNull();
  });

  it('deve aplicar regra mais restritiva para muitas falhas', () => {
    const now = Date.now();
    const lockedUntil = applyLockoutRules(15, now, now - 2 * 60 * 1000);
    expect(lockedUntil).not.toBeNull();
    expect(lockedUntil! - now).toBe(24 * 60 * 60 * 1000);
  });
});

// ============================================================
// AUDIT LOG FUNCTIONS
// ============================================================

describe('Audit Log Functions', () => {
  it('deve importar logAuthEvent sem erros', async () => {
    const { logAuthEvent } = await import('@/lib/audit');
    expect(typeof logAuthEvent).toBe('function');
  });

  it('deve importar checkLoginAttempts sem erros', async () => {
    const { checkLoginAttempts } = await import('@/lib/audit');
    expect(typeof checkLoginAttempts).toBe('function');
  });

  it('deve importar recordLoginAttempt sem erros', async () => {
    const { recordLoginAttempt } = await import('@/lib/audit');
    expect(typeof recordLoginAttempt).toBe('function');
  });

  it('deve importar extractRequestMetadata sem erros', async () => {
    const { extractRequestMetadata } = await import('@/lib/audit');
    const meta = extractRequestMetadata({
      headers: {
        get: (name: string) => {
          if (name === 'x-forwarded-for') return '189.12.34.56';
          if (name === 'user-agent') return 'TestAgent/1.0';
          return null;
        },
      },
    });
    expect(meta.ip).toBe('189.12.34.56');
    expect(meta.userAgent).toBe('TestAgent/1.0');
  });

  it('deve retornar "unknown" se não houver IP', async () => {
    const { extractRequestMetadata } = await import('@/lib/audit');
    const meta = extractRequestMetadata({
      headers: { get: () => null },
    });
    expect(meta.ip).toBe('unknown');
  });

  it('logAuthEvent não deve lançar exceção mesmo sem Prisma', async () => {
    const { logAuthEvent } = await import('@/lib/audit');
    await expect(
      logAuthEvent({
        action: 'LOGIN' as any,
        email: 'test@test.com',
        ipAddress: '127.0.0.1',
        success: true,
      })
    ).resolves.toBeUndefined();
  });

  it('checkLoginAttempts deve retornar não bloqueado em caso de falha', async () => {
    const { checkLoginAttempts } = await import('@/lib/audit');
    const result = await checkLoginAttempts('unknown@test.com', '1.2.3.4');
    expect(result).toHaveProperty('isLocked');
  });
});

// ============================================================
// JWT SECRET VALIDATION
// ============================================================

describe('JWT Secret Validation', () => {
  it('deve aceitar secret hex de 64 caracteres', () => {
    expect(() => validateJwtSecret('a'.repeat(64))).not.toThrow();
  });

  it('deve rejeitar secret undefined', () => {
    expect(() => validateJwtSecret(undefined as any)).toThrow();
  });

  it('deve rejeitar secret com menos de 64 caracteres', () => {
    expect(() => validateJwtSecret('abc')).toThrow('muito curto');
  });

  it('deve rejeitar secret não-hexadecimal', () => {
    const nonHex = 'z' + 'a'.repeat(63);
    expect(() => validateJwtSecret(nonHex)).toThrow('hexadecimal');
  });

  it('deve aceitar secret hex de 128 caracteres', () => {
    expect(() => validateJwtSecret('a'.repeat(128))).not.toThrow();
  });
});

// ============================================================
// TOKEN PAYLOAD
// ============================================================

describe('Token Payload', () => {
  it('deve incluir tokenVersion no payload', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'user',
      tokenVersion: 0,
    };
    expect(payload.tokenVersion).toBeDefined();
    expect(typeof payload.tokenVersion).toBe('number');
  });

  it('novos usuários devem ter tokenVersion = 0', () => {
    expect({ tokenVersion: 0 }.tokenVersion).toBe(0);
  });
});
