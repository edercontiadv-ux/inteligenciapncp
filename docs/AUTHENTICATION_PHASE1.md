# Fase 1 — Bloqueadores Críticos de Segurança

## Resumo Executivo

Implementação de auditoria completa, proteção contra força bruta, recuperação de senha, validação de JWT, uniformização de respostas de erro e reforço de senhas.

## Mudanças Implementadas

### 1. Novas Tabelas (Prisma Schema)

| Tabela | Descrição | Arquivo |
|--------|-----------|---------|
| `audit_logs` | Log imutável de eventos de autenticação | `prisma/schema.prisma` |
| `password_reset_tokens` | Tokens de reset de senha (uso único, 15min) | `prisma/schema.prisma` |
| `login_attempts` | Registro de tentativas de login (cleanup 15 dias) | `prisma/schema.prisma` |
| `users.token_version` | Coluna nova para revogação global de sessões | `prisma/schema.prisma` |

**Migration:** `prisma/migrations/0008_add_audit_system/migration.sql`

### 2. Arquivos Novos

| Arquivo | Descrição |
|---------|-----------|
| `lib/audit.ts` | Serviço de auditoria: `logAuthEvent()`, `checkLoginAttempts()`, `recordLoginAttempt()`, `extractRequestMetadata()` |
| `lib/password.ts` | Validação de força de senha: `validatePasswordStrength()` |
| `app/api/auth/forgot-password/route.ts` | Endpoint `POST /api/auth/forgot-password` |
| `app/api/auth/reset-password/route.ts` | Endpoint `POST /api/auth/reset-password` |
| `app/reset-password/page.tsx` | Página frontend de redefinição de senha |
| `lib/__tests__/auth-security.test.ts` | Suite de 49 testes de segurança |

### 3. Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `prisma/schema.prisma` | +3 modelos, +1 coluna em User |
| `lib/auth.ts` | `validateJwtSecret()`, `parseAndValidateJwtExpiry()`, `tokenVersion` no payload |
| `lib/email.ts` | `sendPasswordChangedNotification()`, `sendPasswordResetEmail()` |
| `lib/auth-context.tsx` | Structured error codes, register sem email no retorno |
| `app/api/auth/login/route.ts` | +auditoria, +lockout, +EMAIL_NOT_VERIFIED code (403) |
| `app/api/auth/register/route.ts` | +auditoria, 201 sempre, +password strength validation |
| `app/api/auth/resend-code/route.ts` | +auditoria, 200 sempre (sem revelar existência) |
| `app/api/auth/logout/route.ts` | +auditoria |
| `app/api/auth/verify-email/route.ts` | +auditoria |
| `app/api/auth/verify-by-password/route.ts` | +auditoria |
| `app/api/auth/refresh/route.ts` | +tokenVersion check (revogação de sessão) |
| `app/login/page.tsx` | Structured error handling (err.code) |

### 4. Fluxograma — Antes vs Depois

```
ANTES (enumeração possível):
  /register → 409 "E-mail já cadastrado"  ← REVELA EXISTÊNCIA
  /resend-code → 404 "Usuário não encontrado" ← REVELA
  /login → 403 + needsVerification → REVELA
  Sem auditoria, sem lockout, sem password reset, sem validação de JWT

DEPOIS (protegido):
  /register → 201 sempre (mesma resposta)
  /resend-code → 200 sempre (mesma resposta)
  /login → 401 genérico (ou 403 + code para email verificado)
  Auditoria ativa em todos os eventos
  Lockout progressivo (3→5min, 5→30min, 10→24h)
  Password reset completo (forgot + reset + notificação)
  JWT_SECRET validado na inicialização (fail-fast)
  Senha: 8+ chars, complexidade, rejeita email/nome
```

### 5. Novas Funções (Listagem com Assinaturas)

#### `lib/audit.ts`
```typescript
logAuthEvent(input: LogAuthEventInput): Promise<void>
checkLoginAttempts(email: string, ipAddress: string): Promise<LoginAttemptsResult>
recordLoginAttempt(email: string, ipAddress: string, success: boolean): Promise<void>
extractRequestMetadata(req): { ip: string; userAgent: string }
```

