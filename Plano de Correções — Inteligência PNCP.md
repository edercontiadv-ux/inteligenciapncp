**Plano de Correções — Inteligência PNCP**

Este documento consolida todos os problemas identificados na análise do projeto (funcionais, de infraestrutura, de leiaute/identidade visual e de higiene de repositório) e organiza a execução em **fases sequenciais e isoladas**, para que cada correção possa ser aplicada, testada e validada antes de avançar para a próxima — evitando sobrecarga de mudanças simultâneas e reduzindo o risco de regressão.

**Como usar este documento**

Cada fase deve ser tratada como uma entrega independente: uma branch própria, um conjunto pequeno de commits, testes manuais do checklist correspondente e, só então, merge. Não recomendamos pular fases ou agrupar fases de risco diferente em uma única entrega. As fases estão ordenadas por dependência e por risco crescente (com exceção da Fase 6, que é de baixo risco mas foi deixada por último de propósito, para não misturar limpeza de repositório com mudanças de comportamento).

**Legenda**

|**Símbolo**|**Significado**|
| :- | :- |
|🟢 Risco baixo|Mudança isolada, sem efeito colateral esperado em outras partes|
|🟡 Risco médio|Mudança que toca infraestrutura, performance ou múltiplos componentes|
|🔴 Risco alto|Mudança que afeta segurança, dados ou comportamento legal da ferramenta|

-----
**Fase 0 — Preparação (🟢 Risco baixo)**

Objetivo: criar uma rede de segurança antes de qualquer alteração de comportamento.

- [ ] Criar branch fix/plano-correcoes a partir da main.
- [ ] Rodar npm run build e npm run test no estado atual e registrar o resultado como linha de base (mesmo que já existam falhas, documentar quais).
- [ ] Fazer backup do .env / .env.local atual usado em produção (se já houver deploy).
- [ ] Confirmar com o responsável pelo ambiente de produção (Firebase/Cloud Run/Vercel) qual é, hoje, o serviço realmente publicado — Streamlit antigo ou Next.js — antes de tocar em infraestrutura na Fase 2.

**Critério de avanço:** branch criada, baseline documentado, ambiente de produção identificado.

-----
**Fase 1 — Correções funcionais críticas (🔴 Risco alto, mas isoladas)**

Estas correções afetam diretamente a confiabilidade legal e de segurança da ferramenta. São tratadas primeiro porque são as que mais comprometem a credibilidade do produto, e cada uma pode ser feita e testada isoladamente.

**1.1 Aplicar o filtro de 12 meses na busca do PNCP**

- **Onde:** lib/pncp-api.ts (buscarContratos, buscarAtas, searchPNCPText)
- **Problema:** dataInicial/dataFinal são calculados em lib/date-utils.ts mas nunca chegam à URL da API do PNCP.
- **Ação:** incluir os parâmetros de data na query string de searchPNCPText e validar que a API do PNCP aceita esse filtro no endpoint de busca textual (/api/search/). Se o endpoint não suportar filtro de data nativamente, aplicar o filtro no lado do servidor, descartando itens fora da janela de 12 meses antes de retornar ao cliente.
- **Teste:** buscar um termo conhecido e confirmar manualmente que nenhum resultado retornado tem dataVigenciaInicio/data de assinatura anterior a 12 meses da data da consulta.

**1.2 Conectar a depuração de termos por IA ao fluxo de busca**

- **Onde:** components/FormBusca.tsx → deveria chamar /api/depurar-termos antes de /api/buscar.
- **Problema:** a infraestrutura de IA (Anthropic/OpenAI/fallback) existe e funciona, mas nunca é usada pela interface.
- **Ação:** no handleSearch, chamar primeiro /api/depurar-termos com a descrição livre, receber os termos refinados e só então chamar /api/buscar com esses termos. Tratar falha da IA com um fallback silencioso para o texto original (já existe fallback provider para isso).
- **Teste:** digitar uma descrição em linguagem natural (ex.: "cadeira de escritório com apoio lombar") e confirmar nos logs/inspeção de rede que /api/depurar-termos é chamada antes de /api/buscar, e que os termos técnicos extraídos aparecem na query final.

