import { NextRequest, NextResponse } from 'next/server';
import { buscarContratos, buscarAtas, sanitizarInput, PNCPResult } from '@/lib/pncp-api';
import { getPNCPDateRange } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';
import { authenticate, unauthorized } from '@/lib/auth';
import { extrairPalavrasSignificativas, GENERIC_TERMS, scoringRelevancia } from '@/lib/busca';

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

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

    let sugestoes: string[] | undefined;
    if (resultados.length === 0) {
      sugestoes = [];
      if (temTermosEspecificos) {
        sugestoes.push(q);
      }
      if (termosEfetivos.length > 1) {
        sugestoes.push(termosEfetivos.slice(0, -1).join(' '));
      }
      if (palavrasChave.length > 1) {
        const semPrimeiro = palavrasChave.slice(1).join(' ');
        if (!sugestoes.includes(semPrimeiro)) sugestoes.push(semPrimeiro);
      }
    }

    return NextResponse.json({
      results: resultados,
      totalRegistros: resultados.length,
      totalPaginas: 1,
      sugestoes: sugestoes?.length ? sugestoes : undefined,
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
