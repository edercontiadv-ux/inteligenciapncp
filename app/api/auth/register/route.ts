import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().regex(/^[\d\s\-()]{8,20}$/, 'Telefone inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'E-mail já cadastrado' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: { name, email, phone: phone || null, passwordHash },
    });

    const code = generateVerificationCode();
    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: 'Cadastro realizado! Verifique seu e-mail para confirmar.',
      email,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in register:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
