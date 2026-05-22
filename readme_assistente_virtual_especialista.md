# README — Assistente Virtual Especialista no Sistema

## Objetivo

Implementar um assistente virtual com IA integrado à interface do PesquisaPreço PNCP, capaz de orientar o usuário sobre o funcionamento do sistema, interpretar resultados, explicar a base legal e auxiliar na composição do preço médio.

Diferentemente de um chat entre usuários, este assistente é um **especialista no sistema** que conhece profundamente todas as funcionalidades, fluxos e a legislação aplicável.

---

## Tecnologias Esperadas

### Backend
- Node.js (já existente no projeto)
- Next.js API Routes (já existente)
- LLM Provider existente (Anthropic Claude / OpenAI / Fallback)

### Frontend
- React / Next.js (já existente)
- Componente de chat embutido na interface
- Stream de respostas (SSE ou WebSocket)

---

## Funcionalidades Obrigatórias

### 1. Assistente Contextual na Interface

O assistente deve ficar acessível permanentemente na interface, como um **floating widget** (botão de ajuda) que abre um painel de chat lateral ou modal.

- Ícone flutuante no canto inferior direito
- Painel expansível com mensagens
- Histórico da sessão atual (não precisa de persistência entre sessões)

---

### 2. Conhecimento do Sistema

O assistente deve ser capaz de responder perguntas sobre **todos os aspectos do sistema**:

- **Funcionalidades:** como pesquisar, filtrar, exportar relatório
- **Fluxo de uso:** descrever o objeto, IA extrai termos, consulta PNCP, resultados, seleção, exportação
- **Interface:** explicar cada componente (FormBusca, PainelResultados, CardContrato, CardAta, RelatorioExport)
- **Termos técnicos:** o que é PNCP, o que é Ata de Registro de Preços, o que é Contrato
- **Base legal:** Art. 23 da Lei 14.133/2021, IN SEGES/MGI nº 65/2021
- **Limitações:** janela de 12 meses, tipos de documento consultados, paginação

---

### 3. Interpretação de Resultados

O assistente deve ajudar o usuário a interpretar os resultados da pesquisa:

- Explicar o significado de cada campo (valor inicial, UF, órgão, datas)
- Ajudar a comparar valores entre resultados
- Sugerir refinamentos na busca se o resultado for insatisfatório
- Explicar o cálculo do preço médio no relatório exportado

---

### 4. Orientação Passo a Passo

O assistente pode **guiar o usuário** durante o uso:

- "Como fazer uma pesquisa?"
- "O que fazer se não encontrar resultados?"
- "Como exportar o relatório?"
- "Como interpretar o preço médio calculado?"
- "Quais filtros estão disponíveis e como usá-los?"

---

### 5. Conhecimento da Base Legal

O assistente deve dominar a legislação aplicável:

- Art. 23 da Lei nº 14.133/2021 (pesquisa de preços)
- IN SEGES/MGI nº 65/2021 (procedimentos de pesquisa)
- Fontes aceitas para composição de preço médio
- Prazo de 12 meses para referência

---

### 6. Integração com LLM Existente

Reutilizar a infraestrutura de LLM já existente no projeto:

- **Provider:** reutilizar `LLMProvider` do diretório `lib/llm/`
- **Fallback:** quando não houver API key configurada, usar respostas baseadas em regras locais
- **Streaming:** idealmente, usar streaming (SSE) para mostrar resposta token a token

---

## Arquitetura Sugerida

