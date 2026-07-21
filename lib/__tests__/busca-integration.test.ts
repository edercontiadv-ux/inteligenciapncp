import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockItems = vi.hoisted(() => [
  {
    tipo: 'CONTRATO' as const,
    objetoContrato: 'Aquisição de geladeiras para armazenamento de vacinas',
    objetoAta: '',
    numeroContrato: '001',
    anoContrato: 2024,
    orgaoEntidade: { razaoSocial: 'Secretaria de Saúde' },
    unidadeOrgao: { ufSigla: 'SP', nomeUnidade: 'SES-SP' },
    valorInicial: 3500,
    dataVigenciaInicio: '2024-01-15',
    dataVigenciaFim: '2025-01-15',
    linkArquivo: '',
  },
  {
    tipo: 'CONTRATO' as const,
    objetoContrato: 'REFRIGERADOR tipo residencial, capacidade 300L, para conservação de vacinas',
    objetoAta: '',
    numeroContrato: '002',
    anoContrato: 2024,
    orgaoEntidade: { razaoSocial: 'Ministério da Saúde' },
    unidadeOrgao: { ufSigla: 'DF', nomeUnidade: 'MS-DF' },
    valorInicial: 4200,
    dataVigenciaInicio: '2024-03-10',
    dataVigenciaFim: '2025-03-10',
    linkArquivo: '',
  },
  {
    tipo: 'ATA' as const,
    objetoContrato: 'VEICULO DE PASSEIO; HATCH; 1.0 A 1.3',
    objetoAta: '',
    numeroAtaRegistroPreco: '001',
    anoAta: 2024,
    orgaoEntidade: { razaoSocial: 'Prefeitura Municipal' },
    unidadeOrgao: { ufSigla: 'MG', nomeUnidade: 'PMMG' },
    valorInicial: 65000,
    dataVigenciaInicio: '2024-02-01',
    dataVigenciaFim: '2025-02-01',
    linkArquivo: '',
  },
  {
    tipo: 'CONTRATO' as const,
    objetoContrato: 'JARRA DE PLÁSTICO PARA SUCOS 2L',
    objetoAta: '',
    numeroContrato: '003',
    anoContrato: 2024,
    orgaoEntidade: { razaoSocial: 'Câmara Municipal' },
    unidadeOrgao: { ufSigla: 'RJ', nomeUnidade: 'CMRJ' },
    valorInicial: 12.50,
    dataVigenciaInicio: '2024-04-20',
    dataVigenciaFim: '2025-04-20',
    linkArquivo: '',
  },
  {
    tipo: 'CONTRATO' as const,
    objetoContrato: 'Registro de preços para serviços de SANEBAVI - SANEAMENTO BASICO',
    objetoAta: '',
    numeroContrato: '004',
    anoContrato: 2024,
    orgaoEntidade: { razaoSocial: 'SANEBAVI' },
    unidadeOrgao: { ufSigla: 'BA', nomeUnidade: 'EMBASA' },
    valorInicial: 1500000,
    dataVigenciaInicio: '2024-05-01',
    dataVigenciaFim: '2025-05-01',
    linkArquivo: '',
  },
]);

const mockSearchResponse = vi.hoisted(() => (items: any[]) => ({
  results: items,
  totalRegistros: items.length,
}));

vi.mock('@/lib/pncp-api', () => ({
  buscarContratos: vi.fn().mockResolvedValue(mockSearchResponse(mockItems)),
  buscarAtas: vi.fn().mockResolvedValue(mockSearchResponse([])),
  sanitizarInput: (input: string) =>
    input.replace(/[<>&"']/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 200),
  gerarId: (item: any, index: number) => {
    if (item.tipo === 'CONTRATO') return `c-${item.numeroContrato}-${item.anoContrato}-${index}`;
    return `a-${item.numeroAtaRegistroPreco}-${item.anoAta}-${index}`;
  },
}));

vi.mock('@/lib/date-utils', () => ({
  getPNCPDateRange: () => ({
    dataInicial: '20230701',
    dataFinal: '20240701',
  }),
}));

import { executarBusca } from '@/service/buscaService';

describe('integração: buscaService com scoringRelevancia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve filtrar itens irrelevantes reais do incidente e manter apenas os relevantes para "geladeira para vacinas"', async () => {
    const resultado = await executarBusca('geladeira para vacinas, capacidade minima de 300 litros');

    expect(resultado.erro).toBeUndefined();
    expect(resultado.statusCode).toBeUndefined();

    const objetosRetornados = resultado.results.map(r => r.objetoContrato);

    expect(objetosRetornados).not.toContain('VEICULO DE PASSEIO; HATCH; 1.0 A 1.3');
    expect(objetosRetornados).not.toContain('JARRA DE PLÁSTICO PARA SUCOS 2L');
    expect(objetosRetornados).not.toContain(expect.stringContaining('SANEBAVI'));

    expect(objetosRetornados).toContain('Aquisição de geladeiras para armazenamento de vacinas');
    expect(objetosRetornados).toContain('REFRIGERADOR tipo residencial, capacidade 300L, para conservação de vacinas');

    expect(resultado.results.length).toBe(2);
  });

  it('deve retornar vazio quando todos os itens são irrelevantes para a consulta e gerar sugestões', async () => {
    const { buscarContratos: mockBuscar } = await import('@/lib/pncp-api');
    vi.mocked(mockBuscar).mockResolvedValue(
      mockSearchResponse([
        {
          tipo: 'CONTRATO' as const,
          objetoContrato: 'Prestação de serviços de limpeza predial',
          objetoAta: '',
          numeroContrato: '100',
          anoContrato: 2024,
          orgaoEntidade: { razaoSocial: 'Órgão X' },
          unidadeOrgao: { ufSigla: 'SP' },
          valorInicial: 5000,
          dataVigenciaInicio: '2024-01-01',
          dataVigenciaFim: '2025-01-01',
          linkArquivo: '',
        },
      ])
    );

    const resultado = await executarBusca('geladeira para vacinas');

    expect(resultado.results.length).toBe(0);
    expect(resultado.sugestoes).toBeDefined();
    expect(resultado.sugestoes!.length).toBeGreaterThanOrEqual(1);
  });
});
