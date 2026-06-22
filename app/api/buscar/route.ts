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

  // Usar apenas termos específicos para relevância — termos genéricos (locação, aquisição, etc.)
  // não diferenciam contratos e causam falsos positivos.
  const palavrasParaRelevancia = palavrasChave.filter(p => !GENERIC_TERMS.has(p));
  // Se todos os termos forem genéricos (ex: busca "Locação"), usar tudo
  const termosEfetivos = palavrasParaRelevancia.length > 0 ? palavrasParaRelevancia : palavrasChave;

  const temEspecificos = palavrasParaRelevancia.length > 0 && palavrasParaRelevancia.length < palavrasChave.length;

  const { dataInicial, dataFinal } = getPNCPDateRange();

  try {
    const buscas = termos.map(async (termo) => {
      const [contratos, atas] = await Promise.all([
        buscarContratos(termo, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
        buscarAtas(termo, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
      ]);
      return [...(contratos.results || []), ...(atas.results || [])];
    });

    if (temEspecificos) {
      const queryExtra = termosEspecificos.join(' ');
      buscas.push(
        Promise.all([
          buscarContratos(queryExtra, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
          buscarAtas(queryExtra, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
        ]).then(([c, a]) => [...(c.results || []), ...(a.results || [])])
      );
    }

    const allResults = await Promise.all(buscas);

    const merged = allResults.flat().filter((item, index, self) => {
      const key = item.tipo === 'CONTRATO'
        ? `c-${item.numeroContrato}-${item.anoContrato}`
        : `a-${item.numeroAtaRegistroPreco}-${item.anoAta}`;
      return index === self.findIndex(i => {
        const k = i.tipo === 'CONTRATO'
          ? `c-${i.numeroContrato}-${i.anoContrato}`
          : `a-${i.numeroAtaRegistroPreco}-${i.anoAta}`;
        return k === key;
      });
    });

    const resultados = scoringRelevancia(merged, termosEfetivos);

    return NextResponse.json({
      results: resultados,
      totalRegistros: resultados.length,
      totalPaginas: 1,
    });
  } catch (error) {
    console.error('Error in buscar route:', error);
    return NextResponse.json({ error: 'Erro ao consultar API do PNCP' }, { status: 500 });
  }
}
