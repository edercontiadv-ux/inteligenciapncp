import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      'https://pncp.gov.br/api/search/?q=contrato&tipos_documento=contrato&pagina=1&tamanhoPagina=1',
      { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36' } }
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
