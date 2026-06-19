import { LLMProvider } from '../types';

export function createFallbackProvider(): LLMProvider {
  return {
    name: 'fallback',
    async depurarTermos(descricao: string) {
      const semAcentos = descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const palavras = semAcentos
        .replace(/[,_.\-;:!?()\[\]{}]/g, ' ')
        .split(/\s+/)
        .map(p => p.trim())
        .filter(p => p.length > 2)
        .filter(p => ![
          'para', 'com', 'sem', 'dos', 'das', 'uma', 'estao', 'serao', 'deve',
          'pra', 'pelo', 'pela', 'sobre', 'entre', 'este', 'esse', 'aquele',
          'como', 'qual', 'quais', 'onde', 'mais', 'mas', 'que', 'sao',
        ].includes(p.toLowerCase()));

      if (palavras.length === 0) {
        return [descricao];
      }

      return palavras.slice(0, 8);
    },
  };
}
