import { NextRequest, NextResponse } from 'next/server';
import { buscarContratos, buscarAtas, sanitizarInput, PNCPResult } from '@/lib/pncp-api';
import { getPNCPDateRange } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';

const STOPWORDS = new Set([
  'para', 'com', 'sem', 'dos', 'das', 'uma', 'estao', 'serao', 'deve',
  'pra', 'pelo', 'pela', 'sobre', 'entre', 'este', 'esse', 'aquele',
  'como', 'qual', 'quais', 'onde', 'mais', 'mas', 'que', 'sao',
]);

const GENERIC_TERMS = new Set([
  'locacao', 'aquisicao', 'contratacao', 'prestacao', 'fornecimento',
  'servicos', 'obra', 'obras', 'material', 'equipamento', 'sistema',
  'instalacao', 'manutencao', 'desenvolvimento', 'implementacao',
  'suporte', 'assistencia', 'consultoria', 'gerenciamento',
  'execucao', 'elaboracao', 'projeto', 'programa',
]);

function extrairPalavrasSignificativas(texto: string): string[] {
  return texto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[,_.\-;:!?()\[\]{}]/g, ' ')
    .split(/\s+/)
    .map(p => p.trim())
    .filter(p => p.length > 3)
    .filter(p => !STOPWORDS.has(p));
}

function getTextoObjeto(item: PNCPResult): string {
  return ((item.objetoContrato || '') + ' ' + (item.objetoAta || ''))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function palavraCorresponde(texto: string, palavra: string): boolean {
  if (texto.includes(palavra)) return true;
  if (palavra.length > 5) {
    const stem = palavra.slice(0, 6);
    return texto.split(/\s+/).some(w => w.startsWith(stem));
  }
  return false;
}

function scoringRelevancia(resultados: PNCPResult[], palavrasChave: string[]): PNCPResult[] {
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

  const MIN_RESULTADOS = Math.min(30, resultados.length);
  const comMatch = scored.filter(r => r.score > 0);

  if (comMatch.length >= MIN_RESULTADOS) {
    return comMatch.map(r => r.item);
  }

  return scored.slice(0, MIN_RESULTADOS).map(r => r.item);
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Termo de busca (q) é obrigatório' }, { status: 400 });
  }

  const termos = q.split(',').map(t => sanitizarInput(t.trim())).filter(Boolean);
  if (termos.length === 0) {
    return NextResponse.json({ error: 'Termo de busca inválido' }, { status: 400 });
  }

  const palavrasChave = extrairPalavrasSignificativas(termos[0]);

  const palavrasParaRelevancia = palavrasChave.filter(p => !GENERIC_TERMS.has(p));
  const termosEfetivos = palavrasParaRelevancia.length > 0 ? palavrasParaRelevancia : palavrasChave;

  const temTermosEspecificos = palavrasParaRelevancia.length > 0 && palavrasParaRelevancia.length < palavrasChave.length;

  const { dataInicial, dataFinal } = getPNCPDateRange();
  const inicio = Date.now();

  try {
    const buscas = termos.map(async (termo) => {
      const [contratos, atas] = await Promise.all([
        buscarContratos(termo, dataInicial, dataFinal).catch(() => ({ results: [] as PNCPResult[] })),
        buscarAtas(termo, dataInicial, dataFinal).catch(() => ({ results: [] as PNCPResult[] })),
      ]);
      return [...(contratos.results || []), ...(atas.results || [])];
    });

    if (temTermosEspecificos) {
      const queryExtra = palavrasParaRelevancia.join(' ');
      buscas.push(
        Promise.all([
          buscarContratos(queryExtra, dataInicial, dataFinal).catch(() => ({ results: [] as PNCPResult[] })),
          buscarAtas(queryExtra, dataInicial, dataFinal).catch(() => ({ results: [] as PNCPResult[] })),
        ]).then(([c, a]) => [...(c.results || []), ...(a.results || [])])
      );
    }

    const allResults = await Promise.all(buscas);

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
      nivel: 'INFO',
      tipo: 'busca',
      termos: q,
      termosEfetivos,
      resultadosBrutos: merged.length,
      resultadosFinais: resultados.length,
      latenciaMs: latencia,
    }));

    return NextResponse.json({
      results: resultados,
      totalRegistros: resultados.length,
      totalPaginas: 1,
    });
  } catch (error) {
    const latencia = Date.now() - inicio;
    console.error(JSON.stringify({
      nivel: 'ERRO',
      tipo: 'busca',
      termos: q,
      latenciaMs: latencia,
      erro: error instanceof Error ? error.message : String(error),
    }));
    return NextResponse.json({ error: 'Erro ao consultar API do PNCP' }, { status: 500 });
  }
}
