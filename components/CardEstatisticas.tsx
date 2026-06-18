'use client';

import { useMemo } from 'react';
import { calcularEstatisticas, type Estatisticas } from '@/lib/estatisticas';
import { PNCPResult } from '@/lib/pncp-api';
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3 } from 'lucide-react';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface CardEstatisticasProps {
  results: PNCPResult[];
}

export default function CardEstatisticas({ results }: CardEstatisticasProps) {
  const stats: Estatisticas = useMemo(() => calcularEstatisticas(results), [results]);

  if (stats.totalItens === 0) return null;

  return (
    <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-brand-navy/50" />
        <h3 className="font-heading text-sm font-medium text-brand-navy/70">Estatísticas</h3>
        <span className="font-body text-xs text-brand-navy/40 ml-auto">
          {stats.itensComValor} de {stats.totalItens} itens com valor
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-brand-navy/40">
            <TrendingUp className="w-3 h-3" />
            <span className="font-body text-xs">Média</span>
          </div>
          <p className="font-heading text-lg text-brand-navy">{formatBRL(stats.media)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-brand-navy/40">
            <BarChart3 className="w-3 h-3" />
            <span className="font-body text-xs">Mediana</span>
          </div>
          <p className="font-heading text-lg text-brand-navy">{formatBRL(stats.mediana)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-brand-navy/40">
            <TrendingDown className="w-3 h-3" />
            <span className="font-body text-xs">Mínimo</span>
          </div>
          <p className="font-heading text-lg text-brand-navy">{formatBRL(stats.minimo)}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-brand-navy/40">
            <DollarSign className="w-3 h-3" />
            <span className="font-body text-xs">Máximo</span>
          </div>
          <p className="font-heading text-lg text-brand-navy">{formatBRL(stats.maximo)}</p>
        </div>
      </div>
    </div>
  );
}
