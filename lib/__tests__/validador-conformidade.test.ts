import { describe, it, expect } from 'vitest';
import { gerarObservacoes, gerarDistribuicaoPorUF, gerarDistribuicaoPorTipo } from '@/lib/validador-conformidade';

function makeItem(uf: string) {
  return {
    id: 'r-0',
    tipo: 'CONTRATO' as const,
    numero: '001/2024',
    dataContrato: '2024-01-15',
    orgao: 'Orgao Teste',
    uf,
    objeto: 'Item de teste',
    valorTotal: 5000,
    dataInicio: '2024-01-10',
    linkPDF: '',
    fonte: 'PNCP',
    dataConsulta: new Date().toISOString(),
  };
}

const stats = {
  media: 5000,
  mediana: 4800,
  minimo: 3000,
  maximo: 7000,
  desvioPadrao: 1000,
  coeficienteVariacao: 0.2,
};

describe('gerarObservacoes', () => {
  it('should mention record count', () => {
    const items = [makeItem('SP'), makeItem('SP')];
    const obs = gerarObservacoes(items, stats);
    expect(obs).toContain('2 registros');
  });

  it('should mention multiple UFs when present', () => {
    const items = [makeItem('SP'), makeItem('RJ'), makeItem('MG')];
    const obs = gerarObservacoes(items, stats);
    expect(obs).toContain('3 estados diferentes');
  });

  it('should mention single UF when all items share same UF', () => {
    const items = [makeItem('SP'), makeItem('SP')];
    const obs = gerarObservacoes(items, stats);
    expect(obs).toContain('SP');
  });

  it('should not contain amplitude text (handled by Section 8)', () => {
    const items = [makeItem('SP')];
    const obs = gerarObservacoes(items, stats);
    expect(obs).not.toContain('AMPLITUDE');
    expect(obs).not.toContain('DISPERSÃO');
    expect(obs).not.toContain('CONCLUSÃO');
  });

  it('should handle single record', () => {
    const items = [makeItem('SP')];
    const obs = gerarObservacoes(items, stats);
    expect(obs).toContain('1 registro');
  });

  it('should handle empty results', () => {
    const obs = gerarObservacoes([], stats);
    expect(obs).toContain('0 registros');
  });
});

describe('gerarDistribuicaoPorUF', () => {
  it('should count UFs correctly from listaResultados', () => {
    const items = [
      makeItem('SP'), makeItem('SP'), makeItem('SP'),
      makeItem('RJ'), makeItem('RJ'),
      makeItem('MG'),
    ];
    const dist = gerarDistribuicaoPorUF(items);
    expect(dist).toEqual({ SP: 3, RJ: 2, MG: 1 });
  });

  it('should sum of all UF counts equal listaResultados.length', () => {
    const items = [
      makeItem('SP'), makeItem('RJ'), makeItem('MG'),
      makeItem('DF'), makeItem('BA'),
    ];
    const dist = gerarDistribuicaoPorUF(items);
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    expect(total).toBe(items.length);
  });

  it('should handle empty list', () => {
    const dist = gerarDistribuicaoPorUF([]);
    expect(dist).toEqual({});
  });

  it('should handle single UF', () => {
    const items = [makeItem('SP'), makeItem('SP')];
    const dist = gerarDistribuicaoPorUF(items);
    expect(dist).toEqual({ SP: 2 });
  });

  it('should sort by descending count', () => {
    const items = [
      makeItem('MG'), makeItem('RJ'), makeItem('RJ'),
      makeItem('SP'), makeItem('SP'), makeItem('SP'),
    ];
    const dist = gerarDistribuicaoPorUF(items);
    const keys = Object.keys(dist);
    expect(keys[0]).toBe('SP');
    expect(keys[1]).toBe('RJ');
    expect(keys[2]).toBe('MG');
  });
});

describe('gerarDistribuicaoPorTipo', () => {
  it('should count CONTRATO and ATA', () => {
    const items = [
      { ...makeItem('SP'), tipo: 'CONTRATO' as const },
      { ...makeItem('RJ'), tipo: 'CONTRATO' as const },
      { ...makeItem('MG'), tipo: 'ATA' as const },
    ];
    const dist = gerarDistribuicaoPorTipo(items);
    expect(dist).toEqual({ CONTRATO: 2, ATA: 1 });
  });

  it('should sum equal items.length', () => {
    const items = [
      { ...makeItem('SP'), tipo: 'CONTRATO' as const },
      { ...makeItem('RJ'), tipo: 'ATA' as const },
      { ...makeItem('MG'), tipo: 'ATA' as const },
    ];
    const dist = gerarDistribuicaoPorTipo(items);
    expect(dist.CONTRATO + dist.ATA).toBe(items.length);
  });
});
