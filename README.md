# 🔍 PesquisaPreço PNCP 
### Ferramenta de Composição de Preço Médio via API do PNCP 
> Auxilia servidores públicos na pesquisa de preços conforme o **art. 23 da Lei nº 14.133/2021**, consultando automaticamente Contratos e Atas de Registro de Preços publicados no Portal Nacional de Contratações Públicas (PNCP). 
 
--- 
 
## 📋 Índice 
 
1. [O que essa ferramenta faz](#o-que-essa-ferramenta-faz) 
2. [Base legal](#base-legal) 
3. [Pré-requisitos](#pré-requisitos) 
4. [Instalação passo a passo](#instalação-passo-a-passo) 
5. [Configuração das chaves de API](#configuração-das-chaves-de-api) 
6. [Como usar a ferramenta](#como-usar-a-ferramenta) 
7. [Como funciona por dentro](#como-funciona-por-dentro) 
8. [Endpoints da API do PNCP utilizados](#endpoints-da-api-do-pncp-utilizados) 
9. [Estrutura do projeto](#estrutura-do-projeto) 
10. [Perguntas frequentes (FAQ)](#perguntas-frequentes-faq) 
11. [Solução de problemas](#solução-de-problemas) 
 
--- 
 
## O que essa ferramenta faz 
 
Esta ferramenta foi criada para facilitar a vida de **servidores públicos** que precisam compor preço médio de objetos para contratações públicas. Em vez de pesquisar manualmente no portal do PNCP, você: 
 
1. **Descreve** com suas próprias palavras o que deseja contratar. 
2. A **Inteligência Artificial (IA)** interpreta sua descrição e extrai os termos técnicos mais adequados para a busca. 
3. A ferramenta **consulta automaticamente** a API do PNCP buscando Contratos e Atas de Registro de Preços com objetos similares **nos últimos 12 meses**. 
4. Os resultados aparecem em um **painel organizado**, com valores, órgão contratante, data e link para download do documento em PDF diretamente do PNCP. 
5. Você pode **exportar um relatório resumido** em PDF com os resultados selecionados, pronto para instruir o processo administrativo. 
 
--- 
 
## Base legal 
 
| Dispositivo | Descrição | 
|---|---| 
| **Art. 23, Lei nº 14.133/2021** | Obrigatoriedade de pesquisa de preços para estimativa de valor de contratações | 
| **§ 1º, art. 23** | A pesquisa deve ser feita em fontes como PNCP, painel de preços e outros | 
| **IN SEGES/MGI nº 65/2021** | Regulamenta os procedimentos de pesquisa de preços | 
 
> ⚠️ **Atenção legal:** A pesquisa não abrange contratos publicados há mais de **12 (doze) meses** da data da consulta, conforme orientação das normas de pesquisa de preços. Esse limite é aplicado automaticamente pela ferramenta. 
 
--- 
 
## Pré-requisitos 
 
Antes de começar, você precisará instalar três programas gratuitos no seu computador. Clique nos links abaixo para baixar: 
 
### 1. Node.js (motor que roda a ferramenta) 
- Acesse: [https://nodejs.org](https://nodejs.org) 
- Baixe a versão **LTS** (recomendada para a maioria dos usuários) 
- Instale normalmente, clicando em "Avançar" em todas as etapas 
 
> **Como verificar se foi instalado:** Abra o terminal (veja abaixo como) e digite `node --version`. Se aparecer algo como `v20.0.0`, está correto. 
 
### 2. Git (para baixar o projeto) 
- Acesse: [https://git-scm.com/downloads](https://git-scm.com/downloads) 
- Baixe e instale para seu sistema operacional 
 
### 3. Cursor (IDE recomendada para iniciantes) 
- Acesse: [https://cursor.sh](https://cursor.sh) 
- Baixe e instale. O Cursor é como um editor de texto inteligente com IA integrada, ideal para quem está começando. 
 
> **Alternativa:** Se preferir, pode usar o [VS Code](https://code.visualstudio.com/), que é igualmente gratuito. 
 
### Como abrir o Terminal 
- **Windows:** Pressione `Windows + R`, digite `cmd` e pressione Enter. Ou pesquise "Prompt de Comando" no menu Iniciar. 
- **Mac:** Pressione `Cmd + Espaço`, digite `Terminal` e pressione Enter. 
 
--- 
 
## Instalação passo a passo 
 
### Passo 1 — Baixe o projeto 
 
Abra o terminal e execute os comandos abaixo **um por vez**, pressionando Enter após cada um: 
 
```bash 
git clone https://github.com/seu-usuario/pesquisa-preco-pncp.git 
cd pesquisa-preco-pncp 
``` 
 
> Se não tiver o link do repositório ainda, você pode baixar o ZIP diretamente pelo GitHub e extrair a pasta em seu computador. 
 
### Passo 2 — Instale as dependências 
 
Ainda no terminal, dentro da pasta do projeto, execute: 
 
```bash 
npm install 
``` 
 
Aguarde. O terminal irá baixar todos os componentes necessários automaticamente. Pode demorar alguns minutos na primeira vez. 
 
### Passo 3 — Configure as variáveis de ambiente 
 
Crie um arquivo chamado `.env.local` na raiz do projeto. Você pode fazer isso pelo Cursor/VS Code ou pelo terminal: 
 
**No terminal (Windows):** 
```bash 
copy .env.example .env.local 
``` 
 
**No terminal (Mac/Linux):** 
```bash 
cp .env.example .env.local 
``` 
 
Agora abra o arquivo `.env.local` e preencha com suas chaves (veja a seção seguinte). 
 
### Passo 4 — Inicie a ferramenta 
 
```bash 
npm run dev 
``` 
 
Depois disso, abra seu navegador e acesse: **http://localhost:3000** 
 
A ferramenta estará rodando. 🎉 
 
--- 
 
## Configuração das chaves de API 
 
A ferramenta usa a IA da Anthropic (Claude) para interpretar sua descrição e refinar os termos de busca. Você precisa de uma chave de acesso gratuita. 
 
### Obtendo a chave da API da Anthropic (Claude) 
 
1. Acesse [https://console.anthropic.com](https://console.anthropic.com) 
2. Crie uma conta gratuita com seu e-mail 
3. Vá em **"API Keys"** no menu lateral 
4. Clique em **"Create Key"**, dê um nome (ex: `pesquisa-preco`) e copie a chave gerada 
5. A chave tem o formato: `sk-ant-api03-XXXXXXXXXX...` 
 
> ⚠️ **Importante:** Nunca compartilhe sua chave de API com ninguém. Trate-a como uma senha. 
 
### Preenchendo o arquivo `.env.local` 
 
Abra o arquivo `.env.local` e preencha assim: 
 
```env 
# Chave da API da Anthropic (IA para depuração de termos) 
ANTHROPIC_API_KEY=sk-ant-api03-SUA-CHAVE-AQUI 
 
# URL base da API do PNCP (não altere) 
PNCP_API_BASE_URL=https://pncp.gov.br/api/consulta/v1 
``` 
 
> A API do PNCP é **pública e gratuita** — não precisa de cadastro ou chave. 
 
--- 
 
## Como usar a ferramenta 
 
### Tela principal 
 
Ao acessar `http://localhost:3000`, você verá: 
 
1. **Campo de descrição:** Escreva com suas próprias palavras o que deseja pesquisar. 
   - ✅ Exemplo bom: *"Aquisição de cadeiras ergonômicas para escritório com regulagem de altura e apoio lombar"* 
   - ✅ Exemplo bom: *"Serviço de limpeza e conservação de prédio público com fornecimento de material"* 
   - ❌ Evite termos muito vagos: *"cadeira"*, *"limpeza"* 
 
2. **Botão "Pesquisar":** Clique para iniciar. A IA irá: 
   - Interpretar sua descrição 
   - Extrair os termos técnicos mais relevantes 
   - Mostrar os termos que serão usados na busca (você pode ajustá-los) 
   - Consultar a API do PNCP 
 
3. **Painel de resultados:** Exibe os Contratos e Atas encontrados com: 
   - Número do contrato/ata 
   - Órgão contratante e UF 
   - Objeto resumido 
   - Valor total e valor unitário (quando disponível) 
   - Data de publicação 
   - Link para visualizar/baixar o PDF no PNCP 
 
4. **Filtros disponíveis:** 
   - Por UF (estado) 
   - Por tipo (Contrato ou Ata de Registro de Preços) 
   - Por faixa de valor 
 
5. **Botão "Exportar Relatório PDF":** Gera um relatório resumido com os resultados selecionados, contendo: 
   - Identificação da pesquisa (objeto, data, termos utilizados) 
   - Tabela com os resultados selecionados 
   - Cálculo automático do preço médio 
   - Referência legal (art. 23, Lei nº 14.133/2021) 
 
--- 
 
## Como funciona por dentro 
 
### Fluxo de dados 
 
``` 
Usuário descreve o objeto 
        ↓ 
[IA Claude] Analisa e extrai termos técnicos 
        ↓ 
[API PNCP] Consulta /contratos com os termos (últimos 12 meses) 
[API PNCP] Consulta /atas com os termos (últimos 12 meses) 
        ↓ 
Resultados exibidos no painel 
        ↓ 
Usuário seleciona e exporta relatório PDF 
``` 
 
### Sobre o limite de 12 meses 
 
A ferramenta calcula automaticamente a data de corte: 
- **Data final:** data de hoje 
- **Data inicial:** exatamente 12 meses antes 
 
Esse intervalo é enviado nos parâmetros `dataInicial` e `dataFinal` de cada chamada à API do PNCP, garantindo conformidade com as normas de pesquisa de preços. 
 
--- 
 
## Endpoints da API do PNCP utilizados 
 
A API do PNCP é pública, RESTful e não exige autenticação para consultas. A URL base é: 
 
``` 
https://pncp.gov.br/api/consulta/v1 
``` 
 
A documentação interativa completa está disponível em: 
[https://pncp.gov.br/api/consulta/swagger-ui/index.html](https://pncp.gov.br/api/consulta/swagger-ui/index.html) 
 
--- 
 
### 1. Consultar Contratos por Data de Publicação 
 
Usado para buscar contratos com objeto similar ao pesquisado dentro do período de 12 meses. 
 
**Endpoint:** 
``` 
GET /contratos 
``` 
 
**Parâmetros principais:** 
 
| Parâmetro | Tipo | Descrição | Exemplo | 
|---|---|---|---| 
| `dataInicial` | string | Data inicial da busca (formato `YYYYMMDD`) | `20240520` | 
| `dataFinal` | string | Data final da busca (formato `YYYYMMDD`) | `20250520` | 
| `q` | string | Termo de busca (objeto do contrato) | `cadeira ergonomica` | 
| `pagina` | integer | Número da página (paginação) | `1` | 
| `tamanhoPagina` | integer | Resultados por página (máx. 500) | `20` | 
 
**Exemplo de chamada:** 
``` 
GET https://pncp.gov.br/api/consulta/v1/contratos?dataInicial=20240520&dataFinal=20250520&q=cadeira+ergonomica&pagina=1&tamanhoPagina=20 
``` 
 
**Campos relevantes do retorno:** 
 
```json 
{ 
  "data": [ 
    { 
      "numeroContrato": "001/2024", 
      "anoContrato": 2024, 
      "orgaoEntidade": { 
        "razaoSocial": "Ministério da Fazenda", 
        "uf": "DF" 
      }, 
      "objetoContrato": "Aquisição de cadeiras ergonômicas...", 
      "valorInicial": 150000.00, 
      "dataVigenciaInicio": "2024-03-01", 
      "dataVigenciaFim": "2025-03-01", 
      "linkArquivo": "https://pncp.gov.br/..." 
    } 
  ], 
  "totalRegistros": 42, 
  "totalPaginas": 3 
} 
``` 
 
--- 
 
### 2. Consultar Atas de Registro de Preços 
 
Usado para buscar Atas de Registro de Preços com objeto similar dentro do período de 12 meses. 
 
**Endpoint:** 
``` 
GET /atas 
``` 
 
**Parâmetros principais:** 
 
| Parâmetro | Tipo | Descrição | Exemplo | 
|---|---|---|---| 
| `dataInicial` | string | Data inicial (formato `YYYYMMDD`) | `20240520` | 
| `dataFinal` | string | Data final (formato `YYYYMMDD`) | `20250520` | 
| `q` | string | Termo de busca | `cadeira ergonomica` | 
| `pagina` | integer | Página | `1` | 
| `tamanhoPagina` | integer | Resultados por página | `20` | 
 
**Exemplo de chamada:** 
``` 
GET https://pncp.gov.br/api/consulta/v1/atas?dataInicial=20240520&dataFinal=20250520&q=cadeira+ergonomica&pagina=1&tamanhoPagina=20 
``` 
 
**Campos relevantes do retorno:** 
 
```json 
{ 
  "data": [ 
    { 
      "numeroAtaRegistroPreco": "002/2024", 
      "anoAta": 2024, 
      "orgaoEntidade": { 
        "razaoSocial": "Tribunal Regional Federal", 
        "uf": "SP" 
      }, 
      "objetoAta": "Registro de preços para fornecimento de cadeiras...", 
      "dataVigenciaInicio": "2024-06-01", 
      "dataVigenciaFim": "2025-06-01", 
      "linkArquivo": "https://pncp.gov.br/..." 
    } 
  ], 
  "totalRegistros": 15, 
  "totalPaginas": 1 
} 
``` 
 
--- 
 
### 3. Observações importantes sobre a API do PNCP 
 
- **Sem autenticação:** As consultas são públicas. Nenhum token ou login é necessário. 
- **Paginação obrigatória:** A API retorna no máximo 500 registros por página. Se `totalPaginas` > 1, a ferramenta consulta as páginas automaticamente. 
- **Sem garantia de SLA:** A API do PNCP é um serviço público e pode apresentar lentidão ou indisponibilidade eventual. A ferramenta exibe mensagem de erro amigável nesses casos. 
- **Formato de data:** Sempre use `YYYYMMDD` sem separadores (ex: `20250520`, não `2025-05-20`). 
- **Encoding:** Os termos de busca no parâmetro `q` devem ser codificados em URL (espaços viram `+` ou `%20`). 
 
--- 
 
## Estrutura do projeto 
 
``` 
pesquisa-preco-pncp/ 
├── app/ 
│   ├── page.tsx              # Página principal (interface do usuário) 
│   ├── layout.tsx            # Layout base 
│   └── api/ 
│       ├── buscar/ 
│       │   └── route.ts      # Rota que chama a API do PNCP 
│       └── depurar-termos/ 
│           └── route.ts      # Rota que chama a IA Claude para refinar termos 
├── components/ 
│   ├── FormBusca.tsx         # Formulário de descrição do objeto 
│   ├── PainelResultados.tsx  # Painel com cards dos resultados 
│   ├── CardContrato.tsx      # Card individual de contrato 
│   ├── CardAta.tsx           # Card individual de ata 
│   └── RelatorioExport.tsx   # Geração do relatório PDF 
├── lib/ 
│   ├── pncp-api.ts           # Funções de chamada à API do PNCP 
│   ├── claude-ai.ts          # Integração com API da Anthropic 
│   └── date-utils.ts         # Cálculo do período de 12 meses 
├── .env.example              # Modelo do arquivo de configuração 
├── .env.local                # Suas configurações (não versionar!) 
├── package.json 
└── README.md 
``` 
 
--- 
 
## Perguntas frequentes (FAQ) 
 
**❓ Preciso pagar para usar a API do PNCP?** 
Não. A API do PNCP é pública e gratuita, mantida pelo Governo Federal. 
 
**❓ Preciso pagar para usar a IA (Claude)?** 
A Anthropic oferece créditos gratuitos para novos usuários. Para uso intensivo, há planos pagos a partir de US$ 5. Para a maioria dos órgãos públicos, o uso gratuito inicial será suficiente para testes. Consulte os preços em [anthropic.com/pricing](https://anthropic.com/pricing). 
 
**❓ Os dados retornados são confiáveis?** 
Sim. Os dados vêm diretamente do PNCP, que é a fonte oficial de contratos e atas da Administração Pública Federal e de entes que aderiram ao portal. 
 
**❓ Por que a pesquisa se limita a 12 meses?** 
Porque o art. 23 da Lei nº 14.133/2021 e as normas de pesquisa de preços (IN SEGES/MGI nº 65/2021) recomendam que os preços coletados sejam recentes, de modo a refletir o mercado atual. Contratos mais antigos podem distorcer o preço médio. 
 
**❓ Posso usar essa ferramenta para qualquer tipo de objeto?** 
Sim, desde que o objeto seja passível de contratação pública e esteja registrado no PNCP. Objetos muito específicos ou novos podem retornar poucos ou nenhum resultado. 
 
**❓ O que fazer se não encontrar resultados?** 
A IA sugere termos alternativos automaticamente. Você também pode editar manualmente os termos de busca na interface antes de pesquisar novamente. Tente termos mais genéricos ou sinônimos. 
 
**❓ A ferramenta substitui a pesquisa de preços completa exigida por lei?** 
Não completamente. O art. 23 da Lei nº 14.133/2021 prevê múltiplas fontes (PNCP, painel de preços, fornecedores, etc.). Esta ferramenta facilita a consulta ao PNCP, que é uma das fontes. O servidor deve complementar com as demais fontes conforme necessário. 
 
--- 
 
## Solução de problemas 
 
### "Erro de conexão com a API do PNCP" 
- Verifique sua conexão com a internet. 
- A API do PNCP pode estar temporariamente indisponível. Tente novamente em alguns minutos. 
- Acesse diretamente [https://pncp.gov.br](https://pncp.gov.br) para verificar se o portal está no ar. 
 
### "Chave de API inválida" (erro da IA) 
- Verifique se a `ANTHROPIC_API_KEY` no arquivo `.env.local` está correta. 
- Certifique-se de que não há espaços antes ou depois da chave. 
- Gere uma nova chave em [console.anthropic.com](https://console.anthropic.com). 
 
### "Nenhum resultado encontrado" 
- Tente termos mais genéricos (ex: em vez de "cadeira presidente giratória com braços", tente "cadeira escritório"). 
- Verifique se o tipo de objeto realmente é contratado pela Administração Pública. 
- Amplie os filtros de UF (por padrão, a busca é nacional). 
 
### A ferramenta não abre no navegador 
- Certifique-se de que o terminal está rodando o comando `npm run dev`. 
- Acesse `http://localhost:3000` (não `https`). 
- Se a porta 3000 estiver ocupada, o Next.js usará automaticamente a 3001. Veja no terminal qual porta está em uso. 
 
### Erros no terminal ao instalar 
- Certifique-se de que o Node.js está instalado corretamente: `node --version`. 
- Tente apagar a pasta `node_modules` e executar `npm install` novamente. 
- Em caso de erro de permissão no Windows, abra o terminal como Administrador. 
 
--- 
 
## Referências 
 
- [Portal Nacional de Contratações Públicas (PNCP)](https://pncp.gov.br) 
- [API de Consulta do PNCP — Swagger](https://pncp.gov.br/api/consulta/swagger-ui/index.html) 
- [Manual de Integração PNCP](https://www.gov.br/pncp/pt-br/central-de-conteudo/manuais) 
- [Lei nº 14.133/2021 — Nova Lei de Licitações](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm) 
- [IN SEGES/MGI nº 65/2021 — Pesquisa de Preços](https://www.in.gov.br/en/web/dou/-/instrucao-normativa-seges-me-n-65-de-7-de-julho-de-2021-331468021) 
- [Documentação da API da Anthropic (Claude)](https://docs.anthropic.com) 
