'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      router.push('/tarefas');
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
          <h2 className="font-heading text-2xl text-brand-navy mb-1">
            {isRegister ? 'Criar Conta' : 'Entrar'}
          </h2>
          <p className="font-body text-sm text-brand-navy/50">
            {isRegister ? 'Crie sua conta para gerenciar tarefas' : 'Acesse sua conta para gerenciar tarefas'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">
                Nome
              </label>
              <input
                id="name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-body">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-6 font-body text-sm text-brand-navy/50">
          {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-brand-navy font-medium hover:underline"
          >
            {isRegister ? 'Entrar' : 'Cadastre-se'}
          </button>
        </p>
      </div>
    </div>
  );
}
