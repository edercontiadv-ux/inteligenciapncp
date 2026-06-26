# Plano de Correções — 26/06/2026

Auditoria Enterprise realizada em 26/06/2026. Scorecard atual: **32.5/100**. Meta: **≥ 70/100 em 90 dias**.

---

## Fase 0 — Pânico (0–48h)

Itens que **bloqueiam** o GO para produção com múltiplos usuários.

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P07 | `out.json` com dados sensíveis no disco | `Remove-Item out.json` | `out.json` | 1 min |
| P03 | CSP ausente — qualquer XSS rouba tokens | Adicionar `Content-Security-Policy` restritivo | `next.config.mjs` | 5 min |
| P09 | Erro da API PNCP silencioso → parece "sem resultados" | Propagar erro real ao frontend, distinguir "erro" de "vazio" | `lib/pncp-api.ts`, `app/page.tsx` | 30 min |
| P01 | Rate limiter in-memory bypassável (N instâncias) | Migrar para `@upstash/ratelimit` (HTTP-based, zero cold start) | `lib/rate-limiter.ts`, `package.json` | 1h |

**Critério de avanço:** Teste de brute force local com 100 requisições simultâneas retorna 429 após o limite.

---

## Fase 1 — Segurança e Autenticação (2–7 dias)

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P04 | JWT em localStorage (XSS rouba sessão) | Migrar para HTTP-only cookie `__Secure-inteligencia-pncp` com SameSite=Lax | `lib/auth-context.tsx`, `lib/auth.ts`, `app/api/auth/*` | 4h |
| P05 | Logout não invalida refresh token | Adicionar tabela `refresh_token_blacklist` no banco (Redis é melhor, mas banco já existe) | `prisma/schema.prisma`, `app/api/auth/logout/route.ts`, `app/api/auth/refresh/route.ts` | 2h |
| P06 | FK ausente de Client/Task → User | Adicionar `@relation` com `onDelete: Cascade` + migration | `prisma/schema.prisma` | 30 min |
| P13 | Headers de segurança conflitantes (DENY vs SAMEORIGIN) | Unificar X-Frame-Options=DENY (remover do firebase.json) | `next.config.mjs`, `firebase.json` | 5 min |

**Critério de avanço:** Teste de penetração básico (OWASP Top 10) não encontra vulnerabilidade crítica.

---

## Fase 2 — Performance e Resiliência (7–14 dias)

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P08 | Sem cache de resultados PNCP | Adicionar cache Map com TTL 5 min (enquanto não tem Redis) | `lib/pncp-api.ts` | 1h |
| P19 | API PNCP offline = produto inutilizável | Adicionar fallback: retry com backoff (2 tentativas, delay 1s) + mensagem clara ao usuário | `lib/pncp-api.ts`, `app/page.tsx` | 1h |
| P11 | Sem logs/monitoramento | Adicionar Sentry (Next.js SDK) com alerta de erro no Discord/Email | `sentry.client.config.ts`, `sentry.server.config.ts`, `package.json` | 2h |
| P10 | CI sem prisma migrate deploy | Adicionar `npx prisma migrate deploy` no CI (requer DATABASE_URL como secret) | `.github/workflows/ci.yml` | 15 min |

**Critério de avanço:** 100 buscas simultâneas não aumentam latência média (cache funcionando).

---

## Fase 3 — Database e Infra (14–30 dias)

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P02 | Multi-tenancy sem RLS | Ativar RLS no Supabase: `ALTER TABLE clients ENABLE ROW LEVEL SECURITY;` + policies `USING (user_id = auth.uid())` | SQL via Migration | 2h |
| P15 | Tabela `rate_limits` morta | Remover modelo `RateLimit` do schema Prisma | `prisma/schema.prisma` | 10 min |
| P17 | Zod parse vs safeParse inconsistente | Padronizar todos os endpoints para `safeParse` com mensagens de erro amigáveis | `app/api/tarefas/route.ts`, `app/api/clientes/route.ts` | 30 min |
| P14 | Supabase Free Tier (500 MB, 15 conexões) | Upgrade para Pro ($25/mês) — 100 conexões, 8 GB | Dashboard Supabase | 5 min |
| P16 | tsconfig target ES5 (2011) | Mudar `"target": "es2020"` | `tsconfig.json` | 2 min |

