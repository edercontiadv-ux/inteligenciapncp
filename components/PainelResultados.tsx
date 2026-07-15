'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import CardEstatisticas from './CardEstatisticas';
import ResultadosEmLista from './ResultadosEmLista';
import RelatorioWizard from './RelatorioWizard';
import ErrorBoundary from './ErrorBoundary';
import { FileDown } from 'lucide-react';

interface PainelResultadosProps {
  results: PNCPResult[];
  termoBusca: string;
}

export default function PainelResultados({ results, termoBusca }: PainelResultadosProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(false);

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
            <button
              onClick={() => setShowWizard(true)}
              disabled={selectedResults.length < 3}
              className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedResults.length < 3 ? 'Selecione pelo menos 3 itens' : ''}
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              Gerar Relatório ({selectedIds.length})
            </button>
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

      {showWizard && (
        <ErrorBoundary>
          <RelatorioWizard
            selectedResults={selectedResults}
            termoBusca={termoBusca}
            onClose={() => setShowWizard(false)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
