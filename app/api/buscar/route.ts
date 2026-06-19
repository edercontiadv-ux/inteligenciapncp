import { NextRequest, NextResponse } from 'next/server';
import { buscarContratos, buscarAtas, sanitizarInput, PNCPResult } from '@/lib/pncp-api';
import { getPNCPDateRange } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';

const STOPWORDS = new Set([
  'para', 'com', 'sem', 'dos', 'das', 'uma', 'estao', 'serao', 'deve',
  'pra', 'pelo', 'pela', 'sobre', 'entre', 'este', 'esse', 'aquele',
  'como', 'qual', 'quais', 'onde', 'mais', 'mas', 'que', 'sao',
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

function calcularThreshold(numPalavras: number): number {
  if (numPalavras <= 2) return 1;
  if (numPalavras <= 4) return 2;
  return Math.ceil(numPalavras * 0.4);
}

function scoringRelevancia(resultados: PNCPResult[], palavrasChave: string[]): PNCPResult[] {
  if (palavrasChave.length === 0) return resultados;

  const comScore = resultados.map(item => {
    const texto = getTextoObjeto(item);
    const matches = palavrasChave.filter(p => palavraCorresponde(texto, p)).length;
    return { item, score: matches };
  });

  const threshold = calcularThreshold(palavrasChave.length);
  const filtrados = comScore.filter(r => r.score >= threshold).map(r => r.item);

  if (filtrados.length === 0 && comScore.length > 0) {
    const maxScore = Math.max(...comScore.map(r => r.score));
    if (maxScore > 0) {
      return comScore.filter(r => r.score === maxScore).map(r => r.item);
    }
  }

  return filtrados.length > 0 ? filtrados : resultados;
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

  const { dataInicial, dataFinal } = getPNCPDateRange();

  try {
    const allResults = await Promise.all(
      termos.map(async (termo) => {
        const [contratos, atas] = await Promise.all([
          buscarContratos(termo, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
          buscarAtas(termo, dataInicial, dataFinal).catch(e => { console.error(e); return { results: [] }; }),
        ]);
        return [...(contratos.results || []), ...(atas.results || [])];
      })
    );

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

    const resultados = scoringRelevancia(merged, palavrasChave);

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
