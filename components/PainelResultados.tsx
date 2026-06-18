'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import CardContrato from './CardContrato';
import CardAta from './CardAta';
import CardEstatisticas from './CardEstatisticas';
import { SlidersHorizontal, X, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import RelatorioExport from './RelatorioExport';

interface PainelResultadosProps {
  results: PNCPResult[];
  termoBusca: string;
}

type SortField = 'valor' | 'data' | 'uf';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

export default function PainelResultados({ results, termoBusca }: PainelResultadosProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterUF, setFilterUF] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

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

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'valor':
          cmp = (a.valorInicial || 0) - (b.valorInicial || 0);
          break;
        case 'data':
          cmp = (a.dataVigenciaInicio || '').localeCompare(b.dataVigenciaInicio || '');
          break;
        case 'uf':
          cmp = (a.unidadeOrgao?.ufSigla || '').localeCompare(b.unidadeOrgao?.ufSigla || '');
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredResults, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / ITEMS_PER_PAGE));
  const paginatedResults = sortedResults.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
    setPage(1);
  };

  const toggleSortDir = () => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');

  return (
    <div className="space-y-6">
      {/* Stats card */}
      <CardEstatisticas results={filteredResults} />

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
            onChange={(e) => { setFilterUF(e.target.value); setPage(1); }}
            className="select-field text-xs"
          >
            <option value="">Todas as UFs</option>
            {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>

          <select
            value={filterTipo}
            onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}
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

          {/* Sort controls */}
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="select-field text-xs"
            >
              <option value="valor">Valor</option>
              <option value="data">Data</option>
              <option value="uf">UF</option>
            </select>
            <button
              onClick={toggleSortDir}
              className="p-1.5 rounded-lg hover:bg-brand-sand/20 text-brand-navy/50 hover:text-brand-navy transition-colors"
              title={sortDir === 'asc' ? 'Crescente' : 'Decrescente'}
              aria-label={`Ordenar ${sortDir === 'asc' ? 'decrescente' : 'crescente'}`}
            >
              <ArrowUpDown className={`w-3.5 h-3.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
            </button>
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

      {/* Pagination info */}
      <div className="flex items-center justify-between text-xs text-brand-navy/50">
        <span>{sortedResults.length} registro{sortedResults.length !== 1 ? 's' : ''}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-brand-sand/20 disabled:opacity-30 transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-brand-sand/20 disabled:opacity-30 transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedResults.map((item, index) => {
          const id = gerarId(item, (page - 1) * ITEMS_PER_PAGE + index);
          const staggerClass = `stagger-${Math.min(index + 1, 8)}`;

          return item.tipo === 'CONTRATO' ? (
            <div key={id} className={`animate-fade-up opacity-0 ${staggerClass}`}>
              <CardContrato
                data={item}
                index={(page - 1) * ITEMS_PER_PAGE + index}
                onSelect={handleSelect}
                isSelected={selectedIds.includes(id)}
              />
            </div>
          ) : (
            <div key={id} className={`animate-fade-up opacity-0 ${staggerClass}`}>
              <CardAta
                data={item}
                index={(page - 1) * ITEMS_PER_PAGE + index}
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
            Nenhum resultado encontrado para os filtros aplicados. Tente ampliar os valores ou remover filtros.
          </p>
        </div>
      )}
    </div>
  );
}
