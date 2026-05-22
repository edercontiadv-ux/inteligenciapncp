import { LLMProvider } from '../types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: OpenAIMessage;
  }[];
}

const SYSTEM_PROMPT = `Você é um especialista em licitações públicas brasileiras. Sua tarefa é extrair termos técnicos de busca a partir da descrição de um objeto que será contratado.`;

const USER_PROMPT_TEMPLATE = `Extraia os termos técnicos mais adequados para buscar em uma base de dados de contratos públicos (PNCP) a partir da seguinte descrição: "{descricao}"

Retorne apenas uma lista de termos de busca, do mais específico para o mais genérico, separados por vírgula.
Não inclua explicações, apenas os termos.
Exemplo: "Cadeira ergonômica, cadeira escritório, cadeira giratória"`;

export function createOpenAIProvider(apiKey: string, baseURL?: string): LLMProvider {
  const apiBaseURL = baseURL || 'https://api.openai.com/v1';

  return {
    name: 'openai',
    async depurarTermos(descricao: string) {
      const response = await fetch(`${apiBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 100,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: USER_PROMPT_TEMPLATE.replace('{descricao}', descricao) },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data: OpenAIResponse = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        return content.split(',').map(t => t.trim());
      }

      return [descricao];
    },
  };
}