**Critério de avanço:** `npx prisma studio` mostra todas as FKs e índices corretos.

---

## Fase 4 — Arquitetura e Código (30–45 dias)

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P12 | Função GET de busca com 112 linhas | Extrair: `service/buscaService.ts` (lógica) + `lib/pncp-api.ts` mantém (transporte). Route.ts vira só controller | `app/api/buscar/route.ts`, `lib/busca.ts`, `service/buscaService.ts` | 4h |
| P06b | FK de Client/Task → User adicionada | Já incluso na Fase 1 | — | — |
| Q03 | Testes de integração para /api/buscar | Mock da API PNCP com vitest + MSW | `lib/__tests__/busca-integration.test.ts` | 4h |

**Critério de avanço:** `npm run test` cobre ≥ 50% das linhas de lib/.

---

## Fase 5 — UX e Produto (30–60 dias)

| ID | Problema | Ação | Arquivos | Esforço |
|----|----------|------|----------|---------|
| P18 | Onboarding zero | Adicionar tour guiado (Shepherd.js) ou modal na primeira visita | `app/page.tsx`, `components/Tour.tsx` | 8h |
| UX02 | Sem feedback de progresso | Adicionar etapas: "Extraindo termos..." → "Consultando PNCP..." → "Processando resultados..." | `components/FormBusca.tsx`, `app/page.tsx` | 4h |
| UX03 | Sem aviso de sessão expirando | Monitorar `exp` do JWT, mostrar toast 5 min antes | `lib/auth-context.tsx` | 2h |
| P20 | Tema de alto contraste ausente | Adicionar tema `high-contrast` em `lib/themes.ts` | `lib/themes.ts` | 1h |

**Critério de avanço:** Teste de usabilidade com 3 servidores públicos — todos completam o fluxo sem ajuda.

---

## Fase 6 — Monetização e Sustentabilidade (60–90 dias)

| ID | Problema | Ação | Esforço |
|----|----------|------|---------|
| M01 | Pricing zero | Implementar plano gratuito (20 buscas/dia, 1 usuário) e Pro (limitado) | 16h |
| M02 | Sem paywall | Integrar Stripe para pagamentos | 16h |
| M03 | Dependência total da API PNCP | Criar ETL próprio (batch diário) dos dados do PNCP para banco próprio | 40h |

**Critério de avanço:** Primeiro usuário pagante ativo por 30 dias consecutivos.

---

## Tabela-Resumo

| Fase | Tema | Prazo | Esforço | Score pós |
|------|------|-------|---------|-----------|
| 0 | Pânico | 0–48h | ~2h | 40/100 |
| 1 | Segurança | 2–7 dias | ~7h | 55/100 |
| 2 | Performance | 7–14 dias | ~4h | 65/100 |
| 3 | Database/Infra | 14–30 dias | ~3h | 72/100 |
| 4 | Arquitetura | 30–45 dias | ~8h | 78/100 |
| 5 | UX | 30–60 dias | ~15h | 85/100 |
| 6 | Monetização | 60–90 dias | ~72h | 90/100 |

---

## Checklist de Acompanhamento

- [ ] Fase 0 — P07, P03, P09, P01 concluídos
- [ ] Fase 1 — P04, P05, P06, P13 concluídos
- [ ] Fase 2 — P08, P19, P11, P10 concluídos
- [ ] Fase 3 — P02, P15, P17, P14, P16 concluídos
- [ ] Fase 4 — P12, Q03 concluídos
- [ ] Fase 5 — P18, UX02, UX03, P20 concluídos
- [ ] Fase 6 — M01, M02, M03 concluídos
