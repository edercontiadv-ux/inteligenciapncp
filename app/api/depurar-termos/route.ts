import { NextRequest, NextResponse } from 'next/server';
import { getLLMProvider } from '@/lib/llm';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { status: 429 }
    );
  }

  try {
    const { descricao } = await req.json();
    if (!descricao || typeof descricao !== 'string' || !descricao.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 });
    }

    const provider = getLLMProvider();
    const termos = await provider.depurarTermos(descricao.trim().slice(0, 500));

    return NextResponse.json({
      termos,
      provider: provider.name,
    });
  } catch (error) {
    console.error('Error in depurar-termos route:', error);
    return NextResponse.json({ error: 'Erro ao processar termos' }, { status: 500 });
  }
}
