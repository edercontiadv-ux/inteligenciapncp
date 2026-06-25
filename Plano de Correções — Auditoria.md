# Plano de Correções — Auditoria Completa

Baseado na auditoria realizada em 25/06/2026.

---

## Fase 0 — Emergências de Segurança (0–48h)

Remover imediatamente credenciais expostas e proteger o repositório.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| S01 | Remover `.env` do versionamento, adicionar ao `.gitignore`, rotacionar senha do PostgreSQL e JWT_SECRET | `.env`, `.gitignore` | 🔴 |
| S02 | Remover `API_DeepSeek` do repositório, rotacionar chave no provedor | `API_DeepSeek` | 🔴 |
| S03 | Verificar histórico do git por commits antigos com credenciais e removê-los com `git filter-branch` ou `bfg` | Repositório inteiro | 🔴 |
| S04 | Configurar `.env.example` sem valores reais e garantir que seja a única referência de env vars no repo | `.env.example` | 🟢 |
| S05 | Validar que nenhuma credencial está em logs, backups ou dumps (ex.: `out.json`, `dev.db`) | `out.json`, `prisma/dev.db` | 🔴 |

**Critério de avanço:** `git grep -i "sk-\|secret\|password\|postgres://"` não retorna nenhuma credencial real.

---

## Fase 1 — Correções Críticas de Infra e Arquitetura (2–7 dias)

Proteger o sistema contra colapso em produção.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| I01 | Migrar rate limiter do PostgreSQL para Redis (Upstash) ou cache em memória com `Map` + TTL. Falha no rate limiter **nunca** deve liberar requisição | `lib/rate-limiter.ts` | 🔴 |
| I02 | Adicionar rate limiter nos endpoints `/api/auth/login` e `/api/auth/register` | `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts` | 🔴 |
| I03 | Adicionar índices no banco: `client.user_id`, `task.user_id`, `task.client_id` | `prisma/schema.prisma` (migration) | 🟡 |
| I04 | Adicionar `onDelete: Cascade` no relacionamento `Task → Client` | `prisma/schema.prisma` | 🟡 |
| I05 | Aumentar `JWT_EXPIRES_IN` para 60–120 min | `.env` | 🟢 |
| I06 | Adicionar validação Zod nos endpoints de CRUD de tarefas e clientes | `app/api/tarefas/route.ts`, `app/api/clientes/route.ts` | 🟡 |
| I07 | Descomissionar `prisma/dev.db` (SQLite) — adicionar ao `.gitignore` e deletar | `prisma/dev.db`, `.gitignore` | 🟢 |

**Critério de avanço:** Teste de carga local com 100 requisições simultâneas não derruba o banco.

---

## Fase 2 — Fluxo de Busca e Qualidade dos Resultados (7–14 dias)

A função principal do produto precisa entregar resultados consistentes.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| B01 | Implementar busca por termos específicos (já iniciado — validar e testar com "Locação de Ponto Facial", "Aquisição de Mini Furgão") | `app/api/buscar/route.ts` | 🟡 |
| B02 | Adicionar fallback de busca — se nenhum resultado relevante encontrado, sugerir termos alternativos ao usuário | `app/api/buscar/route.ts` | 🟡 |
| B03 | Adicionar endpoint `/api/buscar` um log estruturado com termos buscados, qtde de resultados, latência e erros | `app/api/buscar/route.ts` | 🟢 |
| B04 | Otimizar dedup de O(n²) para O(n) usando `Map` por chave única | `app/api/buscar/route.ts` | 🟢 |
| B05 | Reduzir chamadas à API PNCP: testar com 2 páginas em vez de 3 (monitorar se afeta resultados) | `lib/pncp-api.ts` | 🟢 |
| B06 | Adicionar cache de resultados PNCP em Redis com TTL de 30 min — mesma busca não bate na API de novo | `lib/pncp-api.ts` | 🟡 |

**Critério de avanço:** "Locação de Ponto Facial" retorna resultados sobre ponto facial no topo. "Aquisição de Mini Furgão" retorna mini furgões.

