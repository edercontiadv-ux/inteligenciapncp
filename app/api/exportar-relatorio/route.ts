import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { gerarRelatorioPDF } from '@/lib/gerar-relatorio-pdf';
import { DadosRelatorioPesquisa } from '@/lib/relatorio-pesquisa';
import {
  validarConformidadeLei,
  gerarObservacoes,
  gerarRecomendacoes,
  gerarDistribuicaoPorUF,
  gerarDistribuicaoPorTipo,
} from '@/lib/validador-conformidade';
import { calcularEstatisticas } from '@/lib/estatisticas';

const ResultadoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['CONTRATO', 'ATA']),
  numero: z.string(),
  dataContrato: z.string(),
  orgao: z.string(),
  uf: z.string(),
  objeto: z.string(),
  valorTotal: z.number().nonnegative(),
  dataInicio: z.string(),
  linkPDF: z.string(),
  fonte: z.string(),
  dataConsulta: z.string(),
});

const RequestSchema = z.object({
  objetoPesquisa: z.string().min(1, 'Objeto da pesquisa obrigatorio'),
  termosBusca: z.array(z.string()).min(1, 'Minimo 1 termo de busca'),
  orgaoSolicitante: z.string().optional(),
  servidorResponsavel: z.string().optional(),
  listaResultados: z.array(ResultadoSchema).min(3, 'IN 65/2021 exige minimo de 3 precos'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { erro: 'Dados invalidos', detalhes: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { objetoPesquisa, termosBusca, orgaoSolicitante, servidorResponsavel, listaResultados } = parsed.data;

    const values = listaResultados.map(r => r.valorTotal).filter(v => v > 0);

    const stats = calcularEstatisticas(
      listaResultados.map(r => ({
        tipo: r.tipo,
        valorInicial: r.valorTotal,
        dataVigenciaInicio: r.dataInicio,
        orgaoEntidade: { razaoSocial: r.orgao },
        unidadeOrgao: { ufSigla: r.uf },
        objetoContrato: r.objeto,
        objetoAta: '',
        numeroContrato: '',
        anoContrato: 0,
        numeroAtaRegistroPreco: '',
        anoAta: 0,
        dataVigenciaFim: '',
        linkArquivo: r.linkPDF,
      }))
    );

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
      objetoPesquisa,
      termosBusca,
      dataSolicitacao: new Date(),
      dataConsulta: new Date(),
      horaConsulta: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      periodoInicial: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      periodoFinal: new Date(),

      orgaoSolicitante: orgaoSolicitante || '',
      servidorResponsavel: servidorResponsavel || '',

      fonte: 'PNCP',
      urlConsulta: 'https://pncp.gov.br',

      listaResultados,
      totalRegistros: listaResultados.length,
      registrosComValor: values.length,
      registrosSemValor: listaResultados.length - values.length,

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
      return NextResponse.json(
        { erro: validacao.erros[0] || 'Dados nao atendem requisitos legais', validacao },
        { status: 422 }
      );
    }

    const nomeArquivo = `relatorio-pesquisa-${objetoPesquisa.replace(/\s+/g, '-').substring(0, 30)}.pdf`;

    await gerarRelatorioPDF(dadosRelatorio, nomeArquivo);

    return NextResponse.json({
      sucesso: true,
      nomeArquivo,
      precoEstimado,
      avisos: validacao.avisos.length > 0 ? validacao.avisos : undefined,
    });

  } catch (erro) {
    console.error('Erro ao gerar relatorio:', erro);
    return NextResponse.json(
      { erro: 'Erro ao gerar relatorio PDF' },
      { status: 500 }
    );
  }
}
