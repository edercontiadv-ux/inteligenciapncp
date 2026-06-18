'use client';

import { useState, useRef } from 'react';
import FormBusca from '@/components/FormBusca';
import PainelResultados from '@/components/PainelResultados';
import SkeletonCard from '@/components/SkeletonCard';
import { PNCPResult } from '@/lib/pncp-api';
import { SearchX, Scale, TrendingDown } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<PNCPResult[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jaPesquisou, setJaPesquisou] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = async (termos: string[]) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setJaPesquisou(true);
    setTermoBusca(termos.join(', '));

    try {
      const q = termos.join(',');
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Falha ao consultar API do PNCP');
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError('Não foi possível realizar a busca. Verifique sua conexão ou tente novamente mais tarde.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero section */}
      <section className="relative">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-navy/5 flex items-center justify-center">
              <Scale className="w-5 h-5 text-brand-navy" />
            </div>
            <span className="font-body text-xs text-brand-navy/40 uppercase tracking-widest">
              Art. 23 — Lei nº 14.133/2021
            </span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl text-brand-navy leading-tight mb-3">
            Componha seu
            <br />
            <span className="text-brand-gold">preço médio</span>
          </h2>
          <p className="font-body text-brand-navy/60 text-base leading-relaxed">
            Pesquise contratos e atas de registro de preços diretamente no banco de dados do
            Portal Nacional de Contratações Públicas.
          </p>
        </div>
      </section>

      <FormBusca onSearch={handleSearch} isLoading={isLoading} />

      {error && (
        <div className="animate-fade-up rounded-xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <SearchX className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="font-body text-sm font-medium text-red-800">Erro na consulta</p>
              <p className="font-body text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <p className="font-body text-sm text-brand-navy/60">Consultando PNCP (últimos 12 meses)...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : jaPesquisou && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-brand-sand/30 flex items-center justify-center mb-5">
            <SearchX className="w-8 h-8 text-brand-navy/30" />
          </div>
          <p className="font-heading text-xl text-brand-navy mb-1">Nenhum resultado encontrado</p>
          <p className="font-body text-sm text-brand-navy/50 max-w-md text-center">
            Tente descrever o objeto de forma diferente ou use termos mais genéricos.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6 animate-fade-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
            <div>
              <h3 className="font-heading text-xl text-brand-navy">
                Resultados encontrados
              </h3>
              <p className="font-body text-sm text-brand-navy/50 mt-1">
                Termo: <span className="text-brand-navy/70 font-medium">&quot;{termoBusca}&quot;</span>
              </p>
            </div>
            <div className="flex items-center gap-2 font-body text-sm text-brand-navy/50">
              <TrendingDown className="w-4 h-4" />
              <span>{results.length} registro{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <PainelResultados results={results} termoBusca={termoBusca} />
        </div>
      ) : null}
    </div>
  );
}
