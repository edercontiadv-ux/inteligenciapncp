'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, Eye, EyeOff } from 'lucide-react';

function PasswordInput({ value, onChange, placeholder, required }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
      <input
        type={show ? 'text' : 'password'}
        className="input-field pl-10 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/30 hover:text-brand-navy/60 transition-colors"
        tabIndex={-1}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/busca');
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-brand-navy/5 flex items-center justify-center mx-auto mb-4">
            <Scale className="w-7 h-7 text-brand-navy" />
          </div>
          <h2 className="font-heading text-2xl text-brand-navy mb-1">Entrar</h2>
          <p className="font-body text-sm text-brand-navy/50">Acesse sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">Senha</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Sua senha"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && <p className="text-red-500 text-sm font-body">{error}</p>}
        </form>
      </div>
    </div>
  );
}