---

## Fase 3 — Segurança e Autenticação (7–14 dias, paralelo à Fase 2)

Endurecer a proteção do sistema.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| A01 | Unificar JWT em biblioteca única (manter `jose`, remover `jsonwebtoken`) | `lib/auth.ts`, `middleware.ts` | 🟡 |
| A02 | Implementar refresh token ou aumentar JWT e manter sessão com renovação silenciosa | `lib/auth.ts`, `lib/auth-context.tsx` | 🟡 |
| A03 | Logout deve invalidar token no servidor (blacklist de tokens no Redis ou banco) | `lib/auth-context.tsx`, `lib/auth.ts` | 🟡 |
| A04 | Adicionar headers de segurança: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` | `next.config.mjs` | 🟢 |
| A05 | Adicionar proteção CSRF em mutações (login, register, CRUDs) | Middleware ou cookies SameSite | 🟡 |
| A06 | Exigir autenticação mínima para `/api/buscar` (token opcional — anônimo com rate limit mais baixo, logado com limite maior) | `app/api/buscar/route.ts` | 🟡 |

**Critério de avanço:** Teste de penetração básico (OWASP Top 10) não encontra vulnerabilidade crítica.

---

## Fase 4 — DevOps e Observabilidade (14–30 dias)

Sair do "cego" para operação monitorada.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| D01 | Configurar GitHub Actions: CI com `npm run lint && npm run test && npm run build` em todo push e PR | `.github/workflows/ci.yml` | 🟢 |
| D02 | Adicionar Sentry para monitoramento de erros no frontend e backend | `app/layout.tsx`, `lib/sentry.ts` | 🟢 |
| D03 | Configurar logs estruturados (JSON) no Cloud Run — `console.error` não é logging | Toda API route | 🟢 |
| D04 | Adicionar health check no Dockerfile com rota `/api/health` como readiness probe | `Dockerfile`, `start.sh` | 🟡 |
| D05 | Configurar backup automático do Supabase (daily) | Fora do código — configurar no console Supabase | 🟢 |
| D06 | Adicionar `.github/workflows/keep-alive.yml` (já criado) — validar execução | Já existe | 🟢 |
| D07 | Otimizar Dockerfile com cache de camadas: separar `npm ci`, `prisma generate`, `next build` | `Dockerfile` | 🟢 |
| D08 | Configurar página de fallback no Firebase Hosting para quando Cloud Run estiver offline | `firebase.json` | 🟢 |

**Critério de avanço:** Um deploy quebrado gera alerta no Sentry e notificação. Backup do banco é verificável.

---

## Fase 5 — Qualidade de Código e Manutenibilidade (14–30 dias, paralelo à Fase 4)

Reduzir dívida técnica e risco de regressão.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| Q01 | Remover dependências mortas: `@libsql/client`, `@prisma/adapter-libsql`, `react-markdown` | `package.json` | 🟢 |
| Q02 | Substituir `require('@/lib/estatisticas')` por import estático em `RelatorioExport.tsx` | `components/RelatorioExport.tsx` | 🟢 |
| Q03 | Adicionar cleanup no `setInterval` do `PNCPStatusIndicator` | `components/PNCPStatusIndicator.tsx` | 🟢 |
| Q04 | Adicionar testes unitários para `scoringRelevancia`, `buscarMultiplasPaginas`, `calcularEstatisticas` | `lib/__tests__/` | 🟢 |
| Q05 | Adicionar testes de integração para `/api/buscar` (mock da API PNCP) | `app/api/buscar/` | 🟡 |
| Q06 | Avaliar se `lib/assistente/` será usado ou removido (código fantasma) | `lib/assistente/` | 🟢 |
| Q07 | Configurar lint estrito no TypeScript (`strict: true` já está — verificar se há `any`s desnecessários) | `tsconfig.json` | 🟢 |

**Critério de avanço:** `npm run test` cobre ≥ 30% do código (linhas). `npm run lint` passa sem warnings.

---

## Fase 6 — UX e Produto (30–60 dias)

Melhorar a experiência do usuário e aumentar retenção.

| ID | Ação | Arquivos | Risco |
|----|------|----------|-------|
| U01 | Adicionar feedback de progresso na busca (etapas: "Extraindo termos...", "Consultando PNCP...", "Processando resultados...") | `app/page.tsx`, `components/FormBusca.tsx` | 🟢 |
| U02 | Adicionar onboarding tutorial (tooltip ou modal na primeira visita) | `app/page.tsx` | 🟢 |
| U03 | Tratar erros de API com mensagens amigáveis e ações sugeridas | `app/page.tsx` | 🟢 |
| U04 | Adicionar aviso de sessão prestes a expirar (5 min antes) | `lib/auth-context.tsx` | 🟢 |
| U05 | Melhorar empty state: quando busca retorna 0 resultados, mostrar causas possíveis e dicas | `components/PainelResultados.tsx` | 🟢 |
| U06 | Adicionar indicador de "resultados relevantes" vs "resultados ampliados" no painel | `components/PainelResultados.tsx` | 🟡 |

**Critério de avanço:** Teste de usabilidade com 3 pessoas reais do ICP — todas completam o fluxo de busca → seleção → export sem ajuda.

---

## Fase 7 — Monetização e Sustentabilidade (60–90 dias)

Transformar o produto em negócio.

| ID | Ação | Risco |
|----|------|-------|
| M01 | Definir ICP claro: servidor público municipal (prefeituras de médio porte) | 🟢 |
| M02 | Implementar plano gratuito (20 buscas/dia, 1 usuário) e plano pago (buscas ilimitadas, múltiplos usuários, relatórios avançados) | 🟡 |
| M03 | Integrar stripe/pagamentos para planos | 🟡 |
| M04 | Adicionar dashboard de uso do cliente (buscas realizadas, relatórios exportados, tarefas criadas) | 🟡 |
| M05| Criar ETL próprio de dados do PNCP (cache offline) para reduzir dependência da API do governo | 🔴 |

**Critério de avanço:** Primeiro cliente pagante ativo por 30 dias consecutivos.

---

## Tabela-Resumo

| Fase | Tema | Prazo | Risco | Depende de |
|------|------|-------|-------|------------|
| 0 | Emergências de Segurança | 0–48h | 🔴 | — |
| 1 | Correções Críticas de Infra | 2–7 dias | 🔴 | Fase 0 |
| 2 | Fluxo de Busca | 7–14 dias | 🟡 | — |
| 3 | Segurança e Autenticação | 7–14 dias | 🟡 | Fase 0 |
| 4 | DevOps e Observabilidade | 14–30 dias | 🟢 | Fase 1 |
| 5 | Qualidade de Código | 14–30 dias | 🟢 | — |
| 6 | UX e Produto | 30–60 dias | 🟢 | Fase 2 |
| 7 | Monetização | 60–90 dias | 🟡 | Fase 6 |

---

## Recomendação Final

**Prioridade absoluta:** Fase 0 (credenciais vazadas). Enquanto `.env` estiver no repositório público, qualquer pessoa com acesso ao repo tem a senha do banco de produção. Não faça deploy novo antes de resolver isso.

**Sequência sugerida:** Fase 0 → Fase 1 → Fase 2 + Fase 3 (paralelo) → Fase 4 + Fase 5 (paralelo) → Fase 6 → Fase 7.

**Métrica de sucesso:** Scorecard da auditoria subir de 30.5 para ≥ 70 em 90 dias.

---

## Checklist de Acompanhamento

- [ ] Fase 0 — S01 a S05 concluídas e verificadas
- [ ] Fase 1 — I01 a I07 concluídas
- [ ] Fase 2 — B01 a B06 concluídas
- [ ] Fase 3 — A01 a A06 concluídas
- [ ] Fase 4 — D01 a D08 concluídas
- [ ] Fase 5 — Q01 a Q07 concluídas
- [ ] Fase 6 — U01 a U06 concluídas
- [ ] Fase 7 — M01 a M05 concluídas