```txt
/src (já existente)
 ├── components/
 │    ├── FormBusca.tsx          # (existente)
 │    ├── PainelResultados.tsx   # (existente)
 │    ├── AssistenteVirtual.tsx  # NOVO - Componente do assistente
 │    ├── AssistenteButton.tsx   # NOVO - Botão flutuante
 │    └── AssistentePanel.tsx    # NOVO - Painel de chat
 │
 ├── lib/
 │    ├── llm/
 │    │    ├── index.ts          # (existente) - Factory de providers
 │    │    ├── types.ts          # (existente) - Interface LLMProvider
 │    │    └── providers/
 │    │         ├── anthropic.ts # NOVO - Provider com system prompt de especialista
 │    │         ├── openai.ts    # NOVO - Provider com system prompt de especialista
 │    │         └── fallback.ts  # NOVO - Fallback com base de conhecimento local
 │    ├── assistente/
 │    │    ├── knowledge-base.ts # NOVO - Base de conhecimento do sistema
 │    │    └── prompts.ts        # NOVO - Templates de prompt do assistente
 │    └── pncp-api.ts           # (existente)
 │
 └── app/
      ├── page.tsx              # (existente) - Adicionar AssistenteVirtual
      ├── api/
      │    ├── buscar/          # (existente)
      │    ├── depurar-termos/  # (existente)
      │    └── assistente/      # NOVO - API route para o assistente
      │         └── route.ts    # NOVO - POST /api/assistente
```

---

## Base de Conhecimento

O assistente deve ter acesso a uma base de conhecimento local contendo:

### Sobre o Sistema
- Nome e propósito do sistema
- Funcionalidades implementadas
- Limitações conhecidas
- Fluxo de funcionamento

### Sobre a Interface
- Descrição de cada componente
- Como usar filtros (UF, tipo, valor)
- Como selecionar resultados
- Como exportar relatório PDF

### Base Legal
- Texto do Art. 23 da Lei 14.133/2021
- IN SEGES/MGI nº 65/2021
- Explicação em linguagem simples

### PNCP
- O que é o PNCP
- O que são contratos e atas
- Como acessar os PDFs originais

---

## API Route: POST /api/assistente

### Request

```json
{
  "message": "Como faço para filtrar os resultados por estado?",
  "context": {
    "currentPage": "home",
    "hasResults": true,
    "termoBusca": "cadeira ergonômica"
  }
}
```

### Response (SSE - Streaming)

```
data: {"token": "Para"}
data: {"token": "filtrar"}
data: {"token": "os"}
data: {"token": "resultados"}
data: {"token": "por"}
data: {"token": "UF"}
data: {"token": ","}
data: {"token": "você"}
...
data: {"done": true}
```

---

## Eventos e Fluxo

```txt
Usuário clica no botão de ajuda
         ↓
Painel lateral abre com saudação
         ↓
Usuário digita pergunta
         ↓
Frontend envia POST /api/assistente
         ↓
API route recebe mensagem + contexto
         ↓
LLM gera resposta com base no conhecimento
         ↓
Resposta é streamada via SSE
         ↓
Painel exibe resposta token a token
```

---

## Conhecimento Local (Fallback)

Quando não há API key configurada, o assistente deve usar uma base de conhecimento local com respostas pré-definidas para perguntas comuns, utilizando correspondência de palavras-chave.

Exemplos de perguntas e respostas embutidas:

| Pergunta | Resposta |
|----------|----------|
| "Como pesquisar?" | Descreva o objeto que deseja contratar no campo de texto e clique em "Pesquisar". A IA extrairá os termos técnicos e consultará a API do PNCP automaticamente. |
| "O que é PNCP?" | PNCP é o Portal Nacional de Contratações Públicas, a plataforma oficial do governo federal para registro de licitações, contratos e atas. |
| "Base legal" | A pesquisa de preços é obrigatória pelo Art. 23 da Lei nº 14.133/2021, regulamentada pela IN SEGES/MGI nº 65/2021. |

---

## Segurança

- Sanitização das mensagens do usuário
- Rate limiting nas requisições ao assistente
- Validação de tamanho máximo de mensagem
- Não expor chaves de API ou informações sensíveis

---

## Melhorias Futuras

- Memória entre sessões (salvar histórico)
- Sugestões proativas baseadas no estado da interface
- Múltiplos idiomas (português, inglês, espanhol)
- Voz (text-to-speech para respostas)
- Acesso a documentos externos (manuais, legislação completa)
- Embeddings para busca semântica na base de conhecimento
- Plugins para cálculo de reajuste e índices econômicos

---

## Objetivo Final

O assistente virtual deve permitir que qualquer usuário, mesmo sem familiaridade com licitações públicas, consiga utilizar o sistema de forma autônoma, compreendendo cada etapa do fluxo e interpretando corretamente os resultados obtidos.