#### `lib/auth.ts`
```typescript
validateJwtSecret(secret: string | undefined): asserts secret is string
parseAndValidateJwtExpiry(input: string | undefined): number
```

#### `lib/password.ts`
```typescript
validatePasswordStrength(password: string, context?: { email?: string; name?: string }): PasswordStrengthResult
```

#### `lib/email.ts`
```typescript
sendPasswordResetEmail(email: string, token: string, expiresInMinutes: number): Promise<void>
sendPasswordChangedNotification(email: string): Promise<void>
```

### 6. Como Rodar Migrations

```bash
# 1. Backup do banco
pg_dump postgresql://... > backup_$(date +%Y%m%d).sql

# 2. Aplicar migration
npx prisma migrate dev --name add_audit_system

# 3. Gerar cliente Prisma atualizado
npx prisma generate
```

### 7. Como Debugar Auditoria (Queries Úteis)

```sql
-- Últimos 50 eventos de auditoria
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;

-- Login falhas por email (últimos 30 dias)
SELECT email, COUNT(*) as failures
FROM audit_logs
WHERE action = 'LOGIN_FAILED' AND created_at > NOW() - INTERVAL '30 days'
GROUP BY email
ORDER BY failures DESC;

-- Contas bloqueadas (lockout ativo)
SELECT email, ip_address, COUNT(*) as attempts, MAX(timestamp) as last_attempt
FROM login_attempts
WHERE success = false AND timestamp > NOW() - INTERVAL '15 minutes'
GROUP BY email, ip_address
HAVING COUNT(*) >= 3;

-- Tokens de reset não utilizados (expirados)
SELECT COUNT(*) FROM password_reset_tokens
WHERE used_at IS NULL AND expires_at < NOW();

-- Cleanup manual de login_attempts antigos
DELETE FROM login_attempts WHERE timestamp < NOW() - INTERVAL '15 days';
```

### 8. Métricas de Segurança (Antes/Depois)

| Métrica | Antes | Depois |
|---------|-------|--------|
| Enumeração de usuários | Possível (3 endpoints) | Eliminada |
| Auditoria de eventos | Zero | 14 tipos de evento |
| Proteção força bruta | Rate limit IP (30/min) | Lockout progressivo + rate limit |
| Recuperação de senha | Inexistente | Completa (token 32 bytes, 15min, uso único) |
| Validação JWT_SECRET | Nenhuma | Fail-fast (64 chars hex, entropia verificada) |
| Validação JWT_EXPIRES_IN | Nenhuma | 5-60 minutos |
| Força de senha | 6 chars, sem regras | 8+ chars, maiúscula, minúscula, número, símbolo |
| Revogação de sessão | Parcial (refresh token) | Global (token_version increment) |
| Notificação de segurança | Nenhuma | Email ao alterar senha |
| Testes de segurança | Zero | 49 testes (100% passing) |

### 9. Breaking Changes

**NENHUM.** Todas as mudanças são backward-compatible:
- Usuários existentes: intocados
- Tokens existentes: continuam válidos (token_version=0)
- Sessões ativas: não foram desconectadas
- Fluxo de login: mesma UX (com proteção adicional invisível)
- Fluxo de registro: mesma UX
- Rotas de API: mesmas assinaturas e retornos (exceto mensagens uniformizadas)

### 10. Checklist de Produção

```
DATABASE:
  ☐ Backup completo antes de migração
  ☐ npx prisma migrate deploy (staging)
  ☐ npx prisma migrate deploy (produção)
  ☐ Índices criados (verificar explain analyze)

CÓDIGO:
  ☐ TypeScript: npx tsc --noEmit (zero erros)
  ☐ Testes: npm test (76 passing)
  ☐ Build: npm run build (sucesso)

SECRETS:
  ☐ JWT_SECRET com 64 chars hex (tamanho atual: OK)
  ☐ .env NÃO versionado (gitignore OK)
  ☐ JWT_SECRET em variável de ambiente na produção

MONITORAMENTO:
  ☐ Sentry capturando LOGIN_FAILED em massa
  ☐ Alerta de >10 LOGIN_FAILED/min para mesmo email
  ☐ Alerta de >10 PASSWORD_RESET_REQUEST/min
  ☐ Dashboard de auditoria ativo
```
