'use client';

import { useState } from 'react';
import { PNCPResult } from '@/lib/pncp-api';
import { DadosRelatorioPesquisa, GeradorRelatorioPesquisa, ResultadoItem } from '@/lib/relatorio-pesquisa';
import { gerarRelatorioPDF } from '@/lib/gerar-relatorio-pdf';
import { calcularEstatisticas } from '@/lib/estatisticas';
import {
  gerarObservacoes, gerarRecomendacoes,
  gerarDistribuicaoPorUF, gerarDistribuicaoPorTipo, validarConformidadeLei,
} from '@/lib/validador-conformidade';
import { FileDown, AlertTriangle, Loader2 } from 'lucide-react';

interface RelatorioExportProps {
  selectedResults: PNCPResult[];
  termoBusca: string;
}

export default function RelatorioExport({ selectedResults, termoBusca }: RelatorioExportProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPDF = async () => {
    setExporting(true);
    setError(null);

    try {
      const values = selectedResults.map(r => r.valorInicial || 0).filter(v => v > 0);
      const stats = calcularEstatisticas(selectedResults);

      const listaResultados: ResultadoItem[] = selectedResults.map((item, index) => ({
        id: `r-${index}`,
        tipo: item.tipo,
        numero: item.tipo === 'CONTRATO'
          ? `${item.numeroContrato || ''}/${item.anoContrato || ''}`
          : `${item.numeroAtaRegistroPreco || ''}/${item.anoAta || ''}`,
        dataContrato: item.dataVigenciaInicio,
        orgao: item.orgaoEntidade?.razaoSocial || item.unidadeOrgao?.nomeUnidade || '',
        uf: item.unidadeOrgao?.ufSigla || '',
        objeto: item.objetoContrato || item.objetoAta || '',
        valorTotal: item.valorInicial || 0,
        dataInicio: item.dataVigenciaInicio,
        linkPDF: item.linkArquivo,
        fonte: 'PNCP',
        dataConsulta: new Date().toISOString(),
      }));

      const temEspecificos = selectedResults.filter(r => {
        const obj = (r.objetoContrato || r.objetoAta || '').toLowerCase();
        return termoBusca.toLowerCase().split(/\s+/).some(t => obj.includes(t));
      }).length > 0;

      let metodoCalculo: 'media' | 'mediana' | 'menor_valor';
      let justificativaMetodo: string;

      if (stats.coeficienteVariacao < 0.15) {
        metodoCalculo = 'media';
        justificativaMetodo = 'A media aritmetica foi escolhida pois os precos sao homogeneos (coeficiente de variacao < 15%), demonstrando alta consistencia de mercado.';
      } else if (stats.coeficienteVariacao > 0.50) {
        metodoCalculo = 'menor_valor';
        justificativaMetodo = 'O menor valor foi escolhido pois ha variacao muito elevada (coeficiente > 50%), e este melhor representa contratacoes eficientes sem comprometer a viabilidade.';
      } else {
        metodoCalculo = 'mediana';
        justificativaMetodo = 'A mediana foi escolhida pois melhor representa a faixa de precos quando ha variacao significativa (coeficiente de variacao > 15%), mitigando efeitos de valores atipicos.';
      }

      const precoBase = metodoCalculo === 'media' ? stats.media
        : metodoCalculo === 'menor_valor' ? stats.minimo
        : stats.mediana;

      const margemAdicionada = 5;
      const precoEstimado = precoBase * (1 + margemAdicionada / 100);

      const observacoes = gerarObservacoes(listaResultados, stats);
      const recomendacoes = gerarRecomendacoes(stats);

      const dadosRelatorio: DadosRelatorioPesquisa = {
        objetoPesquisa: termoBusca,
        termosBusca: termoBusca.split(',').map(t => t.trim()),
        dataSolicitacao: new Date(),
        dataConsulta: new Date(),
        horaConsulta: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        periodoInicial: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        periodoFinal: new Date(),

        orgaoSolicitante: '',
        servidorResponsavel: '',

        fonte: 'PNCP',
        urlConsulta: 'https://pncp.gov.br',

        listaResultados,
        totalRegistros: selectedResults.length,
        registrosComValor: values.length,
        registrosSemValor: selectedResults.length - values.length,

        valorMinimo: stats.minimo,
        valorMaximo: stats.maximo,
        valorMedio: stats.media,
        mediana: stats.mediana,
        desvioPadrao: stats.desvioPadrao,
        coeficienteVariacao: stats.coeficienteVariacao,

        metodoCalculo,
        precoEstimado,
        margemAdicionada,
        justificativaMetodo,

        observacoes,
        distribuicaoPorUF: gerarDistribuicaoPorUF(listaResultados),
        distribuicaoPorTipo: gerarDistribuicaoPorTipo(listaResultados),

        precoMaximoSugerido: stats.mediana * 1.10,
        precoMinimoSugerido: stats.mediana * 0.90,
        recomendacoes,

        validadadeRelatorioDias: 180,
      };

      const validacao = validarConformidadeLei(dadosRelatorio);

      if (!validacao.conforme) {
        setError(validacao.erros[0] || 'Dados insuficientes para gerar relatorio');
        setExporting(false);
        return;
      }

      const nomeArquivo = `relatorio-pesquisa-${termoBusca.replace(/\s+/g, '-').substring(0, 30)}.pdf`;
      await gerarRelatorioPDF(dadosRelatorio, nomeArquivo);

    } catch (err: any) {
      console.error('Erro ao exportar PDF:', err);
      setError(err.message || 'Erro ao gerar relatorio PDF');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setError(null)}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          OK
        </button>
        <span className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={exportPDF}
      disabled={selectedResults.length < 3 || exporting}
      className="btn-primary text-xs px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      title={selectedResults.length < 3 ? 'Selecione pelo menos 3 itens' : ''}
    >
      {exporting ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="mr-1.5 h-4 w-4" />
          Exportar Relatorio ({selectedResults.length})
        </>
      )}
    </button>
  );
}
