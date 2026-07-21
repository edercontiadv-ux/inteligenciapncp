'use client';

import { useState, useMemo } from 'react';
import { PNCPResult } from '@/lib/pncp-api';
import { DadosRelatorioPesquisa, ResultadoItem } from '@/lib/relatorio-pesquisa';
import { gerarRelatorioPDF } from '@/lib/gerar-relatorio-pdf';
import { calcularEstatisticas } from '@/lib/estatisticas';
import {
  gerarObservacoes, gerarRecomendacoes,
  gerarDistribuicaoPorUF, gerarDistribuicaoPorTipo,
} from '@/lib/validador-conformidade';
import { X, FileDown, AlertTriangle, Loader2 } from 'lucide-react';

interface RelatorioWizardProps {
  selectedResults: PNCPResult[];
  termoBusca: string;
  onClose: () => void;
}

function fmtMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RelatorioWizard({ selectedResults, termoBusca, onClose }: RelatorioWizardProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comValor = useMemo(() =>
    selectedResults.filter(r => {
      const v = Number(r.valorInicial);
      return !isNaN(v) && isFinite(v) && v > 0;
    }), [selectedResults]
  );

  const stats = useMemo(() => calcularEstatisticas(comValor), [comValor]);

  const listaResultados: ResultadoItem[] = useMemo(() =>
    comValor.map((item, index) => ({
      id: `r-${index}`,
      tipo: item.tipo,
      numero: item.tipo === 'CONTRATO'
        ? `${item.numeroContrato || ''}/${item.anoContrato || ''}`
        : `${item.numeroAtaRegistroPreco || ''}/${item.anoAta || ''}`,
      dataContrato: item.dataVigenciaInicio,
      orgao: item.orgaoEntidade?.razaoSocial || item.unidadeOrgao?.nomeUnidade || '',
      uf: item.unidadeOrgao?.ufSigla || '',
      objeto: item.objetoContrato || item.objetoAta || '',
      valorTotal: Number(item.valorInicial),
      dataInicio: item.dataVigenciaInicio,
      linkPDF: item.linkArquivo,
      fonte: 'PNCP',
      dataConsulta: new Date().toISOString(),
    })), [comValor]
  );

  const [objetoPesquisa, setObjetoPesquisa] = useState(termoBusca);
  const [orgaoNome, setOrgaoNome] = useState('');
  const [orgaoCnpj, setOrgaoCnpj] = useState('');
  const [servidorNome, setServidorNome] = useState('');
  const [servidorMatricula, setServidorMatricula] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');

  const cv = stats.coeficienteVariacao;
  const metodoCalculo = useMemo(() => {
    if (cv < 0.15) return 'media' as const;
    if (cv > 0.50) return 'menor_valor' as const;
    return 'mediana' as const;
  }, [cv]);

  const justificativaMetodo = useMemo(() => {
    if (cv < 0.15) return 'A média aritmética foi escolhida pois os preços são homogêneos (CV < 15%), demonstrando alta consistência de mercado.';
    if (cv > 0.50) return 'O menor valor foi escolhido pois há variação muito elevada (CV > 50%), e este melhor representa contratações eficientes sem comprometer a viabilidade.';
    return 'A mediana foi escolhida pois melhor representa a faixa de preços quando há variação significativa (CV entre 15% e 50%), mitigando efeitos de valores atípicos.';
  }, [cv]);

  const precoBase = useMemo(() => {
    if (metodoCalculo === 'media') return stats.media;
    if (metodoCalculo === 'menor_valor') return stats.minimo;
    return stats.mediana;
  }, [metodoCalculo, stats]);

  const precoEstimado = precoBase * 1.05;

  const errosList = useMemo(() => {
    const e: string[] = [];
    if (!orgaoNome) e.push('Órgão Solicitante é obrigatório');
    if (!servidorNome) e.push('Servidor Responsável é obrigatório');
    return e;
  }, [orgaoNome, servidorNome]);

  const handleGerar = async () => {
    if (errosList.length > 0) { setError(errosList[0]); return; }
    setExporting(true);
    setError(null);

    try {
      const obs = gerarObservacoes(listaResultados, stats);

      const dadosRelatorio: DadosRelatorioPesquisa = {
        objetoPesquisa,
        termosBusca: termoBusca.split(',').map(t => t.trim()),
        dataSolicitacao: new Date(),
        dataConsulta: new Date(),
        horaConsulta: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        periodoInicial: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        periodoFinal: new Date(),
        orgaoSolicitante: orgaoNome,
        servidorResponsavel: servidorNome,
        fonte: 'PNCP',
        urlConsulta: 'https://pncp.gov.br',
        listaResultados,
        totalRegistros: selectedResults.length,
        registrosComValor: comValor.length,
        registrosSemValor: selectedResults.length - comValor.length,
        valorMinimo: stats.minimo,
        valorMaximo: stats.maximo,
        valorMedio: stats.media,
        mediana: stats.mediana,
        desvioPadrao: stats.desvioPadrao,
        coeficienteVariacao: stats.coeficienteVariacao,
        metodoCalculo,
        precoEstimado,
        margemAdicionada: 5,
        justificativaMetodo,
        observacoes: obs,
        distribuicaoPorUF: gerarDistribuicaoPorUF(listaResultados),
        distribuicaoPorTipo: gerarDistribuicaoPorTipo(listaResultados),
        precoMaximoSugerido: stats.mediana * 1.10,
        precoMinimoSugerido: stats.mediana * 0.90,
        recomendacoes: gerarRecomendacoes(stats),
        validadadeRelatorioDias: 180,
      };

      const nomeArquivo = `relatorio-pesquisa-${termoBusca.replace(/\s+/g, '-').substring(0, 30)}.pdf`;
      await gerarRelatorioPDF(dadosRelatorio, nomeArquivo);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>Gerar Relatório de Pesquisa de Preços</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs underline">OK</button>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>Dados do Órgão e Servidor Responsável</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Objeto da Pesquisa *</label>
                <textarea value={objetoPesquisa} onChange={e => setObjetoPesquisa(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Órgão Solicitante *</label>
                <input value={orgaoNome} onChange={e => setOrgaoNome(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nome do ente público" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ do Órgão</label>
                <input value={orgaoCnpj} onChange={e => setOrgaoCnpj(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Servidor Responsável *</label>
                <input value={servidorNome} onChange={e => setServidorNome(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Matrícula/CPF</label>
                <input value={servidorMatricula} onChange={e => setServidorMatricula(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Matrícula ou CPF" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Nº do Processo (opcional)</label>
                <input value={numeroProcesso} onChange={e => setNumeroProcesso(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Número do processo licitatório" />
              </div>
            </div>
          </div>

          {/* Resumo das escolhas automatizadas */}
          <div className="rounded-xl border border-brand-sand/30 bg-gray-50 p-4 space-y-2 text-xs text-gray-700">
            <p><strong>Parâmetro (Art. 5º):</strong> II - Contratações Similares da Administração Pública (PNCP)</p>
            <p><strong>Método (Art. 6º):</strong> {metodoCalculo === 'media' ? 'Média Aritmética' : metodoCalculo === 'mediana' ? 'Mediana' : 'Menor Valor'} (CV = {(cv * 100).toFixed(1)}%)</p>
            <p><strong>Registros:</strong> {comValor.length} com valor de {selectedResults.length} selecionados</p>
            {comValor.length < 3 && (
              <p className="text-yellow-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Amostra abaixo do mínimo de 3 preços (Art. 6º, IN 65/2021). O relatório será gerado com aviso de não conformidade.
              </p>
            )}
          </div>

          {/* Aviso legal do parâmetro único */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            <strong>[AVISO] </strong>
            O sistema automatiza atualmente apenas a fonte PNCP (parâmetro II). A jurisprudência do TCU (Acórdão 3059/2020)
            recomenda "cesta de preços" com múltiplas fontes para maior robustez. Recomenda-se complementar manualmente
            com outras fontes (planilhas de custos, mídia especializada, cotação direta, notas fiscais) quando aplicável.
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-xs text-gray-400">{comValor.length} registros com valor</div>
          <button onClick={handleGerar} disabled={exporting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '8px 20px', fontSize: '13px',
              borderRadius: '8px', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer',
              background: exporting ? '#9ca3af' : 'rgb(20, 40, 80)', color: 'white', fontWeight: 500,
            }}>
            {exporting ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</> : <><FileDown className="w-4 h-4" /> Gerar Relatório</>}
          </button>
        </div>
      </div>
    </div>
  );
}
