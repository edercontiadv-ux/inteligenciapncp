'use client';

import { useState, useMemo } from 'react';
import { PNCPResult } from '@/lib/pncp-api';
import { DadosRelatorioPesquisa, ResultadoItem } from '@/lib/relatorio-pesquisa';
import { gerarRelatorioPDF } from '@/lib/gerar-relatorio-pdf';
import { calcularEstatisticas } from '@/lib/estatisticas';
import {
  gerarObservacoes, gerarRecomendacoes,
  gerarDistribuicaoPorUF, gerarDistribuicaoPorTipo, validarConformidadeLei,
} from '@/lib/validador-conformidade';
import { X, ArrowLeft, ArrowRight, FileDown, AlertTriangle, Loader2, Check } from 'lucide-react';

interface RelatorioWizardProps {
  selectedResults: PNCPResult[];
  termoBusca: string;
  onClose: () => void;
}

const PARAMETROS = [
  { id: 'I', label: 'I - Composição de Custos Unitários', desc: 'Planilhas de custos e tabelas referenciais' },
  { id: 'II', label: 'II - Contratações Similares', desc: 'Contratações similares da Administração Pública (PNCP)' },
  { id: 'III', label: 'III - Pesquisa em Mídia Especializada', desc: 'Publicações, mídias e sindicatos' },
  { id: 'IV', label: 'IV - Pesquisa Direta (Fornecedores)', desc: 'Cotação com fornecedores do ramo' },
  { id: 'V', label: 'V - Notas Fiscais Eletrônicas', desc: 'NF-e de contratações similares' },
];

function fmtMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}
function traduzirMetodo(m: string): string {
  const map: Record<string, string> = { media: 'Média Aritmética', mediana: 'Mediana', menor_valor: 'Menor Valor' };
  return map[m] || m;
}

