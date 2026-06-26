'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Phone, Lock, User, ArrowLeft, RefreshCw } from 'lucide-react';

type Etapa = 'login' | 'register' | 'verify';

export default function LoginPage() {
  const { login, register, verifyEmail, resendCode } = useAuth();
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const resendTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await register(name, email, phone, password);
      setEmail(result.email);
      setCodeSent(true);
      setEtapa('verify');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/tarefas');
    } catch (err: any) {
      if (err.message?.includes('Confirme seu e-mail')) {
        setEtapa('verify');
      } else {
        setError(err.message || 'Erro ao autenticar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      router.push('/account');
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendCode(email);
      setCodeSent(true);
    } catch (err: any) {
      setError(err.message);
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
            {etapa === 'verify' ? 'Confirme seu e-mail' : etapa === 'register' ? 'Criar Conta' : 'Entrar'}
          </h2>
          <p className="font-body text-sm text-brand-navy/50">
            {etapa === 'verify'
              ? `Enviamos um código para ${email}`
              : etapa === 'register'
              ? 'Preencha seus dados para começar'
              : 'Acesse sua conta'}
          </p>
        </div>

        {etapa === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-4 text-center">
              <p className="font-body text-sm text-brand-navy/70 mb-1">Digite o código de 6 dígitos</p>
              <p className="font-body text-xs text-brand-navy/40">Enviado para {email}</p>
            </div>

            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field text-center text-2xl tracking-[8px] font-mono"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full justify-center">
              {loading ? 'Verificando...' : 'Confirmar e-mail'}
            </button>

            <button
              type="button"
              onClick={handleResend}
              className="w-full flex items-center justify-center gap-2 text-sm text-brand-navy/50 hover:text-brand-navy font-body"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reenviar código
            </button>

            <button
              type="button"
              onClick={() => { setEtapa('login'); setError(''); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-brand-navy/50 hover:text-brand-navy font-body"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao login
            </button>

            {error && <p className="text-red-500 text-sm font-body text-center">{error}</p>}
          </form>
        ) : etapa === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="text" className="input-field pl-10" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="email" className="input-field pl-10" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="tel" className="input-field pl-10" placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="password" className="input-field pl-10" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </button>

            <p className="text-center font-body text-sm text-brand-navy/50">
              Já tem conta?{' '}
              <button type="button" onClick={() => { setEtapa('login'); setError(''); }} className="text-brand-navy font-medium hover:underline">
                Entrar
              </button>
            </p>

            {error && <p className="text-red-500 text-sm font-body">{error}</p>}
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="email" className="input-field pl-10" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-brand-navy/70 mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                <input type="password" className="input-field pl-10" placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="text-center font-body text-sm text-brand-navy/50">
              Não tem conta?{' '}
              <button type="button" onClick={() => { setEtapa('register'); setError(''); }} className="text-brand-navy font-medium hover:underline">
                Cadastre-se grátis
              </button>
            </p>

            {error && <p className="text-red-500 text-sm font-body">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
