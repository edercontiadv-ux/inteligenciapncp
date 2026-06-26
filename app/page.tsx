'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Scale, Search, BarChart3, Shield, ArrowRight, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' as const },
  }),
};

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-2xl mx-auto mb-14"
    >
      <h2 className="font-heading text-3xl text-brand-navy mb-3">{title}</h2>
      <p className="font-body text-brand-navy/60">{subtitle}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/busca');
    }
  }, [user, isLoading, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center">
            <span className="text-brand-gold font-heading text-2xl italic">P</span>
          </div>
          <div>
            <h1 className="font-heading text-xl text-brand-navy">Inteligência PNCP</h1>
            <span className="font-body text-xs text-brand-navy/50 tracking-widest uppercase">
              Pesquisa de Preços
            </span>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-heading text-4xl sm:text-5xl lg:text-6xl text-brand-navy leading-tight mb-6"
        >
          Componha seu
          <br />
          <span className="text-brand-gold">preço médio</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="font-body text-lg text-brand-navy/60 leading-relaxed max-w-2xl mb-10"
        >
          Pesquise contratos e atas de registro de preços diretamente no banco de dados do
          Portal Nacional de Contratações Públicas. Ferramenta auxiliar baseada no art. 23
          da Lei nº 14.133/2021.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center gap-4"
        >
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
        </motion.div>
      </section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="py-20 border-t border-brand-sand/20"
      >
        <SectionTitle
          title="Tudo que você precisa"
          subtitle="Da pesquisa à gestão de processos licitatórios, centralizado em um só lugar."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          {[
            { icon: Search, title: 'Busca Inteligente', desc: 'Pesquise por descrição do objeto, termo ou palavra-chave. O sistema busca nos últimos 12 meses de contratos e atas do PNCP.' },
            { icon: BarChart3, title: 'Análise de Preços', desc: 'Visualize estatísticas, distribuição de valores e composição de preço médio com scoring por relevância.' },
            { icon: Shield, title: 'Gestão de Órgãos', desc: 'Cadastre órgãos e tarefas, acompanhe prazos e gerencie seus processos licitatórios em um só lugar.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="space-y-4"
            >
              <motion.div
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(23,37,84,0.08)' }}
                className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center transition-colors"
              >
                <item.icon className="w-6 h-6 text-brand-navy" />
              </motion.div>
              <h3 className="font-heading text-xl text-brand-navy">{item.title}</h3>
              <p className="font-body text-sm text-brand-navy/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Planos */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="py-20 border-t border-brand-sand/20"
      >
        <SectionTitle
          title="Planos e Preços"
          subtitle="Escolha o plano ideal para seu escritório. Cancele quando quiser."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start"
        >
          {PLANOS.map((plano, i) => (
            <motion.div
              key={plano.slug}
              custom={i}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <PricingCard
                name={plano.name}
                price={plano.price}
                period={plano.period}
                features={plano.features}
                highlighted={plano.highlighted}
                cta="Começar grátis"
                onCta={() => router.push('/login')}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* CTA Final */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="py-20 border-t border-brand-sand/20"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h3 className="font-heading text-3xl text-brand-navy mb-4">
            Comece gratuitamente
          </h3>
          <p className="font-body text-brand-navy/60 max-w-lg mx-auto mb-8">
            7 dias de teste grátis, sem compromisso. Depois, escolha o plano que melhor
            atende sua demanda.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/login')}
            className="btn-primary text-base px-10 py-3"
          >
            Criar Conta Grátis
            <ChevronRight className="w-5 h-5 ml-1" />
          </motion.button>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}
