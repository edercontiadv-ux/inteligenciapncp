'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';

interface FormBuscaProps {
  onSearch: (termos: string[]) => void;
  isLoading: boolean;
}

export default function FormBusca({ onSearch, isLoading }: FormBuscaProps) {
  const [descricao, setDescricao] = useState('');
  const [isDepurando, setIsDepurando] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || isDepurando) return;

    setIsDepurando(true);
    try {
      const res = await fetch('/api/depurar-termos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: descricao.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const termos = data.termos?.length > 0 ? data.termos : [descricao.trim()];
        onSearch(termos);
      } else {
        onSearch([descricao.trim()]);
      }
    } catch {
      onSearch([descricao.trim()]);
    } finally {
      setIsDepurando(false);
    }
  };

  return (
    <div className="relative">
      {/* Decorative background element */}
      <div className="absolute -top-4 -left-4 w-24 h-24 border border-brand-gold/10 rounded-full -z-10" />
      <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-brand-navy/5 rounded-full -z-10" />

      <div className="rounded-2xl border border-brand-sand/30 bg-white shadow-lg shadow-brand-navy/5 p-6 sm:p-8">
        <form onSubmit={handleSearch} className="space-y-5">
          <div>
            <label htmlFor="descricao" className="font-body text-sm font-medium text-brand-navy/70 mb-2 block">
              Descreva o objeto da contratação
            </label>
            <div className="relative">
              <input
                id="descricao"
                type="text"
                className="input-field pr-12"
                placeholder="Ex: veiculo hatch, cadeira giratória, serviço de limpeza..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-sand/40">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="font-body text-xs text-brand-navy/40 hidden sm:block">
              Ex: &quot;cadeira ergonômica com apoio lombar&quot;
            </p>
            <button
              type="submit"
              disabled={isLoading || isDepurando || !descricao.trim()}
              className="btn-primary shrink-0"
            >
              {isDepurando ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : isLoading ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isDepurando ? 'Analisando descrição...' : isLoading ? 'Buscando...' : 'Buscar no PNCP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
