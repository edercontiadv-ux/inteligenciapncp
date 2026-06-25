import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  const clients = await prisma.client.findMany({
    where: { userId: payload.sub },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        document: body.document,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
        userId: payload.sub,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error('Erro ao criar cliente:', err);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const client = await prisma.client.updateMany({
      where: { id: body.id, userId: payload.sub },
      data: {
        name: body.name,
        document: body.document,
        email: body.email || null,
        phone: body.phone || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(client);
  } catch (err) {
    console.error('Erro ao atualizar cliente:', err);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  try {
    await prisma.client.deleteMany({
      where: { id, userId: payload.sub },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir cliente:', err);
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
