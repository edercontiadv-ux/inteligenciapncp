import { LLMProvider } from '../types';

export function createFallbackProvider(): LLMProvider {
  return {
    name: 'fallback',
    async depurarTermos(descricao: string) {
      const semAcentos = descricao.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const palavras = semAcentos
        .replace(/[,_.\-;:!?()\[\]{}]/g, ' ')
        .split(/\s+/)
        .filter(p => p.length > 3)
        .filter(p => ![
          // Preposições e conectivos comuns
          'para', 'com', 'sem', 'dos', 'das', 'uma', 'estao', 'serao', 'deve', 'pra', 'pelo', 'pela', 'sobre', 'entre',
          'este', 'esse', 'aquele', 'como', 'qual', 'quais', 'onde',
          // Termos comuns em pedidos de licitação que não ajudam na busca do objeto
          'aquisicao', 'contratacao', 'fornecimento', 'prestacao', 'servico', 'servicos', 
          'material', 'materiais', 'compra', 'registro', 'precos', 'empresa', 'especializada', 
          'necessidade', 'secretaria', 'objetivando', 'visando', 'eventual', 'futura'
        ].includes(p.toLowerCase()))
        .slice(0, 5);

      if (palavras.length === 0) {
        return [descricao.split(' ').slice(0, 3).join(' ')];
      }

      return [palavras.slice(0, 3).join(' ')];
    },
  };
}
