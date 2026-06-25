import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true, message: 'Sessão encerrada. Descarte o token no cliente.' });
}