**1.3 Remover ou corrigir o indicador "API PNCP Online"**

- **Onde:** app/layout.tsx
- **Problema:** o ponto verde pulsante é decorativo, não reflete uma verificação real.
- **Ação recomendada (mínima):** remover o indicador até que exista um health-check real. **Ação recomendada (completa):** criar uma rota leve /api/health que faz um HEAD/GET rápido contra a API do PNCP e expõe o status real, consumido por esse indicador.
- **Teste:** simular indisponibilidade da API do PNCP (bloquear o domínio localmente) e confirmar que o indicador reflete o estado real, caso a versão completa seja implementada.

**1.4 Remover segredo JWT hardcoded**

- **Onde:** lib/auth.ts, middleware.ts
- **Problema:** fallback 'super\_secret\_key' é usado se JWT\_SECRET não estiver definido — risco de rodar em produção sem segredo real.
- **Ação:** remover o fallback; se JWT\_SECRET não estiver definido, a aplicação deve falhar a inicialização com um erro claro (throw no boot), nunca operar com um segredo previsível.
- **Teste:** remover JWT\_SECRET do .env localmente e confirmar que a aplicação não inicia silenciosamente em modo insegura.

**Critério de avanço:** as quatro correções testadas individualmente, build e testes da Fase 0 ainda passando.

-----
**Fase 2 — Infraestrutura e deploy (🟡 Risco médio)**

Objetivo: garantir que o que está configurado para publicação corresponda à aplicação Next.js atual, não ao legado Streamlit.

**2.1 Resolver o conflito Dockerfile / Firebase Hosting**

- **Problema:** Dockerfile builda e executa app.py (Streamlit), enquanto firebase.json aponta para um serviço Cloud Run chamado inteligencia-pncp. Se o deploy seguir esses arquivos como estão, a versão publicada será a antiga.
- **Ação:** decidir explicitamente qual stack é a "fonte da verdade" (recomendação: Next.js, que é onde está o trabalho mais recente e o leiaute premium). Criar um Dockerfile (ou usar build nativo do provedor) específico para o Next.js, apontar o firebase.json/serviço Cloud Run para esse novo build, e mover o Dockerfile do Streamlit para dentro de versions/ junto do código legado.
- **Teste:** fazer um deploy em ambiente de staging e confirmar, pela URL pública, que a interface servida é a Next.js (visualmente, com o tema institucional), não a tela do Streamlit.

**2.2 Substituir o rate limiter em memória**

- **Problema:** lib/rate-limiter.ts usa um Map local; não funciona corretamente em ambientes com múltiplas instâncias (serverless, várias réplicas).
- **Ação:** migrar para um armazenamento compartilhado (ex.: Upstash Redis, ou tabela no Postgres já usado via Prisma) **ou**, se o volume de uso não justificar essa complexidade agora, documentar explicitamente essa limitação conhecida em README.md para não criar falsa sensação de proteção.
- **Teste:** simular múltiplas instâncias (ou múltiplos processos locais) fazendo requisições simultâneas e verificar se o limite é respeitado de forma agregada.

**2.3 Decidir o destino do código legado em Python**

- **Problema:** versions/v1, v2, v3, app.py, scratch/ e a pasta awesome-claude-skills-master aumentam o peso do repositório e geram confusão sobre qual é a versão ativa.
- **Ação:** mover tudo isso para um repositório separado de arquivo histórico (ou um branch legacy-streamlit isolado), mantendo o repositório principal apenas com o Next.js.

**2.4 Prevenir pausa do Supabase gratuito (keep-alive automático)**

