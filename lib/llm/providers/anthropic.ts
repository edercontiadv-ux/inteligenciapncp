import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from '../types';

const PROMPT_TEMPLATE = `Você é um especialista em licitações públicas brasileiras. 
Recebi a seguinte descrição de um objeto que desejo contratar: "{descricao}"

Sua tarefa é extrair os termos técnicos mais adequados para buscar em uma base de dados de contratos (PNCP).
Retorne apenas uma lista de termos de busca, do mais específico para o mais genérico, separados por vírgula.
Não inclua explicações, apenas os termos.
Exemplo: "Cadeira ergonômica, cadeira escritório, cadeira giratória"`;

export function createAnthropicProvider(apiKey: string): LLMProvider {
  const anthropic = new Anthropic({ apiKey });

  return {
    name: 'anthropic',
    async depurarTermos(descricao: string) {
      const prompt = PROMPT_TEMPLATE.replace('{descricao}', descricao);

      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text.split(',').map(t => t.trim());
      }

      return [descricao];
    },
  };
}
