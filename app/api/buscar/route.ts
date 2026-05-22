import { NextRequest, NextResponse } from 'next/server';
import { buscarContratos, buscarAtas, sanitizarInput } from '@/lib/pncp-api';
import { getPNCPDateRange } from '@/lib/date-utils';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = checkRateLimit(ip);
  
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

    return NextResponse.json({
      results: merged,
      totalRegistros: merged.length,
      totalPaginas: 1,
    });
  } catch (error) {
    console.error('Error in buscar route:', error);
    return NextResponse.json({ error: 'Erro ao consultar API do PNCP' }, { status: 500 });
  }
}
