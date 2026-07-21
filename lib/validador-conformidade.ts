import { DadosRelatorioPesquisa } from './relatorio-pesquisa';
import { formatarMoeda } from './formatadores';

export interface ResultadoValidacao {
  conforme: boolean;
  erros: string[];
  avisos: string[];
  informacoes: string[];
}

export function validarConformidadeLei(dados: DadosRelatorioPesquisa): ResultadoValidacao {
  const resultado: ResultadoValidacao = {
    conforme: true,
    erros: [],
    avisos: [],
    informacoes: [],
  };

  if (dados.registrosComValor < 3) {
    resultado.avisos.push(
      `AVISO: Amostra insuficiente (Art. 6º, IN 65/2021). O cálculo exige mínimo de 3 preços válidos, mas a pesquisa encontrou apenas ${dados.registrosComValor}. Justifique no processo administrativo.`
    );
  }

  if (!['media', 'mediana', 'menor_valor'].includes(dados.metodoCalculo)) {
    resultado.conforme = false;
    resultado.erros.push(
      'Método de cálculo inválido. Use: média, mediana ou menor valor'
    );
  }

  const diasDiferenca = Math.floor(
    (dados.periodoFinal.getTime() - dados.periodoInicial.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diasDiferenca > 365) {
    resultado.avisos.push(
      `AVISO: Período de pesquisa (${diasDiferenca} dias) ultrapassa os 12 meses recomendados`
    );
  }

  if (dados.fonte !== 'PNCP' && dados.fonte !== 'MISTO') {
    resultado.avisos.push(
      'AVISO: Fonte diferente de PNCP pode gerar questionamentos. IN 65/2021 prioriza (incisos I e II)'
    );
  }

  const valoresSemAnomalias = dados.listaResultados
    .filter(r => typeof r.valorTotal === 'number' || typeof r.valorTotal === 'string')
    .every(r => {
      const v = Number(r.valorTotal);
      return !isNaN(v) && isFinite(v) && v > 0 && v < Number.MAX_SAFE_INTEGER;
    });
  if (!valoresSemAnomalias) {
    resultado.erros.push(
      'ERRO: Há valores inconsistentes na amostra (zero ou infinito)'
    );
    resultado.conforme = false;
  }

  if (dados.coeficienteVariacao > 1.0) {
    resultado.avisos.push(
      `AVISO: Coeficiente de variação muito elevado (${(dados.coeficienteVariacao * 100).toFixed(1)}%). Considere usar mediana ao invés de média`
    );
  }

  const ufsCount = Object.keys(dados.distribuicaoPorUF).length;
  if (ufsCount > 15) {
    resultado.informacoes.push(
      `Boa prática: Pesquisa abrange ${ufsCount} estados, demonstrando amplitude nacional`
    );
  }

  if (!dados.observacoes || dados.observacoes.trim().length < 50) {
    resultado.avisos.push(
      'AVISO: Análise crítica muito breve. TCU recomenda justificativa detalhada'
    );
  }

  const diasDesdeConsulta = Math.floor(
    (new Date().getTime() - dados.dataConsulta.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diasDesdeConsulta > 180) {
    resultado.avisos.push(
      `AVISO: Consulta realizada há ${diasDesdeConsulta} dias. IN 65/2021 recomenda até 180 dias`
    );
  }

  if (dados.precoEstimado > dados.valorMaximo * 1.20) {
    resultado.avisos.push(
      `AVISO: Preço estimado (${formatarMoeda(dados.precoEstimado)}) está 20%+ acima do máximo encontrado (${formatarMoeda(dados.valorMaximo)})`
    );
  }

  return resultado;
}

export function gerarObservacoes(
  resultados: { orgao: string; uf: string; objeto: string; valorTotal: number }[],
  stats: { media: number; mediana: number; minimo: number; maximo: number; desvioPadrao: number; coeficienteVariacao: number }
): string {
  const linhas: string[] = [];

  linhas.push(`ANÁLISE CRÍTICA DOS PREÇOS COLETADOS`);
  linhas.push(``);
  linhas.push(`Foram analisados ${resultados.length} registros de contratações similares obtidos do PNCP.`);
  linhas.push(``);

  if (stats.coeficienteVariacao < 0.15) {
    linhas.push(`Os preços apresentam alta homogeneidade (CV = ${(stats.coeficienteVariacao * 100).toFixed(1)}%), indicando mercado consolidado e previsível. A média aritmética é representativa.`);
  } else if (stats.coeficienteVariacao < 0.30) {
    linhas.push(`Os preços apresentam dispersão moderada (CV = ${(stats.coeficienteVariacao * 100).toFixed(1)}%), dentro do esperado para contratações públicas. A mediana foi adotada para mitigar efeitos de valores atípicos.`);
  } else if (stats.coeficienteVariacao < 0.50) {
    linhas.push(`Os preços apresentam dispersão significativa (CV = ${(stats.coeficienteVariacao * 100).toFixed(1)}%), sugerindo heterogeneidade no mercado. A mediana foi priorizada como medida de tendência central robusta.`);
  } else {
    linhas.push(`Os preços apresentam dispersão muito elevada (CV = ${(stats.coeficienteVariacao * 100).toFixed(1)}%), indicando mercado com baixa padronização. Recomenda-se adoção do menor valor ou segmentação da amostra.`);
  }

  linhas.push(``);
  linhas.push(`AMPLITUDE: Os valores variam entre ${formatarMoeda(stats.minimo)} e ${formatarMoeda(stats.maximo)}, com diferença de ${formatarMoeda(stats.maximo - stats.minimo)}.`);
  linhas.push(``);
  linhas.push(`CONCLUSÃO: O preço estimado reflete adequadamente as condições de mercado praticadas pela Administração Pública, em conformidade com o Art. 23 da Lei nº 14.133/2021 e a IN SEGES/ME nº 65/2021.`);

  return linhas.join('\n');
}

export function gerarRecomendacoes(
  stats: { media: number; mediana: number; minimo: number; maximo: number; coeficienteVariacao: number; desvioPadrao: number }
): string[] {
  const recs: string[] = [];

  recs.push('Manter a pesquisa de preços arquivada junto aos autos do processo administrativo, conforme Art. 23, §1º da Lei nº 14.133/2021.');

  if (stats.coeficienteVariacao > 0.30) {
    recs.push('Considerar a realização de pesquisa complementar em outras fontes (Painel de Preços, compras governamentais) para ampliar a amostra e refinar o preço estimado.');
  }

  recs.push('Atualizar a pesquisa caso o processo licitatório não seja concluído em 180 dias, conforme recomendação temporal da IN SEGES/ME nº 65/2021.');

  recs.push(`O valor estimado de ${formatarMoeda(stats.mediana)} (mediana) deve constar no ETP (Estudo Técnico Preliminar) e no Mapa de Risco, com a devida justificativa do parâmetro adotado.`);

  if (stats.desvioPadrao > stats.media * 0.5) {
    recs.push('Atenção ao alto desvio padrão: recomenda-se verificar se todos os itens da amostra são efetivamente comparáveis ao objeto pretendido.');
  }

  recs.push('O gestor deve atestar, no relatório final, que os preços coletados refletem a realidade de mercado do objeto a ser contratado.');

  return recs;
}

export function gerarDistribuicaoPorUF(
  resultados: { uf: string }[]
): Record<string, number> {
  const distrib: Record<string, number> = {};
  for (const r of resultados) {
    const uf = r.uf || 'N/I';
    distrib[uf] = (distrib[uf] || 0) + 1;
  }
  const ordenado: Record<string, number> = {};
  for (const uf of Object.keys(distrib).sort((a, b) => distrib[b] - distrib[a])) {
    ordenado[uf] = distrib[uf];
  }
  return ordenado;
}

export function gerarDistribuicaoPorTipo(
  resultados: { tipo: 'CONTRATO' | 'ATA' }[]
): { CONTRATO: number; ATA: number } {
  return {
    CONTRATO: resultados.filter(r => r.tipo === 'CONTRATO').length,
    ATA: resultados.filter(r => r.tipo === 'ATA').length,
  };
}
