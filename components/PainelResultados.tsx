'use client';

import { useState, useMemo } from 'react';
import { PNCPResult, gerarId } from '@/lib/pncp-api';
import CardEstatisticas from './CardEstatisticas';
import ResultadosEmLista from './ResultadosEmLista';
import RelatorioWizard from './RelatorioWizard';
import ErrorBoundary from './ErrorBoundary';
import { FileDown, AlertTriangle } from 'lucide-react';

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

  const comValor = useMemo(() =>
    results.filter(r => {
      const v = Number(r.valorInicial);
      return !isNaN(v) && isFinite(v) && v > 0;
    }).length,
    [results]
  );

  return (
    <div className="space-y-6">
      <CardEstatisticas results={results} />

      {results.length > 0 && comValor > 0 && comValor < 3 && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Amostra insuficiente conforme Art. 6º, IN 65/2021</p>
              <p>
                Apenas <strong>{comValor} {comValor === 1 ? 'preço foi' : 'preços foram'} encontrado{comValor === 1 ? '' : 's'}</strong> com valor válido. 
                O cálculo estatístico exige o <strong>mínimo de 3 preços</strong> para conformidade legal. 
                Considere ampliar o período de busca ou usar parâmetros adicionais para aumentar a amostra.
              </p>
            </div>
          </div>
        </div>
      )}

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
              className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
