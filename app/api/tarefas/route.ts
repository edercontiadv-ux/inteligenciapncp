import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticate, unauthorized } from '@/lib/auth';

const taskSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  processNumber: z.string().min(1, 'Número do processo é obrigatório'),
  type: z.string().default('Prazo'),
  priority: z.enum(['alta', 'media', 'baixa']).default('media'),
  deadline: z.string().nullable().optional(),
  responsible: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  status: z.enum(['pendente', 'concluida', 'cancelada']).optional(),
});

export async function GET(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  const tarefas = await prisma.task.findMany({
    where: { userId: payload.sub },
    include: { client: true },
    orderBy: { deadline: 'asc' },
  });

  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const data = parsed.data;
    const tarefa = await prisma.task.create({
      data: {
        description: data.description,
        processNumber: data.processNumber,
        type: data.type,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        responsible: data.responsible || null,
        clientId: data.clientId || null,
        userId: payload.sub,
      },
      include: { client: true },
    });
    return NextResponse.json(tarefa, { status: 201 });
  } catch (err) {
    console.error('Erro ao criar tarefa:', err);
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 });
  }
}

const taskUpdateSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
  description: z.string().min(1).optional(),
  processNumber: z.string().min(1).optional(),
  type: z.string().optional(),
  priority: z.enum(['alta', 'media', 'baixa']).optional(),
  deadline: z.string().nullable().optional(),
  responsible: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  status: z.enum(['pendente', 'concluida', 'cancelada']).optional(),
});

export async function PUT(req: NextRequest) {
  const payload = await authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const data = parsed.data;
    await prisma.task.updateMany({
      where: { id: data.id, userId: payload.sub },
      data: {
        description: data.description,
        processNumber: data.processNumber,
        type: data.type,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        responsible: data.responsible || null,
        clientId: data.clientId || null,
        status: data.status,
      },
    });
    const tarefa = await prisma.task.findUnique({
      where: { id: data.id },
      include: { client: true },
    });
    return NextResponse.json(tarefa);
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
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
    await prisma.task.deleteMany({
      where: { id, userId: payload.sub },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Erro ao excluir tarefa:', err);
    return NextResponse.json({ error: 'Erro ao excluir tarefa' }, { status: 500 });
  }
}
