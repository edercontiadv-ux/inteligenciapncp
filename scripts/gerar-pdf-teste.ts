import { DadosRelatorioPesquisa, ResultadoItem } from '../lib/relatorio-pesquisa';
import { gerarRelatorioPDF } from '../lib/gerar-relatorio-pdf';
import { gerarDistribuicaoPorUF, gerarDistribuicaoPorTipo, gerarObservacoes } from '../lib/validador-conformidade';

function criarResultados(qtd: number, prefixo: string): ResultadoItem[] {
  const resultados: ResultadoItem[] = [];
  const ufs = ['SP', 'RJ', 'MG', 'DF', 'BA', 'RS', 'PR', 'SC', 'PE', 'CE', 'GO', 'ES', 'MT', 'MS', 'AM', 'PA'];
  for (let i = 0; i < qtd; i++) {
    resultados.push({
      id: `r-${i}`,
      tipo: i % 3 === 0 ? 'ATA' : 'CONTRATO',
      numero: `${1000 + i}/2024`,
      dataContrato: `2024-0${(i % 9) + 1}-15`,
      orgao: `Orgao ${prefixo} ${i + 1}`,
      uf: ufs[i % ufs.length],
      objeto: `${prefixo} - Item de contratacao numero ${i + 1} para teste de geracao de relatorio PDF`,
      valorTotal: 1500 + i * 350 + (i % 5) * 100,
      dataInicio: `2024-0${(i % 9) + 1}-10`,
      linkPDF: '',
      fonte: 'PNCP',
      dataConsulta: new Date().toISOString(),
    });
  }
  return resultados;
}

function makeDados(
  resultados: ResultadoItem[],
  observacoesComplementares: string,
  justificativaMetodo: string,
): DadosRelatorioPesquisa {
  const valores = resultados.map(r => r.valorTotal);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const sorted = [...valores].sort((a, b) => a - b);
  const mediana = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const variancia = valores.reduce((acc, v) => acc + (v - media) ** 2, 0) / valores.length;
  const desvioPadrao = Math.sqrt(variancia);
  const cv = desvioPadrao / media;

  let metodoCalculo: 'media' | 'mediana' | 'menor_valor';
  if (cv < 0.15) metodoCalculo = 'media';
  else if (cv > 0.50) metodoCalculo = 'menor_valor';
  else metodoCalculo = 'mediana';

  const precoBase = metodoCalculo === 'media' ? media
    : metodoCalculo === 'menor_valor' ? min
    : mediana;
  const precoEstimado = precoBase * 1.05;

  return {
    objetoPesquisa: 'geladeira para vacinas, capacidade minima de 300 litros',
    termosBusca: ['geladeira para vacinas', 'capacidade minima de 300 litros'],
    dataSolicitacao: new Date(),
    dataConsulta: new Date(),
    horaConsulta: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    periodoInicial: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    periodoFinal: new Date(),
    orgaoSolicitante: 'Secretaria Municipal de Saude - SMS',
    servidorResponsavel: 'Dr. Carlos Alberto da Silva',
    fonte: 'PNCP',
    urlConsulta: 'https://pncp.gov.br',
    listaResultados: resultados,
    totalRegistros: resultados.length + 6,
    registrosComValor: resultados.length,
    registrosSemValor: 6,
    valorMinimo: min,
    valorMaximo: max,
    valorMedio: media,
    mediana,
    desvioPadrao,
    coeficienteVariacao: cv,
    metodoCalculo,
    precoEstimado,
    margemAdicionada: 5,
    justificativaMetodo,
    observacoes: observacoesComplementares,
    distribuicaoPorUF: gerarDistribuicaoPorUF(resultados),
    distribuicaoPorTipo: gerarDistribuicaoPorTipo(resultados),
    precoMaximoSugerido: mediana * 1.10,
    precoMinimoSugerido: mediana * 0.90,
    recomendacoes: [],
    validadadeRelatorioDias: 180,
  };
}