- **Problema:** o projeto usa o tier gratuito do Supabase, que pausa o banco de dados após **7 dias de inatividade** (sem queries). Isso faz com que a primeira requisição do dia (ou da semana) leve 10–30 segundos enquanto o banco "acorda" — e, em alguns cenários, a requisição simplesmente falha por timeout.
- **Solução implementada:** GitHub Action `.github/workflows/keep-alive.yml` que faz uma requisição ao endpoint `/api/health` diariamente às 06:00 UTC (03:00 BRT), simulando atividade no banco e impedindo a pausa.
- **Ação:** ativar o GitHub Action no repositório (aparece automaticamente na aba "Actions" do GitHub após o push). Validar manualmente nos primeiros 3 dias que o workflow está executando e retornando HTTP 200.
- **Alternativa (se não usar GitHub Actions):** usar cron-job.org gratuito configurado para pingar `https://inteligenciapncp.web.app/api/health` a cada 24h.
- **Nota:** o endpoint `/api/health` já existe (`app/api/health/route.ts`) e faz uma query leve ao PNCP — não ao banco. Para garantir que o Supabase não pause, o ideal é que a health check também faça uma query mínima no banco (ex.: `SELECT 1`). Se o keep-alive não for suficiente com o endpoint atual, adicionar uma query ao banco no health check.

**Critério de avanço:** deploy de staging servindo a aplicação correta; decisão sobre legado documentada (mesmo que a execução completa fique para a Fase 6); keep-alive validado com 3 execuções consecutivas bem-sucedidas na aba Actions do GitHub.

-----
**Fase 3 — Performance e sistema de temas (🟡 Risco médio)**

Objetivo: eliminar o maior gargalo de performance percebida e alinhar a identidade visual a um padrão institucional mais sério, sem ainda tocar nos componentes de resultado.

**3.1 Carregar apenas as fontes do tema ativo**

- **Problema:** app/globals.css importa, de uma vez, mais de 20 famílias de fontes do Google Fonts referentes aos 11 temas, independente do tema selecionado.
- **Ação:** remover os @import fixos do globals.css. Carregar dinamicamente apenas theme.fontUrls do tema ativo (já existe esse campo em lib/themes.ts, só não é usado para isso), via injeção de <link> no ThemeProvider, ou — melhor ainda — migrar para next/font com self-hosting das fontes dos temas que forem mantidos na Fase 3.2, eliminando a dependência de rede externa por completo.
- **Teste:** medir no DevTools (aba Network) o número de requisições de fonte antes e depois; deve cair de ~20 para 1–2.

**3.2 Reduzir o número de temas**

- **Problema:** 11 temas decorativos (incluindo opções como "Tech Innovation" e "Midnight Galaxy") diluem a seriedade de uma ferramenta institucional usada por servidores públicos.
- **Ação:** manter apenas 2 variações do mesmo sistema visual institucional — um modo claro e um modo escuro — e arquivar os demais temas em código (não deletar, apenas remover da lista exposta na interface), para reaproveitamento futuro se necessário.
- **Teste:** revisão visual com o time/usuário-chave validando que os dois temas mantidos cobrem as necessidades (leitura prolongada, apresentação em projetor, etc.).

**3.3 Validar contraste e acessibilidade dos temas mantidos**

- **Ação:** rodar os dois temas finais por um checador de contraste (ex.: WebAIM) para garantir conformidade com WCAG AA nos textos sobre fundo.

**Critério de avanço:** tempo de carregamento da home reduzido de forma mensurável; apenas os temas aprovados visíveis no ThemeSwitcher.

-----
**Fase 4 — Funcionalidades premium na tela de resultados (🟡 Risco médio)**

Objetivo: trazer para a tela o valor que hoje só existe escondido no PDF exportado, e profissionalizar a navegação pelos resultados.

**4.1 Card de estatísticas visível antes da exportação**

- **Ação:** extrair a lógica de cálculo de média (hoje só em RelatorioExport.tsx) para uma função utilitária reaproveitável, e exibir em PainelResultados.tsx um card de destaque com média, mediana, valor mínimo e máximo, calculado sobre os resultados filtrados (não só os selecionados), com indicação clara de quantos itens têm valor informado.
- **Teste:** comparar manualmente os números exibidos na tela com os do PDF exportado — devem coincidir.

