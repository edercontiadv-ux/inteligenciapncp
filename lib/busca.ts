import { PNCPResult } from '@/lib/pncp-api';

export const STOPWORDS = new Set([
  'para', 'com', 'sem', 'dos', 'das', 'uma', 'estao', 'serao', 'deve',
  'pra', 'pelo', 'pela', 'sobre', 'entre', 'este', 'esse', 'aquele',
  'como', 'qual', 'quais', 'onde', 'mais', 'mas', 'que', 'sao',
]);

export const GENERIC_TERMS = new Set([
  'locacao', 'aquisicao', 'contratacao', 'prestacao', 'fornecimento',
  'servicos', 'obra', 'obras', 'material', 'equipamento', 'sistema',
  'instalacao', 'manutencao', 'desenvolvimento', 'implementacao',
  'suporte', 'assistencia', 'consultoria', 'gerenciamento',
  'execucao', 'elaboracao', 'projeto', 'programa',
]);

export function extrairPalavrasSignificativas(texto: string): string[] {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[,_.\-;:!?()\[\]{}]/g, ' ')
    .split(/\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 3)
    .filter(p => !STOPWORDS.has(p));
}

export function getTextoObjeto(item: PNCPResult): string {
  return ((item.objetoContrato || '') + ' ' + (item.objetoAta || ''))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function palavraCorresponde(texto: string, palavra: string): boolean {
  if (texto.includes(palavra)) return true;
  if (palavra.length > 5) {
    const stemLength = Math.ceil(palavra.length * 0.8);
    const stem = palavra.slice(0, stemLength);
    return texto.split(/\s+/).some(w => w.startsWith(stem));
  }
  return false;
}

export function scoringRelevancia(resultados: PNCPResult[], palavrasChave: string[]): PNCPResult[] {
  if (palavrasChave.length === 0 || resultados.length === 0) return resultados;

  const N = resultados.length;

  const df: Record<string, number> = {};
  for (const p of palavrasChave) {
    df[p] = 0;
    for (const r of resultados) {
      if (palavraCorresponde(getTextoObjeto(r), p)) df[p]++;
    }
  }

  const scored = resultados.map(item => {
    const texto = getTextoObjeto(item);
    let score = 0;
    for (const p of palavrasChave) {
      if (palavraCorresponde(texto, p)) {
        const freq = df[p] / N;
        score += 1 - freq;
      }
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const comMatch = scored.filter(r => r.score > 0);
  return comMatch.map(r => r.item);
}
