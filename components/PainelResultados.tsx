'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import CardEstatisticas from './CardEstatisticas';
import ResultadosEmLista from './ResultadosEmLista';
import RelatorioExport from './RelatorioExport';
import { FileDown } from 'lucide-react';

interface PainelResultadosProps {
  results: PNCPResult[];
  termoBusca: string;
}

export default function PainelResultados({ results, termoBusca }: PainelResultadosProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const selectedResults = useMemo(() => {
    return results.filter((item, index) => selectedIds.includes(gerarId(item, index)));
  }, [results, selectedIds]);

  return (
    <div className="space-y-6">
      <CardEstatisticas results={results} />

      <div className="flex items-center justify-between">
        <div className="text-xs text-brand-navy/50">
          {results.length} registro{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-navy/60">
              {selectedIds.length} de {results.length} selecionado{selectedIds.length !== 1 ? 's' : ''}
            </span>
            <RelatorioExport
              selectedResults={selectedResults}
              termoBusca={termoBusca}
            />
          </div>
        )}
      </div>

      <ResultadosEmLista
        results={results}
        termoBusca={termoBusca}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
