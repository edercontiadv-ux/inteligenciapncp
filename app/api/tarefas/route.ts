import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = authenticate(req);
  if (!payload) return unauthorized();

  const tarefas = await prisma.task.findMany({
    where: { userId: payload.sub },
    include: { client: true },
    orderBy: { deadline: 'asc' },
  });

  return NextResponse.json(tarefas);
}

export async function POST(req: NextRequest) {
  const payload = authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const tarefa = await prisma.task.create({
      data: {
        description: body.description,
        processNumber: body.processNumber,
        type: body.type || 'Prazo',
        priority: body.priority || 'media',
        deadline: body.deadline ? new Date(body.deadline) : null,
        responsible: body.responsible || null,
        clientId: body.clientId || null,
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

export async function PUT(req: NextRequest) {
  const payload = authenticate(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    await prisma.task.updateMany({
      where: { id: body.id, userId: payload.sub },
      data: {
        description: body.description,
        processNumber: body.processNumber,
        type: body.type,
        priority: body.priority,
        deadline: body.deadline ? new Date(body.deadline) : null,
        responsible: body.responsible || null,
        clientId: body.clientId || null,
        status: body.status,
      },
    });
    const tarefa = await prisma.task.findUnique({
      where: { id: body.id },
      include: { client: true },
    });
    return NextResponse.json(tarefa);
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    return NextResponse.json({ error: 'Erro ao atualizar tarefa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const payload = authenticate(req);
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
