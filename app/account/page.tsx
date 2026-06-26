'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Check, CreditCard, LogOut, Users } from 'lucide-react';

interface PlanInfo {
  slug: string;
  name: string;
  priceCents: number;
  maxUsers: number;
  maxClients: number;
  maxSearches: number;
  status: string;
  trialEndsAt: string | null;
}

export default function AccountPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) loadPlan();
  }, [user, authLoading]);

  const loadPlan = async () => {
    try {
      const res = await fetch('/api/plan');
      if (res.ok) setPlan(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || loading) {
    return <div className="text-center py-20 text-brand-navy/50 font-body">Carregando...</div>;
  }

  const diasRestantes = plan?.trialEndsAt
    ? Math.ceil((new Date(plan.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-navy/5 flex items-center justify-center">
          <Scale className="w-5 h-5 text-brand-navy" />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-brand-navy">Minha Conta</h2>
          <p className="font-body text-sm text-brand-navy/50">{user?.email}</p>
        </div>
      </div>

      {plan && (
        <div className="rounded-2xl border border-brand-sand/30 bg-white shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-body text-xs text-brand-navy/40 uppercase tracking-wider mb-1">Plano atual</p>
              <h3 className="font-heading text-xl text-brand-navy">{plan.name}</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${plan.status === 'trial' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {plan.status === 'trial' ? `${diasRestantes}d de teste` : 'Ativo'}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-brand-mist/30 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-brand-navy/40" />
              <p className="font-heading text-lg font-bold text-brand-navy">{plan.maxUsers === -1 ? '∞' : plan.maxUsers}</p>
              <p className="font-body text-xs text-brand-navy/50">Usuários</p>
            </div>
            <div className="bg-brand-mist/30 rounded-xl p-4 text-center">
              <Check className="w-5 h-5 mx-auto mb-1 text-brand-forest" />
              <p className="font-heading text-lg font-bold text-brand-navy">{plan.maxClients === -1 ? '∞' : plan.maxClients}</p>
              <p className="font-body text-xs text-brand-navy/50">Clientes</p>
            </div>
            <div className="bg-brand-mist/30 rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-brand-navy/40" />
              <p className="font-heading text-lg font-bold text-brand-navy">R$ {(plan.priceCents / 100).toFixed(2)}</p>
              <p className="font-body text-xs text-brand-navy/50">{plan.priceCents === 0 ? 'Grátis' : '/mês'}</p>
            </div>
            <div className="bg-brand-mist/30 rounded-xl p-4 text-center">
              <Check className="w-5 h-5 mx-auto mb-1 text-brand-navy/40" />
              <p className="font-heading text-lg font-bold text-brand-navy">{plan.maxSearches === -1 ? '∞' : plan.maxSearches}</p>
              <p className="font-body text-xs text-brand-navy/50">Buscas/dia</p>
            </div>
          </div>

          {plan.slug === 'free-trial' && (
            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-4 text-center">
              <p className="font-body text-sm text-brand-navy mb-3">
                {diasRestantes > 0
                  ? `Seu teste gratuito termina em ${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}.`
                  : 'Seu teste gratuito expirou.'}
              </p>
              <button onClick={() => router.push('/planos')} className="btn-primary text-sm">
                Fazer upgrade
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-red-100 bg-white p-6">
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-body">
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
