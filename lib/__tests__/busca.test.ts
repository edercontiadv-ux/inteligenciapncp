import { describe, it, expect } from 'vitest';
import { extrairPalavrasSignificativas, getTextoObjeto, palavraCorresponde, scoringRelevancia } from '@/app/api/buscar/route';

describe('extrairPalavrasSignificativas', () => {
  it('should extract meaningful words, removing stopwords and short words', () => {
    expect(extrairPalavrasSignificativas('Aquisição de Mini Furgão')).toEqual(['aquisicao', 'mini', 'furgao']);
  });

  it('should handle accented characters', () => {
    expect(extrairPalavrasSignificativas('Locação de Ponto Facial')).toEqual(['locacao', 'ponto', 'facial']);
  });

  it('should return empty array for only stopwords', () => {
    expect(extrairPalavrasSignificativas('para com sem')).toEqual([]);
  });

  it('should remove punctuation', () => {
    expect(extrairPalavrasSignificativas('cadeira, mesa; computador:')).toEqual(['cadeira', 'mesa', 'computador']);
  });
});

describe('getTextoObjeto', () => {
  it('should concatenate contrato and ata objects', () => {
    const item: any = { objetoContrato: 'Cadeira Ergonômica', objetoAta: 'Mesa Executiva' };
    const result = getTextoObjeto(item);
    expect(result).toContain('cadeira');
    expect(result).toContain('mesa');
  });

  it('should handle missing fields', () => {
    const item: any = { objetoContrato: 'Serviço' };
    expect(getTextoObjeto(item)).toContain('servico');
  });

  it('should normalize and lowercase', () => {
    const item: any = { objetoContrato: 'Locação DE Veículo' };
    expect(getTextoObjeto(item)).toBe('locacao de veiculo ');
  });
});

describe('palavraCorresponde', () => {
  it('should match exact word', () => {
    expect(palavraCorresponde('cadeira ergonomica', 'cadeira')).toBe(true);
  });

  it('should match stem for words > 5 chars', () => {
    expect(palavraCorresponde('cadeiras giratorias', 'cadeira')).toBe(true);
  });

  it('should not match different word', () => {
    expect(palavraCorresponde('mesa escritorio', 'cadeira')).toBe(false);
  });

  it('should match via substring for words <= 5 chars', () => {
    expect(palavraCorresponde('minivans', 'mini')).toBe(true);
  });
});

describe('scoringRelevancia', () => {
  const makeItem = (obj: string, tipo = 'CONTRATO') => ({
    tipo,
    objetoContrato: obj,
    objetoAta: '',
    numeroContrato: '1',
    anoContrato: 2024,
    orgaoEntidade: null,
    unidadeOrgao: null,
    valorInicial: null,
    dataVigenciaInicio: null,
    dataVigenciaFim: null,
  } as any);

  it('should return empty for empty input', () => {
    expect(scoringRelevancia([], ['teste'])).toEqual([]);
  });

  it('should rank matching results above non-matching', () => {
    const items = [
      makeItem('Cadeira Ergonômica Escritório'),
      makeItem('Serviço de Limpeza'),
    ];
    const result = scoringRelevancia(items, ['cadeira', 'ergonomica']);
    expect(result[0].objetoContrato).toContain('Cadeira');
  });

  it('should return at least 30 results when few match', () => {
    const items = Array.from({ length: 35 }, (_, i) => makeItem(`Item ${i}`));
    const result = scoringRelevancia(items, ['mesa']);
    expect(result.length).toBe(30);
  });

  it('should return all matching items when >= 30 match and IDF > 0', () => {
    const items = [
      ...Array.from({ length: 30 }, (_, i) => makeItem('Cadeira Escritório')),
      ...Array.from({ length: 15 }, (_, i) => makeItem('Mesa Escritório')),
    ];
    const result = scoringRelevancia(items, ['cadeira', 'mesa']);
    expect(result.length).toBe(45);
  });
});
