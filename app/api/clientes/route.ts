import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticate, unauthorized } from '@/lib/auth';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().min(1, 'Documento é obrigatório'),
  email: z.string().email('E-mail inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const clientUpdateSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  name: z.string().min(1).optional(),
  document: z.string().min(1).optional(),
  email: z.string().email('E-mail inválido').nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

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
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const client = await prisma.client.create({
      data: {
        name: data.name,
        document: data.document,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
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
    const parsed = clientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const client = await prisma.client.updateMany({
      where: { id: data.id, userId: payload.sub },
      data: {
        name: data.name,
        document: data.document,
        email: data.email || null,
        phone: data.phone || null,
        notes: data.notes || null,
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
