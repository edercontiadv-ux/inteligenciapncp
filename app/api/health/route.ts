import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Usa a API de busca textual com um termo simples — endpoint que sabemos que funciona
    const res = await fetch(
      'https://pncp.gov.br/api/search/?q=contrato&tipos_documento=contrato&pagina=1&tamanhoPagina=1',
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    return NextResponse.json({
      status: res.ok ? 'online' : 'offline',
      pncpStatus: res.status,
    });
  } catch {
    return NextResponse.json({
      status: 'offline',
      pncpStatus: 0,
    });
  }
}
