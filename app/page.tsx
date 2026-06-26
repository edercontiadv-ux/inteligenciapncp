'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Search, BarChart3, Shield, TrendingDown, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

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

      <section className="py-20 border-t border-brand-sand/20">
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

      <section className="py-20 border-t border-brand-sand/20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h3 className="font-heading text-2xl text-brand-navy mb-2">
              Comece gratuitamente
            </h3>
            <p className="font-body text-sm text-brand-navy/50 max-w-md">
              7 dias de teste grátis, sem compromisso. Depois, escolha o plano que melhor
              atende sua demanda.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary text-base px-8 py-3 shrink-0"
          >
            Criar Conta Grátis
          </button>
        </div>
      </section>
    </div>
  );
}