**4.2 Ordenação dos resultados**

- **Ação:** adicionar controle de ordenação (valor, data, UF) ao lado dos filtros existentes em PainelResultados.tsx.

**4.3 Paginação ou virtualização do grid**

- **Ação:** definir um limite de itens renderizados por página (ou virtualização, se a lista crescer muito), evitando travamentos com grandes volumes de resultado.

**4.4 Skeleton loaders no lugar do spinner genérico**

- **Ação:** substituir o Loader2 central por placeholders no formato dos cards (CardContrato/CardAta) durante o carregamento, melhorando a percepção de performance.

**Critério de avanço:** card de estatísticas em produção e validado por um usuário real do fluxo de pesquisa de preços.

-----
**Fase 5 — Polimento visual e de marca (🟢 Risco baixo)**

**5.1 Assets de marca ausentes**

- **Ação:** adicionar favicon, ícone para PWA/manifest e imagem de Open Graph em public/, e referenciá-los em metadata no app/layout.tsx.

**5.2 Corrigir renderização de Markdown no assistente virtual**

- **Problema:** a mensagem de boas-vindas usa \*\*negrito\*\* em Markdown, mas AssistenteVirtual.tsx renderiza como texto puro, exibindo os asteriscos literalmente.
- **Ação:** usar uma biblioteca leve de renderização de Markdown para as mensagens do assistente (já há respostas vindas de LLM, que naturalmente trazem formatação).

**5.3 Revisão de microcopy e acessibilidade**

- **Ação:** revisar rótulos, aria-label em botões só com ícone (ex.: botão de abrir/fechar o assistente) e textos de estado vazio.

**Critério de avanço:** checklist de revisão visual fechado; aba do navegador e compartilhamento de link já mostram identidade visual correta.

-----
**Fase 6 — Higiene de repositório (🟢 Risco baixo, executar por último)**

Feita por último de propósito: limpar o repositório não deve ser misturado com mudanças de comportamento, para manter o histórico de commits claro sobre o que mudou funcionalmente.

- [ ] Criar/ajustar .gitignore para excluir venv/, \_\_pycache\_\_/, node\_modules/, .tmp/, \*.tsbuildinfo.
- [ ] Remover do versionamento os artefatos já ignorados que tiverem sido commitados por engano.
- [ ] Mover versions/v1, v2, v3, app.py, execution/, directives/, scratch/ e requirements.txt (Python) para o repositório/branch de arquivo histórico definido na Fase 2.3.
- [ ] Remover awesome-claude-skills-master/ se não for de fato utilizado pelo projeto.
- [ ] Atualizar o README.md principal do projeto para refletir apenas a stack Next.js ativa.

**Critério de avanço:** repositório principal contém apenas o necessário para build e execução da versão Next.js atual.

-----
**Tabela-resumo**

|**Fase**|**Tema**|**Risco**|**Pode rodar em paralelo com**|
| :- | :- | :- | :- |
|0|Preparação|🟢|—|
|1|Correções funcionais críticas|🔴|—|
|2|Infraestrutura e deploy|🟡|Fase 3 (após Fase 1 concluída)|
|2.4|Keep-alive Supabase (GitHub Action)|🟢|Dentro da Fase 2|
|3|Performance e temas|🟡|Fase 2|
|4|Funcionalidades premium na tela|🟡|— (depende da Fase 1.1 e 1.2 estarem corretas)|
|5|Polimento visual e de marca|🟢|Fase 4|
|6|Higiene de repositório|🟢|Por último, isolada|

**Recomendação final**

Não avance para uma fase nova sem fechar o critério de avanço da anterior. As Fases 1 e 2 são as únicas com potencial de afetar a confiabilidade legal e a disponibilidade real do sistema em produção — por isso vêm primeiro, mesmo sem efeito visual algum. As Fases 3 a 5 são as que efetivamente entregam a percepção de "software premium" pedida, mas só têm valor sustentável se a base (Fases 0–2) estiver sólida.

