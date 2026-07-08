'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import { formatarMoeda, formatarData, truncate } from '@/lib/formatadores';
import {
  ExternalLink, ChevronUp, ChevronDown, Search, X,
} from 'lucide-react';

interface ResultadosEmListaProps {
  results: PNCPResult[];
  termoBusca: string;
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

type SortField = 'tipo' | 'numero' | 'orgao' | 'uf' | 'objeto' | 'valorTotal' | 'dataInicio';
type SortDir = 'asc' | 'desc';

const ITENS_POR_PAGINA = 20;

const COLUNAS: { key: SortField | 'checkbox' | 'pdf'; label: string; width: string; sortable?: boolean; numeric?: boolean; align?: string }[] = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'tipo', label: 'Tipo', width: '80px', sortable: true },
  { key: 'numero', label: 'Número', width: '100px', sortable: true },
  { key: 'orgao', label: 'Órgão Contratante', width: 'auto', sortable: true },
  { key: 'uf', label: 'UF', width: '60px', sortable: true },
  { key: 'objeto', label: 'Objeto', width: 'auto' },
  { key: 'valorTotal', label: 'Valor Total', width: '140px', sortable: true, numeric: true },
  { key: 'dataInicio', label: 'Data Início', width: '110px', sortable: true },
  { key: 'pdf', label: '', width: '50px', align: 'center' },
];

function parseSortableNumber(item: PNCPResult): number {
  return item.valorInicial || 0;
}

function parseSortableString(item: PNCPResult, field: SortField): string {
  switch (field) {
    case 'tipo': return item.tipo;
    case 'numero': return item.tipo === 'CONTRATO'
      ? `${item.numeroContrato || ''}/${item.anoContrato || ''}`
      : `${item.numeroAtaRegistroPreco || ''}/${item.anoAta || ''}`;
    case 'orgao': return item.orgaoEntidade?.razaoSocial || '';
    case 'uf': return item.unidadeOrgao?.ufSigla || '';
    case 'objeto': return item.objetoContrato || item.objetoAta || '';
    case 'dataInicio': return item.dataVigenciaInicio || '';
    default: return '';
  }
}

