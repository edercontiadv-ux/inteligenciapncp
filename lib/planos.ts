export type Plano = {
  name: string;
  price: string;
  period: string;
  features: string[];
  slug: string;
  highlighted?: boolean;
};

export const PLANOS: Plano[] = [
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
