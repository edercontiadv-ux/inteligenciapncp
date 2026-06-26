'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Search, BarChart3, Shield, TrendingDown, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import PricingCard from '@/components/PricingCard';

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

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/busca');
    }
  }, [user, isLoading, router]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center">
              <span className="text-brand-gold font-heading text-2xl italic">P</span>
            </div>
            <div>
              <h1 className="font-heading text-xl text-brand-navy">Inteligência PNCP</h1>
              <span className="font-body text-xs text-brand-navy/50 tracking-widest uppercase">
                Pesquisa de Preços
              </span>
            </div>
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-brand-navy leading-tight mb-6">
            Componha seu
            <br />
            <span className="text-brand-gold">preço médio</span>
          </h2>
          <p className="font-body text-lg text-brand-navy/60 leading-relaxed max-w-2xl mb-10">
            Pesquise contratos e atas de registro de preços diretamente no banco de dados do
            Portal Nacional de Contratações Públicas. Ferramenta auxiliar baseada no art. 23
            da Lei nº 14.133/2021.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="btn-primary text-base px-8 py-3"
            >
              Entrar
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <button
              onClick={() => router.push('/planos')}
              className="btn-secondary text-base px-8 py-3"
            >
              Ver Planos
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-brand-sand/20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl text-brand-navy mb-3">
            Tudo que você precisa
          </h2>
          <p className="font-body text-brand-navy/60">
            Da pesquisa à gestão de processos licitatórios, centralizado em um só lugar.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center">
              <Search className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-heading text-xl text-brand-navy">Busca Inteligente</h3>
            <p className="font-body text-sm text-brand-navy/60 leading-relaxed">
              Pesquise por descrição do objeto, termo ou palavra-chave. O sistema busca nos
              últimos 12 meses de contratos e atas do PNCP.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-heading text-xl text-brand-navy">Análise de Preços</h3>
            <p className="font-body text-sm text-brand-navy/60 leading-relaxed">
              Visualize estatísticas, distribuição de valores e composição de preço médio
              com scoring por relevância.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center">
              <Shield className="w-6 h-6 text-brand-navy" />
            </div>
            <h3 className="font-heading text-xl text-brand-navy">Gestão de Órgãos</h3>
            <p className="font-body text-sm text-brand-navy/60 leading-relaxed">
              Cadastre órgãos e tarefas, acompanhe prazos e gerencie seus processos
              licitatórios em um só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 border-t border-brand-sand/20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl text-brand-navy mb-3">
            Planos e Preços
          </h2>
          <p className="font-body text-brand-navy/60">
            Escolha o plano ideal para seu escritório. Cancele quando quiser.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {PLANOS.map((plano) => (
            <PricingCard
              key={plano.slug}
              name={plano.name}
              price={plano.price}
              period={plano.period}
              features={plano.features}
              highlighted={plano.highlighted}
              cta="Começar grátis"
              onCta={() => router.push('/login')}
            />
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 border-t border-brand-sand/20">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-heading text-3xl text-brand-navy mb-4">
            Comece gratuitamente
          </h3>
          <p className="font-body text-brand-navy/60 max-w-lg mx-auto mb-8">
            7 dias de teste grátis, sem compromisso. Depois, escolha o plano que melhor
            atende sua demanda.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary text-base px-10 py-3"
          >
            Criar Conta Grátis
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </section>
    </div>
  );
}
