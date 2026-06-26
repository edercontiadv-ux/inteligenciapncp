import * as Sentry from '@sentry/nextjs';
import { buscarContratos, buscarAtas, sanitizarInput, PNCPResult } from '@/lib/pncp-api';
import { getPNCPDateRange } from '@/lib/date-utils';
import { extrairPalavrasSignificativas, GENERIC_TERMS, scoringRelevancia } from '@/lib/busca';

export interface BuscaResult {
  results: PNCPResult[];
  totalRegistros: number;
  sugestoes?: string[];
  erro?: string;
  statusCode?: number;
}

export async function executarBusca(query: string): Promise<BuscaResult> {
  const termos = query.split(',').map(t => sanitizarInput(t.trim())).filter(Boolean);
  if (termos.length === 0) {
    return { results: [], totalRegistros: 0, erro: 'Termo de busca inválido', statusCode: 400 };
  }

  const palavrasChave = extrairPalavrasSignificativas(termos[0]);
  const palavrasParaRelevancia = palavrasChave.filter(p => !GENERIC_TERMS.has(p));
  const termosEfetivos = palavrasParaRelevancia.length > 0 ? palavrasParaRelevancia : palavrasChave;
  const temTermosEspecificos = palavrasParaRelevancia.length > 0 && palavrasParaRelevancia.length < palavrasChave.length;

  const { dataInicial, dataFinal } = getPNCPDateRange();
  const inicio = Date.now();

  const tasks = termos.map(async (termo) => {
    const [contratos, atas] = await Promise.all([
      buscarContratos(termo, dataInicial, dataFinal),
      buscarAtas(termo, dataInicial, dataFinal),
    ]);
    return [...(contratos.results || []), ...(atas.results || [])];
  });

  if (temTermosEspecificos) {
    const queryExtra = palavrasParaRelevancia.join(' ');
    tasks.push(
      Promise.all([
        buscarContratos(queryExtra, dataInicial, dataFinal),
        buscarAtas(queryExtra, dataInicial, dataFinal),
      ]).then(([c, a]) => [...(c.results || []), ...(a.results || [])])
    );
  }

  const settled = await Promise.allSettled(tasks);
  const erros = settled.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  const allResults = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  if (erros.length > 0) {
    console.warn(JSON.stringify({
      nivel: 'AVISO', tipo: 'busca_parcial', termos: query,
      erros: erros.length, totalTasks: tasks.length,
    }));
    if (erros.length === tasks.length) {
      Sentry.captureMessage(`PNCP API indisponível: ${termos.join(',')}`, 'warning');
      return {
        results: [], totalRegistros: 0,
        erro: 'API do PNCP indisponível no momento. Tente novamente em alguns instantes.',
        statusCode: 503,
      };
    }
  }

  const seen = new Set<string>();
  const merged = allResults.flat().filter(item => {
    const key = item.tipo === 'CONTRATO'
      ? `c-${item.numeroContrato}-${item.anoContrato}`
      : `a-${item.numeroAtaRegistroPreco}-${item.anoAta}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const resultados = scoringRelevancia(merged, termosEfetivos);
  const latencia = Date.now() - inicio;

  console.log(JSON.stringify({
    nivel: 'INFO', tipo: 'busca', termos: query, termosEfetivos,
    resultadosBrutos: merged.length, resultadosFinais: resultados.length, latenciaMs: latencia,
  }));

  let sugestoes: string[] | undefined;
  if (resultados.length === 0) {
    sugestoes = [];
    if (temTermosEspecificos) sugestoes.push(query);
    if (termosEfetivos.length > 1) sugestoes.push(termosEfetivos.slice(0, -1).join(' '));
    if (palavrasChave.length > 1) {
      const semPrimeiro = palavrasChave.slice(1).join(' ');
      if (!sugestoes.includes(semPrimeiro)) sugestoes.push(semPrimeiro);
    }
  }

  return { results: resultados, totalRegistros: resultados.length, sugestoes: sugestoes?.length ? sugestoes : undefined };
}
