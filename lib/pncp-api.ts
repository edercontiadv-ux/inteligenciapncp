const ITENS_POR_PAGINA = 100;
const PAGINAS_BUSCA = 2;
const CACHE_TTL = 5 * 60 * 1000;
const RETRY_MAX = 2;
const RETRY_DELAY = 1000;

const cache = new Map<string, { data: any; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (now > entry.expiresAt) cache.delete(key);
  });
}, 60 * 1000);

function getCacheKey(termo: string, tipoDocumento: string, pagina: number, dataInicial?: string, dataFinal?: string): string {
  return `${termo}:${tipoDocumento}:${pagina}:${dataInicial || ''}:${dataFinal || ''}`;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

async function fetchWithRetry(url: string, attempt: number = 1): Promise<Response> {
  const response = await fetch(url, { headers: { 'User-Agent': UA } });
  if (response.ok) return response;
  if (response.status < 500) throw new Error(`API PNCP retornou HTTP ${response.status}: ${response.statusText}`);
  if (attempt >= RETRY_MAX) throw new Error(`API PNCP falhou após ${RETRY_MAX} tentativas: HTTP ${response.status}`);
  await new Promise(r => setTimeout(r, RETRY_DELAY * attempt));
  return fetchWithRetry(url, attempt + 1);
}

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

function filtrarPorData(items: PNCPResult[], dataInicial: string, dataFinal: string): PNCPResult[] {
  return items.filter((item) => {
    if (!item.dataVigenciaInicio) return false;
    const dataItem = item.dataVigenciaInicio.replace(/\D/g, '').slice(0, 8);
    return dataItem >= dataInicial && dataItem <= dataFinal;
  });
}

async function searchPNCPText(
  termo: string,
  tipoDocumento: 'contrato' | 'ata',
  pagina: number = 1,
  dataInicial?: string,
  dataFinal?: string
): Promise<{ results: PNCPResult[]; totalRegistros: number }> {
  if (!termo) return { results: [], totalRegistros: 0 };

  const cacheKey = getCacheKey(termo, tipoDocumento, pagina, dataInicial, dataFinal);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  let url = `https://pncp.gov.br/api/search/?q=${encodeURIComponent(termo)}&tipos_documento=${tipoDocumento}&pagina=${pagina}&tamanhoPagina=${ITENS_POR_PAGINA}`;

  if (dataInicial && dataFinal) {
    url += `&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;
  }

  const response = await fetchWithRetry(url);
  const data = await response.json();
  const rawItems = data?.items || [];

  let results: PNCPResult[] = rawItems.map((item: any) => ({
    tipo: tipoDocumento === 'contrato' ? 'CONTRATO' : 'ATA',
    numeroContrato: item.numero_sequencial || item.numero,
    anoContrato: parseInt(item.ano, 10),
    numeroAtaRegistroPreco: item.numero_sequencial || item.numero,
    anoAta: parseInt(item.ano, 10),
    orgaoEntidade: {
      razaoSocial: item.orgao_nome || 'Órgão não informado',
      cnpj: item.orgao_cnpj,
    },
    unidadeOrgao: {
      ufSigla: item.uf || '',
      nomeUnidade: item.unidade_nome || '',
      municipioNome: item.municipio_nome || '',
    },
    objetoContrato: item.description,
    objetoAta: item.description,
    valorInicial: item.valor_global,
    dataVigenciaInicio: item.data_inicio_vigencia || item.data_assinatura || '',
    dataVigenciaFim: item.data_fim_vigencia || '',
    linkArquivo: item.item_url ? `https://pncp.gov.br/app${item.item_url}` : '',
  }));

  if (dataInicial && dataFinal) {
    results = filtrarPorData(results, dataInicial, dataFinal);
  }

  const result = { results, totalRegistros: results.length };
  cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL });
  return result;
}

export async function buscarContratos(q: string, dataInicial: string, dataFinal: string) {
  const resultsPorPagina = await Promise.all(
    Array.from({ length: PAGINAS_BUSCA }, (_, i) => i + 1).map((p) =>
      searchPNCPText(q, 'contrato', p, dataInicial, dataFinal)
    )
  );
  const results = resultsPorPagina.flatMap((r) => r.results);
  return { results, totalPaginas: PAGINAS_BUSCA };
}

export async function buscarAtas(q: string, dataInicial: string, dataFinal: string) {
  const resultsPorPagina = await Promise.all(
    Array.from({ length: PAGINAS_BUSCA }, (_, i) => i + 1).map((p) =>
      searchPNCPText(q, 'ata', p, dataInicial, dataFinal)
    )
  );
  const results = resultsPorPagina.flatMap((r) => r.results);
  return { results, totalPaginas: PAGINAS_BUSCA };
}