export default function RelatorioWizard({ selectedResults, termoBusca, onClose }: RelatorioWizardProps) {
  const [step, setStep] = useState(0);
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
  const [parametros, setParametros] = useState<string[]>(['II']);
  const [justificativaParametros, setJustificativaParametros] = useState('');
  const [metodoCalculo, setMetodoCalculo] = useState<'media' | 'mediana' | 'menor_valor'>('mediana');
  const [justificativaMetodo, setJustificativaMetodo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const cv = stats.coeficienteVariacao;
  const sugestaoMetodo = useMemo(() => {
    if (cv < 0.15) return { metodo: 'media' as const, just: 'A média aritmética foi escolhida pois os preços são homogêneos (CV < 15%), demonstrando alta consistência de mercado.' };
    if (cv > 0.50) return { metodo: 'menor_valor' as const, just: 'O menor valor foi escolhido pois há variação muito elevada (CV > 50%), e este melhor representa contratações eficientes sem comprometer a viabilidade.' };
    return { metodo: 'mediana' as const, just: 'A mediana foi escolhida pois melhor representa a faixa de preços quando há variação significativa (CV entre 15% e 50%), mitigando efeitos de valores atípicos.' };
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
    if (comValor.length < 3) e.push('Mínimo de 3 registros com valor (Art. 6º, IN 65/2021)');
    if (parametros.length === 1 && !justificativaParametros) e.push('Justificativa obrigatória quando apenas 1 parâmetro');
    if (metodoCalculo !== 'media' && !justificativaMetodo) e.push('Justificativa do método obrigatória');
    return e;
  }, [orgaoNome, servidorNome, comValor, parametros, justificativaParametros, metodoCalculo, justificativaMetodo]);

  const avisosList = useMemo(() => {
    const w: string[] = [];
    if (parametros.length === 1) w.push('Apenas 1 parâmetro utilizado. Recomenda-se "cesta de preços"');
    if (cv > 0.5) w.push('CV > 50%: alta dispersão. Recomenda-se segmentação');
    if (comValor.length < 5) w.push('Menos de 5 registros com valor: amostra pequena');
    return w;
  }, [parametros, cv, comValor]);

  const handleGerar = async () => {
    if (errosList.length > 0) { setError(errosList[0]); return; }
    setExporting(true);
    setError(null);

    try {
      const justMetodo = justificativaMetodo || sugestaoMetodo.just;
      const obs = observacoes || gerarObservacoes(listaResultados, stats);

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
        justificativaMetodo: justMetodo,
        observacoes: obs,
        distribuicaoPorUF: gerarDistribuicaoPorUF(listaResultados),
        distribuicaoPorTipo: gerarDistribuicaoPorTipo(listaResultados),
        precoMaximoSugerido: stats.mediana * 1.10,
        precoMinimoSugerido: stats.mediana * 0.90,
        recomendacoes: gerarRecomendacoes(stats),
        validadadeRelatorioDias: 180,
      };

      const validacao = validarConformidadeLei(dadosRelatorio);
      if (!validacao.conforme) {
        setError(validacao.erros[0] || 'Dados insuficientes');
        setExporting(false);
        return;
      }

      const nomeArquivo = `relatorio-pesquisa-${termoBusca.replace(/\s+/g, '-').substring(0, 30)}.pdf`;
      await gerarRelatorioPDF(dadosRelatorio, nomeArquivo);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setExporting(false);
    }
  };

  const toggleParametro = (id: string) => {
    setParametros(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const labels = ['Dados do Órgão', 'Parâmetros', 'Método', 'Análise', 'Revisão'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>Gerar Relatório de Pesquisa de Preços</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto">
          {labels.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap',
              padding: '4px 10px', borderRadius: '999px',
              backgroundColor: i === step ? 'rgb(20, 40, 80)' : i < step ? '#dcfce7' : '#f3f4f6',
              color: i === step ? 'white' : i < step ? '#166534' : '#6b7280'
            }}>
              {i < step ? <Check className="w-3 h-3" /> : <span style={{
                width: '14px', height: '14px', borderRadius: '50%', border: '1px solid currentColor',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'
              }}>{i + 1}</span>}
              {l}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs underline">OK</button>
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>1. Dados do Órgão e Servidor Responsável</h3>
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
              {comValor.length < 3 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Selecione pelo menos 3 itens com valor para gerar o relatório.
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>2. Parâmetros de Pesquisa (Art. 5º, IN 65/2021)</h3>
              <div className="space-y-2">
                {PARAMETROS.map(p => (
                  <label key={p.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                    borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                    borderColor: parametros.includes(p.id) ? 'rgb(20, 40, 80)' : '#e5e7eb',
                    backgroundColor: parametros.includes(p.id) ? 'rgba(20, 40, 80, 0.03)' : 'white'
                  }}>
                    <input type="checkbox" checked={parametros.includes(p.id)}
                      onChange={() => toggleParametro(p.id)} className="mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-gray-500">{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              {parametros.length === 1 && (
                <>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    <strong>⚠ AVISO LEGAL:</strong> Você está usando apenas 1 parâmetro. A jurisprudência do TCU (Acórdão 3059/2020)
                    recomenda "cesta de preços" (múltiplas fontes).
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Justificativa para uso de apenas 1 parâmetro *</label>
                    <textarea value={justificativaParametros} onChange={e => setJustificativaParametros(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                      placeholder="Justifique por que está utilizando apenas um parâmetro..." />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>3. Método de Cálculo (Art. 6º, IN 65/2021)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'media' as const, label: 'Média Aritmética', quando: 'CV < 15%', val: stats.media },
                  { id: 'mediana' as const, label: 'Mediana', quando: 'CV entre 15% e 50%', val: stats.mediana },
                  { id: 'menor_valor' as const, label: 'Menor Valor', quando: 'CV > 50%', val: stats.minimo },
                ].map(m => (
                  <button key={m.id} onClick={() => {
                    setMetodoCalculo(m.id);
                    setJustificativaMetodo(m.id === sugestaoMetodo.metodo ? sugestaoMetodo.just : '');
                  }} style={{
                    textAlign: 'left', padding: '12px', borderRadius: '8px', border: '2px solid',
                    cursor: 'pointer', transition: 'all 0.2s',
                    borderColor: metodoCalculo === m.id ? 'rgb(20, 40, 80)' : '#e5e7eb',
                    backgroundColor: metodoCalculo === m.id ? 'rgba(20, 40, 80, 0.03)' : 'white'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="text-sm font-medium">{m.label}</span>
                      {sugestaoMetodo.metodo === m.id &&
                        <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '999px' }}>Recomendado</span>}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{m.quando}</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'rgb(20, 40, 80)' }}>{fmtMoeda(m.val)}</div>
                  </button>
                ))}
              </div>
              {metodoCalculo !== 'media' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Justificativa do Método *</label>
                  <textarea value={justificativaMetodo} onChange={e => setJustificativaMetodo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
                </div>
              )}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-700 font-medium">PREÇO ESTIMADO PARA CONTRATAÇÃO</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgb(46, 125, 50)', marginTop: '4px' }}>{fmtMoeda(precoEstimado)}</div>
                <div className="text-xs text-green-600 mt-1">+ 5% sobre {traduzirMetodo(metodoCalculo)} ({fmtMoeda(precoBase)})</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>4. Análise Crítica</h3>
              <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
                <p><strong>AMPLITUDE:</strong> {fmtMoeda(stats.minimo)} a {fmtMoeda(stats.maximo)} (dif: {fmtMoeda(stats.maximo - stats.minimo)})</p>
                <p><strong>DISPERSÃO:</strong> {
                  cv < 0.2 ? 'Baixa dispersão, mercado estável.'
                  : cv < 0.5 ? 'Dispersão moderada.'
                  : cv < 1 ? 'Alta dispersão.'
                  : 'Altíssima dispersão.'
                }</p>
                <p><strong>CV:</strong> {fmtPct(cv)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Análise Crítica (editável)</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" rows={6}
                  placeholder={gerarObservacoes(listaResultados, stats)} />
                <button onClick={() => setObservacoes('')}
                  className="text-xs underline mt-1" style={{ color: 'rgb(20, 40, 80)' }}>
                  Restaurar texto padrão
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold" style={{ color: 'rgb(20, 40, 80)' }}>5. Revisão Final</h3>
              {avisosList.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 space-y-1">
                  {avisosList.map((a, i) => <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{a}</div>)}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  ['Órgão', orgaoNome || '(não informado)'],
                  ['Servidor', servidorNome || '(não informado)'],
                  ['Parâmetros', parametros.join(', ')],
                  ['Registros', `${comValor.length} com valor`],
                  ['Método', traduzirMetodo(metodoCalculo)],
                  ['Preço Estimado', fmtMoeda(precoEstimado)],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-lg text-xs">
                    <span className="font-medium">{label}:</span> {value}
                  </div>
                ))}
              </div>
              {errosList.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 space-y-1">
                  {errosList.map((e, i) => <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}</div>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-xs text-gray-400">{comValor.length} registros com valor</div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>
                <ArrowLeft className="w-3 h-3" /> Anterior
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgb(20, 40, 80)', color: 'white' }}>
                Próximo <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button onClick={handleGerar} disabled={exporting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 14px', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', background: exporting ? '#9ca3af' : 'rgb(20, 40, 80)', color: 'white' }}>
                {exporting ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</> : <><FileDown className="w-3 h-3" /> Gerar PDF</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
