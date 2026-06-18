import { NextResponse } from 'next/server';

const PNCP_BASE_URL = process.env.PNCP_API_BASE_URL || 'https://pncp.gov.br/api/consulta/v1';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${PNCP_BASE_URL}/`, {
      method: 'HEAD',
      signal: controller.signal,
    });

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
