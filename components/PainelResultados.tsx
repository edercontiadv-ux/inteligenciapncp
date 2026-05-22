'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import CardContrato from './CardContrato';
import CardAta from './CardAta';
import { SlidersHorizontal, X } from 'lucide-react';
import RelatorioExport from './RelatorioExport';

interface PainelResultadosProps {
  results: PNCPResult[];
  termoBusca: string;
}

export default function PainelResultados({ results, termoBusca }: PainelResultadosProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredResults = useMemo(() => {
    const min = filterValorMin ? parseFloat(filterValorMin) : 0;
    const max = filterValorMax ? parseFloat(filterValorMax) : Infinity;

    return results.filter(item => {
      const matchUF = filterUF ? item.unidadeOrgao?.ufSigla === filterUF : true;
      const matchTipo = filterTipo ? item.tipo === filterTipo : true;
      const valor = item.valorInicial || 0;
      const matchValor = valor >= min && valor <= max;
      return matchUF && matchTipo && matchValor;
    });
  }, [results, filterUF, filterTipo, filterValorMin, filterValorMax]);

  const selectedResults = useMemo(() => {
    return results.filter((item, index) => selectedIds.includes(gerarId(item, index)));
  }, [results, selectedIds]);

  const ufs = useMemo(() => 
    Array.from(new Set(results.map(r => r.unidadeOrgao?.ufSigla).filter(Boolean))).sort(),
    [results]
  );

  const hasActiveFilters = filterUF || filterTipo || filterValorMin || filterValorMax;

  const limparFiltros = () => {
    setFilterUF('');
    setFilterTipo('');
    setFilterValorMin('');
    setFilterValorMax('');
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-brand-navy/60">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-body text-sm font-medium">Filtros</span>
          </div>

          <div className="h-4 w-px bg-brand-sand/40 hidden sm:block" />

          <select
            value={filterUF}
            onChange={(e) => setFilterUF(e.target.value)}
            className="select-field text-xs"
          >
            <option value="">Todas as UFs</option>
            {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="select-field text-xs"
          >
            <option value="">Todos os tipos</option>
            <option value="CONTRATO">Contrato</option>
            <option value="ATA">Ata de Registro de Preços</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Valor mín"
              value={filterValorMin}
              onChange={(e) => setFilterValorMin(e.target.value)}
              className="select-field w-24 text-xs"
              min="0"
            />
            <span className="text-brand-navy/30 text-xs">—</span>
            <input
              type="number"
              placeholder="Valor máx"
              value={filterValorMax}
              onChange={(e) => setFilterValorMax(e.target.value)}
              className="select-field w-24 text-xs"
              min="0"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={limparFiltros}
              className="inline-flex items-center gap-1 text-xs text-brand-navy/50 hover:text-brand-navy transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}

          <div className="ml-auto">
            <RelatorioExport
              selectedResults={selectedResults}
              termoBusca={termoBusca}
            />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResults.map((item, index) => {
          const id = gerarId(item, index);
          const staggerClass = `stagger-${Math.min(index + 1, 8)}`;

          return item.tipo === 'CONTRATO' ? (
            <div key={id} className={`animate-fade-up opacity-0 ${staggerClass}`}>
              <CardContrato
                data={item}
                index={index}
                onSelect={handleSelect}
                isSelected={selectedIds.includes(id)}
              />
            </div>
          ) : (
            <div key={id} className={`animate-fade-up opacity-0 ${staggerClass}`}>
              <CardAta
                data={item}
                index={index}
                onSelect={handleSelect}
                isSelected={selectedIds.includes(id)}
              />
            </div>
          );
        })}
      </div>

      {filteredResults.length === 0 && results.length > 0 && (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-brand-sand/20 flex items-center justify-center mx-auto mb-4">
            <SlidersHorizontal className="w-5 h-5 text-brand-navy/30" />
          </div>
          <p className="font-body text-sm text-brand-navy/50">
            Nenhum resultado encontrado para os filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
}
