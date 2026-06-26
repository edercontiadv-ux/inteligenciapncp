import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { authenticate, unauthorized } from '@/lib/auth';
import { checkSearchLimit } from '@/lib/plan';
import { executarBusca } from '@/service/buscaService';

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

  const planLimit = await checkSearchLimit(payload.sub);
  if (!planLimit.allowed) {
    return NextResponse.json(
      { error: 'Limite diário de buscas atingido. Faça upgrade do seu plano para continuar.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Termo de busca (q) é obrigatório' }, { status: 400 });
  }

  const resultado = await executarBusca(q);

  await prisma.searchLog.create({
    data: {
      userId: payload.sub,
      query: q,
      results: resultado.results.length,
    },
  });

  if (resultado.statusCode) {
    return NextResponse.json({ error: resultado.erro }, { status: resultado.statusCode });
  }

  return NextResponse.json({
    results: resultado.results,
    totalRegistros: resultado.totalRegistros,
    totalPaginas: 1,
    sugestoes: resultado.sugestoes,
    planRemaining: planLimit.remaining - 1,
  });
}
