export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
  score: number;
}

export function validatePasswordStrength(
  password: string,
  context?: { email?: string; name?: string }
): PasswordStrengthResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mínimo de 8 caracteres');
  }

  if (password.length > 128) {
    errors.push('Máximo de 128 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Pelo menos 1 letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Pelo menos 1 letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Pelo menos 1 número');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Pelo menos 1 símbolo (!@#$%^&* etc.)');
  }

  if (context?.email) {
    const emailPrefix = context.email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailPrefix)) {
      errors.push('A senha não pode conter parte do seu e-mail');
    }
  }

  if (context?.name) {
    const nameParts = context.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2 && password.toLowerCase().includes(part)) {
        errors.push('A senha não pode conter parte do seu nome');
        break;
      }
    }
  }

  const score = Math.max(0, 4 - errors.length);
  return { valid: errors.length === 0, errors, score };
}
