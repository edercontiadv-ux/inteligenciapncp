'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import PricingCard from '@/components/PricingCard';
import { Scale } from 'lucide-react';

const PLANOS = [
  {
    name: 'Teste Grátis',
    price: 'R$ 0',
    period: '/7 dias',
    features: ['7 dias de teste gratuito', '1 usuário', 'Até 10 clientes', '20 buscas por dia', 'Tarefas básicas'],
    slug: 'free-trial',
  },
  {
    name: 'Profissional',
    price: 'R$ 19,90',
    period: '/mês',
    features: ['2 usuários', 'Clientes ilimitados', '100 buscas por dia', 'Tarefas ilimitadas', 'Suporte prioritário'],
    slug: 'pro',
    highlighted: true,
  },
  {
    name: 'Escritório',
    price: 'R$ 39,90',
    period: '/mês',
    features: ['5 usuários', 'Clientes ilimitados', 'Buscas ilimitadas', 'Tarefas ilimitadas', 'Suporte VIP', 'Relatórios avançados'],
    slug: 'office',
  },
];

export default function PlanosPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const handleCta = (slug: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (slug === 'free-trial') {
      router.push('/account');
      return;
    }
    router.push(`/account?upgrade=${slug}`);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-brand-navy/50 font-body">Carregando...</div>;
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 rounded-full bg-brand-navy/5 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-6 h-6 text-brand-navy" />
        </div>
        <h2 className="font-heading text-3xl text-brand-navy mb-3">Planos e Preços</h2>
        <p className="font-body text-brand-navy/60">
          Escolha o plano ideal para o seu escritório. Cancele quando quiser.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
        {PLANOS.map((plano) => (
          <PricingCard
            key={plano.slug}
            name={plano.name}
            price={plano.price}
            period={plano.period}
            features={plano.features}
            highlighted={plano.highlighted}
            cta={user ? (plano.slug === 'free-trial' ? 'Meu Plano' : 'Assinar') : 'Começar grátis'}
            onCta={() => handleCta(plano.slug)}
          />
        ))}
      </div>

      {user && (
        <p className="text-center font-body text-sm text-brand-navy/50">
         Você está logado como <strong>{user.email}</strong>.{' '}
          <button onClick={() => router.push('/account')} className="text-brand-navy underline hover:no-underline">
            Ver detalhes do plano
          </button>
        </p>
      )}
    </div>
  );
}
