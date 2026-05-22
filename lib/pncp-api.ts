const BASE_URL = process.env.PNCP_API_BASE_URL || 'https://pncp.gov.br/api/consulta/v1';

export interface PNCPResult {
  numeroContrato?: string;
  anoContrato?: number;
  numeroAtaRegistroPreco?: string;
  anoAta?: number;
  orgaoEntidade: {
    razaoSocial: string;
  };
  unidadeOrgao?: {
    ufSigla?: string;
    ufNome?: string;
    nomeUnidade?: string;
    municipioNome?: string;
  };
  objetoContrato?: string;
  objetoAta?: string;
  valorInicial?: number;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  linkArquivo: string;
  tipo: 'CONTRATO' | 'ATA';
}

export function gerarId(item: PNCPResult, index: number): string {
  if (item.tipo === 'CONTRATO') {
    return `c-${item.numeroContrato}-${item.anoContrato}-${index}`;
  }
  return `a-${item.numeroAtaRegistroPreco}-${item.anoAta}-${index}`;
}

export function sanitizarInput(input: string): string {
  return input
    .replace(/[<>&"']/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 200);
}

export async function searchPNCPText(termo: string, tipoDocumento: 'contrato' | 'ata', pagina: number = 1): Promise<{ results: PNCPResult[]; totalRegistros: number }> {
  if (!termo) return { results: [], totalRegistros: 0 };
  
  // A API de busca textual usa a raiz pncp.gov.br
  const url = `https://pncp.gov.br/api/search/?q=${encodeURIComponent(termo)}&tipos_documento=${tipoDocumento}&pagina=${pagina}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PNCP Search API error: ${response.statusText}`);
    }
    const data = await response.json();
    const rawItems = data?.items || [];
    
    const results: PNCPResult[] = rawItems.map((item: any) => ({
      tipo: tipoDocumento === 'contrato' ? 'CONTRATO' : 'ATA',
      numeroContrato: item.numero_sequencial || item.numero,
      anoContrato: parseInt(item.ano, 10),
      numeroAtaRegistroPreco: item.numero_sequencial || item.numero,
      anoAta: parseInt(item.ano, 10),
      orgaoEntidade: {
        razaoSocial: item.orgao_nome || 'Órgão não informado',
        cnpj: item.orgao_cnpj
      },
      unidadeOrgao: {
        ufSigla: item.uf || '',
        nomeUnidade: item.unidade_nome || '',
        municipioNome: item.municipio_nome || ''
      },
      objetoContrato: item.description,
      objetoAta: item.description,
      valorInicial: item.valor_global,
      dataVigenciaInicio: item.data_inicio_vigencia || item.data_assinatura || '',
      dataVigenciaFim: item.data_fim_vigencia || '',
      linkArquivo: item.item_url ? `https://pncp.gov.br/app${item.item_url}` : ''
    }));

    return {
      results,
      totalRegistros: data?.total || 0
    };
  } catch (error) {
    console.error(`Error fetching from PNCP Search (${tipoDocumento}):`, error);
    return { results: [], totalRegistros: 0 };
  }
}

export async function buscarContratos(q: string, dataInicial: string, dataFinal: string) {
  const result = await searchPNCPText(q, 'contrato');
  return { ...result, totalPaginas: 1 };
}

export async function buscarAtas(q: string, dataInicial: string, dataFinal: string) {
  const result = await searchPNCPText(q, 'ata');
  return { ...result, totalPaginas: 1 };
}
