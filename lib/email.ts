export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Inteligência PNCP <noreply@inteligenciapncp.com.br>',
      to: email,
      subject: 'Confirme seu e-mail — Inteligência PNCP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1A1F36;margin-bottom:16px">Confirme seu e-mail</h2>
          <p style="color:#4A5568;font-size:14px;line-height:1.6">
            Seu código de verificação é:
          </p>
          <div style="background:#F7F8FA;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
            <span style="font-size:32px;letter-spacing:8px;font-weight:700;color:#1A1F36">${code}</span>
          </div>
          <p style="color:#4A5568;font-size:14px;line-height:1.6">
            Este código expira em 30 minutos. Se você não solicitou este cadastro, ignore este e-mail.
          </p>
        </div>
      `,
    });
  } else {
    console.log(`[EMAIL dev] Código de verificação para ${email}: ${code}`);
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
