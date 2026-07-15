'use client';

import { useState, useMemo } from 'react';
import { PNCPResult } from '@/lib/pncp-api';
import { DadosRelatorioPesquisa, ResultadoItem } from '@/lib/relatorio-pesquisa';
import { RelatorioParametros, OrgaoSolicitante, ServidorResponsavel, EstatisticasCalculadas } from '@/lib/relatorio-types';
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
  { id: 'I' as const, label: 'I - Composição de Custos Unitários', desc: 'Planilhas de custos e tabelas referenciais' },
  { id: 'II' as const, label: 'II - Contratações Similares', desc: 'Contratações similares da Administração Pública (PNCP)' },
  { id: 'III' as const, label: 'III - Pesquisa em Mídia Especializada', desc: 'Publicações, mídias e sindicatos' },
  { id: 'IV' as const, label: 'IV - Pesquisa Direta (Fornecedores)', desc: 'Cotação com fornecedores do ramo' },
  { id: 'V' as const, label: 'V - Notas Fiscais Eletrônicas', desc: 'NF-e de contratações similares' },
];

export default function RelatorioWizard({ selectedResults, termoBusca, onClose }: RelatorioWizardProps) {
  const [step, setStep] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comValor = useMemo(() =>
    selectedResults.filter(r => {
      const v = Number(r.valorInicial);
      return !isNaN(v) && isFinite(v) && v > 0;
    }),
    [selectedResults]
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
    })),
    [comValor]
  );

  const [formData, setFormData] = useState({
    objetoPesquisa: termoBusca,
    orgaoNome: '',
    orgaoCnpj: '',
    servidorNome: '',
    servidorMatricula: '',
    servidorCpf: '',
    numeroProcesso: '',
    parametros: ['II'] as Array<'I' | 'II' | 'III' | 'IV' | 'V'>,
    justificativaParametros: '',
    multiplosParametros: false,
    metodoCalculo: 'mediana' as 'media' | 'mediana' | 'menor_valor',
    justificativaMetodo: '',
    precoEstimado: 0,
    observacoes: '',
    assinanteNome: '',
    assinanteCargo: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sugerirMetodo = () => {
    const cv = stats.coeficienteVariacao;
    if (cv < 0.15) return { metodo: 'media' as const, just: 'A média aritmética foi escolhida pois os preços são homogêneos (CV < 15%), demonstrando alta consistência de mercado.' };
    if (cv > 0.50) return { metodo: 'menor_valor' as const, just: 'O menor valor foi escolhido pois há variação muito elevada (CV > 50%), e este melhor representa contratações eficientes sem comprometer a viabilidade.' };
    return { metodo: 'mediana' as const, just: 'A mediana foi escolhida pois melhor representa a faixa de preços quando há variação significativa (CV entre 15% e 50%), mitigando efeitos de valores atípicos.' };
  };

  const calcularPreco = () => {
    const sugestao = sugerirMetodo();
    const precoBase = sugestao.metodo === 'media' ? stats.media
      : sugestao.metodo === 'menor_valor' ? stats.minimo
      : stats.mediana;
    return precoBase * 1.05;
  };

  const erros = useMemo(() => {
    const errs: string[] = [];
    if (!formData.orgaoNome) errs.push('Órgão Solicitante é obrigatório');
    if (!formData.servidorNome) errs.push('Servidor Responsável é obrigatório');
    if (comValor.length < 3) errs.push('Mínimo de 3 registros com valor (Art. 6º, IN 65/2021)');
    if (formData.parametros.length === 1 && !formData.justificativaParametros) errs.push('Justificativa obrigatória quando apenas 1 parâmetro');
    if (formData.metodoCalculo !== 'media' && !formData.justificativaMetodo) errs.push('Justificativa do método obrigatória');
    return errs;
  }, [formData, comValor]);

  const avisos = useMemo(() => {
    const warns: string[] = [];
    if (formData.parametros.length === 1) warns.push('Apenas 1 parâmetro utilizado. Recomenda-se "cesta de preços"');
    if (stats.coeficienteVariacao > 0.5) warns.push('CV > 50%: alta dispersão. Recomenda-se segmentação');
    if (comValor.length < 5) warns.push('Menos de 5 registros com valor: amostra pequena');
    return warns;
  }, [formData.parametros, stats, comValor]);

  const handleGerar = async () => {
    if (erros.length > 0) { setError(erros[0]); return; }
    setExporting(true);
    setError(null);

    try {
      const sugestao = sugerirMetodo();
      const metodo = formData.metodoCalculo;
      const justMetodo = formData.justificativaMetodo || sugestao.just;
      const precoBase = metodo === 'media' ? stats.media
        : metodo === 'menor_valor' ? stats.minimo
        : stats.mediana;
      const precoEstimado = precoBase * 1.05;

      const observacoes = formData.observacoes || gerarObservacoes(listaResultados, {
        media: stats.media, mediana: stats.mediana, minimo: stats.minimo,
        maximo: stats.maximo, desvioPadrao: stats.desvioPadrao, coeficienteVariacao: stats.coeficienteVariacao,
      });

      const dadosRelatorio: DadosRelatorioPesquisa = {
        objetoPesquisa: formData.objetoPesquisa,
        termosBusca: termoBusca.split(',').map(t => t.trim()),
        dataSolicitacao: new Date(),
        dataConsulta: new Date(),
        horaConsulta: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        periodoInicial: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        periodoFinal: new Date(),
        orgaoSolicitante: formData.orgaoNome,
        servidorResponsavel: formData.servidorNome,
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
        metodoCalculo: metodo,
        precoEstimado,
        margemAdicionada: 5,
        justificativaMetodo: justMetodo,
        observacoes,
        distribuicaoPorUF: gerarDistribuicaoPorUF(listaResultados),
        distribuicaoPorTipo: gerarDistribuicaoPorTipo(listaResultados),
        precoMaximoSugerido: stats.mediana * 1.10,
        precoMinimoSugerido: stats.mediana * 0.90,
        recomendacoes: gerarRecomendacoes({
          media: stats.media, mediana: stats.mediana, minimo: stats.minimo,
          maximo: stats.maximo, coeficienteVariacao: stats.coeficienteVariacao,
          desvioPadrao: stats.desvioPadrao,
        }),
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

  const steps = [
    { label: 'Dados do Órgão', component: stepOrgao },
    { label: 'Parâmetros', component: stepParametros },
    { label: 'Método de Cálculo', component: stepMetodo },
    { label: 'Análise Crítica', component: stepAnalise },
    { label: 'Revisão', component: stepRevisao },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-brand-navy">Gerar Relatório de Pesquisa de Preços</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-4 pb-2 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-1 text-xs whitespace-nowrap px-2 py-1 rounded-full ${
              i === step ? 'bg-brand-navy text-white' : i < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border text-center leading-3 text-[10px]">{i + 1}</span>}
              {s.label}
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
          {avisos.length > 0 && step === steps.length - 1 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 space-y-1">
              {avisos.map((a, i) => <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{a}</div>)}
            </div>
          )}

          {step === 0 && stepOrgao()}
          {step === 1 && stepParametros()}
          {step === 2 && stepMetodo()}
          {step === 3 && stepAnalise()}
          {step === 4 && stepRevisao()}
        </div>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-xs text-gray-400">{comValor.length} registros com valor</div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Anterior
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && erros.length > 0} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                Próximo <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <button onClick={handleGerar} disabled={exporting} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1">
                {exporting ? <><Loader2 className="w-3 h-3 animate-spin" /> Gerando...</> : <><FileDown className="w-3 h-3" /> Gerar PDF</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function stepOrgao() {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-navy">1. Dados do Órgão e Servidor Responsável</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Objeto da Pesquisa *</label>
            <textarea value={formData.objetoPesquisa} onChange={e => handleChange('objetoPesquisa', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Órgão Solicitante *</label>
            <input value={formData.orgaoNome} onChange={e => handleChange('orgaoNome', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nome do ente público" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">CNPJ do Órgão</label>
            <input value={formData.orgaoCnpj} onChange={e => handleChange('orgaoCnpj', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Servidor Responsável *</label>
            <input value={formData.servidorNome} onChange={e => handleChange('servidorNome', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nome completo" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Matrícula/CPF</label>
            <input value={formData.servidorMatricula} onChange={e => handleChange('servidorMatricula', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Matrícula ou CPF" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nº do Processo (opcional)</label>
            <input value={formData.numeroProcesso} onChange={e => handleChange('numeroProcesso', e.target.value)}
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
    );
  }

  function stepParametros() {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-navy">2. Parâmetros de Pesquisa (Art. 5º, IN 65/2021)</h3>
        <div className="space-y-2">
          {PARAMETROS.map(p => (
            <label key={p.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              formData.parametros.includes(p.id) ? 'border-brand-navy bg-brand-navy/5' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={formData.parametros.includes(p.id)}
                onChange={() => {
                  const next = formData.parametros.includes(p.id)
                    ? formData.parametros.filter(x => x !== p.id)
                    : [...formData.parametros, p.id];
                  handleChange('parametros', next);
                  handleChange('multiplosParametros', next.length > 1);
                }}
                className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-xs text-gray-500">{p.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {formData.parametros.length === 1 && (
          <>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              <strong>⚠ AVISO LEGAL:</strong> Você está usando apenas 1 parâmetro. A jurisprudência do TCU (Acórdão 3059/2020)
              recomenda "cesta de preços" (múltiplas fontes). Deseja adicionar mais parâmetros?
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Justificativa para uso de apenas 1 parâmetro *</label>
              <textarea value={formData.justificativaParametros} onChange={e => handleChange('justificativaParametros', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
                placeholder="Justifique por que está utilizando apenas um parâmetro..." />
            </div>
          </>
        )}
      </div>
    );
  }

  function stepMetodo() {
    const sugestao = sugerirMetodo();
    const preco = calcularPreco();
    const cv = stats.coeficienteVariacao;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-navy">3. Método de Cálculo do Preço Estimado (Art. 6º, IN 65/2021)</h3>

        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'media' as const, label: 'Média Aritmética', quando: 'Valores homogêneos (CV < 15%)', value: stats.media },
            { id: 'mediana' as const, label: 'Mediana', quando: 'Com outliers ou dispersão moderada', value: stats.mediana },
            { id: 'menor_valor' as const, label: 'Menor Valor', quando: 'Justificativa específica (CV > 50%)', value: stats.minimo },
          ]).map(m => {
            const selecionado = formData.metodoCalculo === m.id;
            const recomendado = sugestao.metodo === m.id;
            return (
              <button key={m.id} onClick={() => {
                handleChange('metodoCalculo', m.id);
                if (m.id === sugestao.metodo) handleChange('justificativaMetodo', sugestao.just);
                else handleChange('justificativaMetodo', '');
              }}
                className={`text-left p-3 rounded-lg border transition-all ${
                  selecionado ? 'border-brand-navy ring-2 ring-brand-navy/20 bg-brand-navy/5' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{m.label}</span>
                  {recomendado && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Recomendado</span>}
                </div>
                <div className="text-xs text-gray-500 mb-1">{m.quando}</div>
                <div className="text-base font-bold text-brand-navy">{formatarMoeda(m.value)}</div>
                <div className="text-[10px] text-gray-400">{selecionado ? '✓ Selecionado' : 'Clique para selecionar'}</div>
              </button>
            );
          })}
        </div>

        {formData.metodoCalculo !== 'media' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Justificativa do Método *</label>
            <textarea value={formData.justificativaMetodo} onChange={e => handleChange('justificativaMetodo', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={3}
              placeholder="Justifique a escolha do método (mín. 100 caracteres)..." />
          </div>
        )}

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-xs text-green-700 font-medium">PREÇO ESTIMADO PARA CONTRATAÇÃO</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{formatarMoeda(preco)}</div>
          <div className="text-[10px] text-green-600 mt-1">+ 5% de margem sobre o {traduzirMetodo(formData.metodoCalculo)} (R$ {formatarMoeda(preco / 1.05)})</div>
        </div>

        {cv > 0.5 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
            <strong>⚠ CV = {formatarPercentual(cv)}:</strong> Alta dispersão. Recomenda-se verificar a comparabilidade dos itens.
          </div>
        )}
      </div>
    );
  }

  function stepAnalise() {
    const obsAuto = gerarObservacoes(listaResultados, {
      media: stats.media, mediana: stats.mediana, minimo: stats.minimo,
      maximo: stats.maximo, desvioPadrao: stats.desvioPadrao, coeficienteVariacao: stats.coeficienteVariacao,
    });

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-navy">4. Análise Crítica dos Resultados</h3>

        <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
          <p><strong>AMPLITUDE:</strong> Os valores variam entre {formatarMoeda(stats.minimo)} e {formatarMoeda(stats.maximo)}, com diferença de {formatarMoeda(stats.maximo - stats.minimo)}.</p>
          <p><strong>DISPERSÃO:</strong> {
            stats.coeficienteVariacao < 0.2 ? 'Preços com baixa dispersão, indicando mercado estável.'
            : stats.coeficienteVariacao < 0.5 ? 'Preços com dispersão moderada, dentro do esperado.'
            : stats.coeficienteVariacao < 1 ? 'Preços com alta dispersão, recomenda-se análise aprofundada.'
            : 'Preços com altíssima dispersão. Verificar comparabilidade.'
          }</p>
          <p><strong>CV:</strong> {formatarPercentual(stats.coeficienteVariacao)}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Análise Crítica (editável)</label>
          <textarea value={formData.observacoes} onChange={e => handleChange('observacoes', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm" rows={6}
            placeholder={obsAuto} />
          <button onClick={() => handleChange('observacoes', obsAuto)}
            className="text-xs text-brand-navy underline mt-1">
            Restaurar texto padrão
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assinante (Servidor) *</label>
            <input value={formData.assinanteNome} onChange={e => handleChange('assinanteNome', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Nome do servidor" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
            <input value={formData.assinanteCargo} onChange={e => handleChange('assinanteCargo', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Cargo/função" />
          </div>
        </div>
      </div>
    );
  }

  function stepRevisao() {
    const preco = calcularPreco();
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-navy">5. Revisão Final</h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Órgão:</span> {formData.orgaoNome || '(não informado)'}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Servidor:</span> {formData.servidorNome || '(não informado)'}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Parâmetros:</span> {formData.parametros.join(', ')}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Registros:</span> {comValor.length} com valor
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Método:</span> {traduzirMetodo(formData.metodoCalculo)}
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <span className="font-medium">Preço Estimado:</span>{' '}
            <span className="text-base font-bold text-green-700">{formatarMoeda(preco)}</span>
          </div>
        </div>

        {erros.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 space-y-1">
            {erros.map((e, i) => <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{e}</div>)}
          </div>
        )}

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <strong>Resumo do Relatório:</strong> Serão geradas {formData.parametros.length === 1 ? '~8' : '~10'} páginas com todas as seções obrigatórias
          conforme Lei nº 14.133/2021 e IN SEGES/ME nº 65/2021.
        </div>
      </div>
    );
  }
}

// Helper for formatacao
function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarPercentual(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

function traduzirMetodo(m: string): string {
  const map: Record<string, string> = { media: 'Média Aritmética', mediana: 'Mediana', menor_valor: 'Menor Valor' };
  return map[m] || m;
}
