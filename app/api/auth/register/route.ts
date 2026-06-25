import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, message: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'E-mail já cadastrado' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({ success: true, token }, { status: 201 });
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