async function main() {
  // Cenario 1: 16 registros, CV moderado
  const resultados1 = criarResultados(16, 'Teste');
  const obs1 = gerarObservacoes(resultados1, {
    media: 0, mediana: 0, minimo: 0, maximo: 0, desvioPadrao: 0, coeficienteVariacao: 0,
  });
  const just1 = 'A mediana foi escolhida pois melhor representa a faixa de precos quando ha variacao significativa (CV entre 15% e 50%), mitigando efeitos de valores atipicos.';

  const dados1 = makeDados(resultados1, obs1, just1);
  await gerarRelatorioPDF(dados1, 'teste-cenario-1-padrao.pdf');
  console.log('PDF 1 gerado: teste-cenario-1-padrao.pdf');

  // Cenario 2: 22 registros, texto longo complementar e justificativa longa
  const resultados2 = criarResultados(22, 'Estresse');
  const obsLonga =
    'Este relatorio apresenta uma analise aprofundada dos precos praticados pela Administracao Publica para o objeto em questao.\n\n' +
    '1. ANALISE DE TENDENCIA CENTRAL:\n' +
    '   - Media Aritmetica: Representa o valor medio simples dos precos coletados, sendo influenciada por valores extremos.\n' +
    '   - Mediana: Valor central da amostra, mais robusta contra outliers e distorcoes.\n' +
    '   - Menor Valor: Adotado em cenarios de alta dispersao para garantir eficiencia na contratacao.\n\n' +
    '2. ANALISE DE DISPERSAO:\n' +
    '   - O desvio padrao calculado indica a variabilidade dos precos em torno da media.\n' +
    '   - Quanto maior o coeficiente de variacao (CV), menor a homogeneidade dos precos praticados.\n' +
    '   - Para CV abaixo de 15%: Mercado considerado homogeneo e previsivel.\n' +
    '   - Para CV entre 15% e 50%: Dispersao moderada, recomendando-se o uso da mediana.\n' +
    '   - Para CV acima de 50%: Alta dispersao, recomendando-se o menor valor ou segmentacao.\n\n' +
    '3. DISTRIBUICAO GEOGRAFICA:\n' +
    '   A amostra abrange contratacoes de diversos estados brasileiros, demonstrando amplitude nacional e representatividade adequada para a formacao do preco de referencia.\n\n' +
    '4. CONSIDERACOES FINAIS:\n' +
    '   O preco estimado para contratacao considera a margem de 5% sobre o valor calculado pelo metodo estatistico adotado, em conformidade com a IN SEGES/ME no 65/2021 e a Lei no 14.133/2021.\n\n' +
    '   Importante destacar que a pesquisa de precos e um instrumento de apoio a decisao, nao substituindo o juizo de valor do gestor publico quanto a adequacao do objeto e das condicoes contratuais.';

  const justLonga =
    'A mediana foi escolhida como metodo de calculo do preco estimado por apresentar maior robustez estatistica diante da variacao observada nos precos coletados. ' +
    'O coeficiente de variacao (CV) encontra-se na faixa entre 15% e 50%, indicando dispersao moderada. ' +
    'Neste cenario, a media aritmetica seria excessivamente influenciada por valores extremos, enquanto a mediana representa melhor a tendencia central da amostra. ' +
    'A mediana e tambem o metodo preferencial recomendado pela IN SEGES/ME no 65/2021 para cenarios de dispersao moderada, sendo amplamente aceita em auditorias do TCU e Tribunais de Contas Estaduais. ' +
    'Adicionalmente, a mediana apresenta a vantagem de ser menos sensivel a erros de preenchimento ou a valores atipicos que podem ocorrer em bases de dados publicas como o PNCP.';

  const dados2 = makeDados(resultados2, obsLonga, justLonga);
  await gerarRelatorioPDF(dados2, 'teste-cenario-2-texto-longo.pdf');
  console.log('PDF 2 gerado: teste-cenario-2-texto-longo.pdf');
}

main().catch(console.error);