export default function ResultadosEmLista({
  results, termoBusca, selectedIds, onSelect, onSelectAll,
}: ResultadosEmListaProps) {
  const [sortField, setSortField] = useState<SortField>('valorTotal');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [filterUF, setFilterUF] = useState<string[]>([]);
  const [filterTipo, setFilterTipo] = useState<'CONTRATO' | 'ATA' | ''>('');
  const [filterValorMin, setFilterValorMin] = useState('');
  const [filterValorMax, setFilterValorMax] = useState('');
  const [filterOrgao, setFilterOrgao] = useState('');
  const [showUFDropdown, setShowUFDropdown] = useState(false);

  const allSelected = useMemo(() => {
    return results.length > 0 && selectedIds.length === results.length;
  }, [results, selectedIds]);

  const ufs = useMemo(() =>
    Array.from(new Set(results.map(r => r.unidadeOrgao?.ufSigla).filter((v): v is string => !!v))).sort(),
    [results]
  );

  const ufCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      const uf = r.unidadeOrgao?.ufSigla || 'N/I';
      counts[uf] = (counts[uf] || 0) + 1;
    }
    return counts;
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(item => {
      if (filterUF.length > 0 && !filterUF.includes(item.unidadeOrgao?.ufSigla || 'N/I')) return false;
      if (filterTipo && item.tipo !== filterTipo) return false;
      const valor = item.valorInicial || 0;
      const min = filterValorMin ? parseFloat(filterValorMin) : 0;
      const max = filterValorMax ? parseFloat(filterValorMax) : Infinity;
      if (valor < min || valor > max) return false;
      if (filterOrgao) {
        const nome = (item.orgaoEntidade?.razaoSocial || '').toLowerCase();
        if (!nome.includes(filterOrgao.toLowerCase())) return false;
      }
      return true;
    });
  }, [results, filterUF, filterTipo, filterValorMin, filterValorMax, filterOrgao]);

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'valorTotal') {
        cmp = parseSortableNumber(a) - parseSortableNumber(b);
      } else {
        cmp = parseSortableString(a, sortField).localeCompare(parseSortableString(b, sortField));
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filteredResults, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / ITENS_POR_PAGINA));
  const paginatedResults = sortedResults.slice((page - 1) * ITENS_POR_PAGINA, page * ITENS_POR_PAGINA);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'valorTotal' ? 'desc' : 'asc');
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(results.map((_, i) => gerarId(results[i], i)));
    }
  };

  const toggleUF = (uf: string) => {
    setFilterUF(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    );
    setPage(1);
  };

  const hasActiveFilters = filterUF.length > 0 || filterTipo || filterValorMin || filterValorMax || filterOrgao;

  const limparFiltros = () => {
    setFilterUF([]);
    setFilterTipo('');
    setFilterValorMin('');
    setFilterValorMax('');
    setFilterOrgao('');
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline-block ml-1" />
      : <ChevronDown className="w-3 h-3 inline-block ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* UF Filter */}
          <div className="relative">
            <button
              onClick={() => setShowUFDropdown(!showUFDropdown)}
              className={`select-field text-xs flex items-center gap-1 ${filterUF.length > 0 ? 'border-brand-navy' : ''}`}
            >
              UF {filterUF.length > 0 && `(${filterUF.length})`}
            </button>
            {showUFDropdown && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-brand-sand/30 rounded-lg shadow-lg p-2 w-48 max-h-60 overflow-y-auto">
                {ufs.map(uf => (
                  <label
                    key={uf}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-brand-sand/10 rounded cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={filterUF.includes(uf)}
                      onChange={() => toggleUF(uf)}
                      className="rounded border-brand-sand/50"
                    />
                    <span className="flex-1">{uf}</span>
                    <span className="text-brand-navy/40">{ufCounts[uf] || 0}</span>
                  </label>
                ))}
                <div className="border-t border-brand-sand/20 mt-1 pt-1">
                  <button
                    onClick={() => { setFilterUF([]); setShowUFDropdown(false); }}
                    className="text-xs text-brand-navy/50 hover:text-brand-navy w-full text-center py-1"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tipo Filter */}
          <div className="flex items-center bg-brand-sand/10 rounded-lg p-0.5">
            <button
              onClick={() => { setFilterTipo(''); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${!filterTipo ? 'bg-white shadow-sm text-brand-navy font-medium' : 'text-brand-navy/50 hover:text-brand-navy'}`}
            >
              Ambos
            </button>
            <button
              onClick={() => { setFilterTipo('CONTRATO'); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${filterTipo === 'CONTRATO' ? 'bg-white shadow-sm text-brand-navy font-medium' : 'text-brand-navy/50 hover:text-brand-navy'}`}
            >
              Contrato
            </button>
            <button
              onClick={() => { setFilterTipo('ATA'); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${filterTipo === 'ATA' ? 'bg-white shadow-sm text-brand-navy font-medium' : 'text-brand-navy/50 hover:text-brand-navy'}`}
            >
              Ata
            </button>
          </div>

          {/* Value range */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Valor min"
              value={filterValorMin}
              onChange={(e) => { setFilterValorMin(e.target.value); setPage(1); }}
              className="select-field w-20 text-xs"
              min="0"
            />
            <span className="text-brand-navy/30 text-xs">-</span>
            <input
              type="number"
              placeholder="Valor max"
              value={filterValorMax}
              onChange={(e) => { setFilterValorMax(e.target.value); setPage(1); }}
              className="select-field w-20 text-xs"
              min="0"
            />
          </div>

          {/* Orgao search */}
          <div className="relative flex-1 min-w-[140px] max-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-navy/30" />
            <input
              type="text"
              placeholder="Buscar orgao..."
              value={filterOrgao}
              onChange={(e) => { setFilterOrgao(e.target.value); setPage(1); }}
              className="select-field text-xs pl-7 w-full"
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
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-brand-sand/30 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-sand/20 bg-brand-sand/10">
                {COLUNAS.map(col => {
                  if (col.key === 'checkbox') {
                    return (
                      <th key={col.key} style={{ width: col.width }} className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          className="rounded border-brand-sand/50"
                        />
                      </th>
                    );
                  }
                  if (col.key === 'pdf') {
                    return (
                      <th key={col.key} style={{ width: col.width, textAlign: col.align as any || 'left' }} className="px-3 py-3" />
                    );
                  }
                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width, textAlign: col.numeric ? 'right' : 'left' }}
                      className={`px-3 py-3 font-body text-xs font-semibold text-brand-navy/60 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-brand-navy select-none' : ''}`}
                      onClick={() => col.sortable && handleSort(col.key as SortField)}
                    >
                      {col.label}
                      {col.sortable && <SortIcon field={col.key as SortField} />}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedResults.map((item, index) => {
                const id = gerarId(item, index);
                const isSelected = selectedIds.includes(id);
                const numDisplay = item.tipo === 'CONTRATO'
                  ? `${item.numeroContrato || ''}/${item.anoContrato || ''}`
                  : `${item.numeroAtaRegistroPreco || ''}/${item.anoAta || ''}`;
                const orgaoNome = item.orgaoEntidade?.razaoSocial || item.unidadeOrgao?.nomeUnidade || '-';
                const uf = item.unidadeOrgao?.ufSigla || '-';
                const objeto = item.objetoContrato || item.objetoAta || '-';
                const valor = item.valorInicial;
                const data = item.dataVigenciaInicio ? formatarData(item.dataVigenciaInicio) : '-';

                return (
                  <tr
                    key={id}
                    className={`border-b border-brand-sand/10 transition-colors cursor-pointer ${isSelected ? 'bg-brand-gold/[0.04]' : index % 2 === 0 ? 'bg-white' : 'bg-brand-sand/[0.03]'} hover:bg-brand-sand/10`}
                    onClick={() => onSelect(id)}
                  >
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(id)}
                        className="rounded border-brand-sand/50"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.tipo === 'CONTRATO' ? 'bg-brand-navy/10 text-brand-navy' : 'bg-brand-forest/10 text-brand-forest'}`}>
                        {item.tipo === 'CONTRATO' ? 'CT' : 'ATA'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy/70 font-medium whitespace-nowrap">
                      {numDisplay}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy/70 max-w-[200px] truncate" title={orgaoNome}>
                      {orgaoNome}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy/50 text-center">
                      {uf}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy/70 max-w-[250px]" title={objeto}>
                      <span className="line-clamp-2">{truncate(objeto, 80)}</span>
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy font-medium text-right whitespace-nowrap">
                      {valor ? formatarMoeda(valor) : '-'}
                    </td>
                    <td className="px-3 py-2.5 font-body text-xs text-brand-navy/60 whitespace-nowrap">
                      {data}
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                      {item.linkArquivo ? (
                        <a
                          href={item.linkArquivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-brand-sand/20 text-brand-navy/40 hover:text-brand-navy transition-colors"
                          title="Abrir PDF"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-brand-navy/20">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginatedResults.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-sm text-brand-navy/50">
              Nenhum resultado encontrado para os filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-brand-navy/50">
        <span>
          {sortedResults.length} registro{sortedResults.length !== 1 ? 's' : ''}
          {selectedIds.length > 0 && (
            <span className="ml-2 text-brand-navy/70 font-medium">
              | {selectedIds.length} selecionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded hover:bg-brand-sand/20 disabled:opacity-30 transition-colors"
            >
              Anterior
            </button>
            <span className="text-brand-navy/60">
              {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded hover:bg-brand-sand/20 disabled:opacity-30 transition-colors"
            >
              Proximo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
