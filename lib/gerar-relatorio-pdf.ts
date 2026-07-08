import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DadosRelatorioPesquisa } from './relatorio-pesquisa';
import { formatarMoeda, formatarData, formatarPercentual, traduzirMetodo } from './formatadores';

export async function gerarRelatorioPDF(
  dados: DadosRelatorioPesquisa,
  nomeArquivo: string = 'relatorio-pesquisa-precos.pdf'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  const checkPageBreak = (needed: number) => {
    if (yPosition + needed > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  adicionarCabecalho(doc, dados, margin, yPosition);
  yPosition = 75;

  checkPageBreak(45);
  adicionarMetodologia(doc, dados, margin, yPosition);
  yPosition += 55;

  checkPageBreak(65);
  adicionarEstatisticas(doc, dados, margin, yPosition);
  yPosition += 80;

  checkPageBreak(35);
  adicionarMetodoPreco(doc, dados, margin, yPosition);
  yPosition += 45;

  doc.addPage();
  yPosition = margin;
  adicionarTabelaDetalhada(doc, dados, margin, yPosition);

  doc.addPage();
  yPosition = margin;
  adicionarDistribuicoes(doc, dados, margin, yPosition);
  yPosition += 60;

  checkPageBreak(50);
  adicionarAnaliseCritica(doc, dados, margin, yPosition);
  yPosition += 50;

  checkPageBreak(50);
  adicionarBaseLegal(doc, dados, margin, yPosition);

  doc.addPage();
  adicionarRodape(doc, dados, margin);

  doc.save(nomeArquivo);
}

function adicionarCabecalho(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  doc.setFontSize(16);
  doc.setTextColor(0, 51, 102);
  doc.text('RELATÓRIO DE PESQUISA DE PREÇOS', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text('Lei n 14.133/2021 | IN SEGES/ME n 65/2021', margin, y + 8);

  doc.setDrawColor(0, 51, 102);
  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y + 15, boxW, 45, 'F');

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  let infoY = y + 22;

  doc.text(`Objeto da Pesquisa: ${dados.objetoPesquisa}`, margin + 5, infoY);
  infoY += 6;
  doc.text(`Termos de Busca: ${dados.termosBusca.join(', ')}`, margin + 5, infoY);
  infoY += 6;
  doc.text(`Data da Consulta: ${formatarData(dados.dataConsulta)} as ${dados.horaConsulta}`, margin + 5, infoY);
  infoY += 6;
  doc.text(`Periodo Pesquisado: ${formatarData(dados.periodoInicial)} a ${formatarData(dados.periodoFinal)}`, margin + 5, infoY);
  infoY += 6;
  doc.text(`Orgao Solicitante: ${dados.orgaoSolicitante || '(Nao informado)'}`, margin + 5, infoY);
  infoY += 6;
  doc.text(`Servidor Responsavel: ${dados.servidorResponsavel || '(Nao informado)'}`, margin + 5, infoY);
}

function adicionarMetodologia(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('2. METODOLOGIA E FONTE DE DADOS', margin, y);

  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  let currentY = y + 10;

  doc.text('Parametro Utilizado (Art. 5, IN 65/2021):', margin, currentY);
  currentY += 6;
  doc.setTextColor(0, 77, 153);
  doc.text('Contratacoes Similares da Administracao Publica (Inciso II)', margin + 5, currentY);
  currentY += 10;

  doc.setTextColor(0, 0, 0);
  doc.text('Fonte: Portal Nacional de Contratacoes Publicas (PNCP)', margin, currentY);
  currentY += 6;
  doc.text(`URL: ${dados.urlConsulta}`, margin + 5, currentY);
  currentY += 5;
  doc.text(`Data e Hora de Acesso: ${formatarData(dados.dataConsulta)} as ${dados.horaConsulta}`, margin + 5, currentY);
  currentY += 5;
  doc.text('Periodo de Abrangencia: Ultimos 12 meses', margin + 5, currentY);
  currentY += 10;

  doc.setDrawColor(0, 102, 204);
  doc.setFillColor(232, 244, 248);
  doc.rect(margin, currentY - 5, boxW, 12, 'F');
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(8);
  doc.text(
    'Justificativa: A pesquisa foi realizada atraves de contratacoes similares ja realizadas pela',
    margin + 3,
    currentY
  );
  doc.text(
    'Administracao Publica registradas no PNCP, conforme recomendacao prioritaria da IN SEGES/ME n 65/2021.',
    margin + 3,
    currentY + 4
  );
}

function adicionarEstatisticas(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('3. ESTATISTICAS DOS PRECOS ENCONTRADOS', margin, y);

  const tabelaQtd = [
    ['Total de Registros Encontrados', dados.totalRegistros.toString()],
    ['Registros com Valor Declarado', dados.registrosComValor.toString()],
    ['Registros sem Valor', dados.registrosSemValor.toString()],
  ];

  autoTable(doc, {
    startY: y + 8,
    head: [],
    body: tabelaQtd,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right', cellWidth: 30 },
    },
    headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawPage: () => {},
  });

  const tabelaEstat = [
    ['Valor Minimo', formatarMoeda(dados.valorMinimo)],
    ['Valor Maximo', formatarMoeda(dados.valorMaximo)],
    ['Preco Medio (Media Aritmetica)', formatarMoeda(dados.valorMedio)],
    ['Preco Mediano (Mediana)', formatarMoeda(dados.mediana)],
    ['Desvio Padrao', formatarMoeda(dados.desvioPadrao)],
    ['Coeficiente de Variacao', formatarPercentual(dados.coeficienteVariacao)],
  ];

  autoTable(doc, {
    startY: y + 38,
    head: [['Metrica', 'Valor']],
    body: tabelaEstat,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { halign: 'right', cellWidth: 30 },
    },
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawPage: () => {},
  });
}

function adicionarMetodoPreco(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;

  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('4. METODO DE CALCULO E PRECO ESTIMADO', margin, y);

  doc.setDrawColor(255, 152, 0);
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, y + 8, boxW, 16, 'F');

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Metodo Adotado: ${traduzirMetodo(dados.metodoCalculo)}`, margin + 3, y + 13);

  const justificativaLines = doc.splitTextToSize(dados.justificativaMetodo, boxW - 6);
  doc.setFontSize(8);
  for (let i = 0; i < justificativaLines.length && i < 2; i++) {
    doc.text(justificativaLines[i], margin + 3, y + 20 + i * 4);
  }

  doc.setDrawColor(76, 175, 80);
  doc.setFillColor(232, 245, 233);
  doc.rect(margin, y + 27, boxW, 15, 'F');

  doc.setFontSize(10);
  doc.setTextColor(46, 125, 50);
  doc.text('PRECO ESTIMADO PARA CONTRATACAO:', margin + 3, y + 32);

  doc.setFontSize(16);
  doc.setTextColor(27, 94, 32);
  doc.text(formatarMoeda(dados.precoEstimado), margin + 3, y + 40);
}

function adicionarTabelaDetalhada(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text(`5. RELACAO DE CONTRATOS/ATAS UTILIZADOS (${dados.totalRegistros} registros)`, margin, y);

  const tabelaBody = dados.listaResultados.map(item => [
    item.tipo,
    item.numero,
    item.orgao,
    item.uf,
    item.objeto.substring(0, 50) + '...',
    formatarMoeda(item.valorTotal),
    formatarData(item.dataInicio),
  ]);

  autoTable(doc, {
    startY: y + 8,
    head: [['Tipo', 'Numero', 'Orgao', 'UF', 'Objeto', 'Valor Total', 'Data Inicio']],
    body: tabelaBody,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 20 },
      2: { cellWidth: 50 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 50 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'center' },
    },
    headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
}

function adicionarDistribuicoes(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('6. DISTRIBUICAO DOS RESULTADOS', margin, y);

  doc.setFontSize(9);
  doc.text('Por Tipo:', margin, y + 12);
  const tabelaTipo = [
    ['CONTRATO', dados.distribuicaoPorTipo.CONTRATO.toString()],
    ['ATA', dados.distribuicaoPorTipo.ATA.toString()],
  ];

  autoTable(doc, {
    startY: y + 16,
    head: [['Tipo', 'Quantidade']],
    body: tabelaTipo,
    margin: { left: margin, right: margin + 90 },
    headStyles: { fillColor: [245, 245, 245], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    didDrawPage: () => {},
  });

  doc.text('Por UF:', margin + 100, y + 12);
  const tabelaUF = Object.entries(dados.distribuicaoPorUF).map(([uf, quantidade]) => [
    uf,
    quantidade.toString(),
  ]);

  autoTable(doc, {
    startY: y + 16,
    head: [['UF', 'Qtd']],
    body: tabelaUF,
    margin: { left: margin + 100, right: margin },
    headStyles: { fillColor: [245, 245, 245], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    didDrawPage: () => {},
  });
}

function adicionarAnaliseCritica(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;

  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('7. ANALISE CRITICA DOS RESULTADOS', margin, y);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  const obsLines = doc.splitTextToSize(dados.observacoes, boxW);
  let obsY = y + 10;
  for (const line of obsLines) {
    if (obsY > 270) break;
    doc.text(line, margin, obsY);
    obsY += 4;
  }

  let nextY = Math.max(obsY + 10, y + 50);
  doc.setFontSize(9);
  doc.text('Recomendacoes:', margin, nextY);
  nextY += 8;

  doc.setFontSize(8);
  dados.recomendacoes.forEach((rec, index) => {
    const lines = doc.splitTextToSize(rec, boxW - 10);
    doc.text(`${index + 1}.`, margin + 5, nextY);
    doc.text(lines, margin + 15, nextY);
    nextY += lines.length * 4 + 2;
  });
}

function adicionarBaseLegal(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number) {
  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;

  doc.setFontSize(12);
  doc.setTextColor(0, 51, 102);
  doc.text('8. BASE LEGAL E CONFORMIDADE', margin, y);

  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  let currentY = y + 12;

  doc.text('Art. 23, Lei n 14.133/2021', margin, currentY);
  currentY += 5;
  const art23 = doc.splitTextToSize(
    '"O valor previamente estimado da contratacao devera ser compativel com os valores praticados pelo mercado, considerados os precos constantes de bancos de dados publicos e as quantidades a serem contratadas, observadas a potencial economia de escala e as peculiaridades do local de execucao do objeto."',
    boxW - 10
  );
  for (const line of art23) {
    doc.text(line, margin + 5, currentY);
    currentY += 4;
  }

  currentY += 6;
  doc.text('Art. 5, IN SEGES/ME n 65/2021', margin, currentY);
  currentY += 5;
  doc.text('Parametros para pesquisa de precos: Contratacoes similares da Administracao Publica', margin + 5, currentY);

  currentY += 8;
  doc.text('Art. 6, IN SEGES/ME n 65/2021', margin, currentY);
  currentY += 5;
  doc.text(`Metodo: ${traduzirMetodo(dados.metodoCalculo)} com ${dados.totalRegistros} precos (minimo 3 exigido)`, margin + 5, currentY);
}

function adicionarRodape(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number) {
  const y = 30;
  const boxW = doc.internal.pageSize.getWidth() - 2 * margin;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('CONCLUSÃO', margin, y);

  doc.setFontSize(9);
  const conclusao = `O valor estimado de ${formatarMoeda(dados.precoEstimado)} reflete adequadamente o mercado praticado pela Administracao Publica para este objeto, conforme exigido pela Lei n 14.133/2021 e regulamentado pela IN SEGES/ME n 65/2021.`;
  doc.text(conclusao, margin, y + 10, { maxWidth: boxW });

  let footerY = y + 35;
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);

  doc.text('Relatorio Gerado por: Inteligencia PNCP', margin, footerY);
  footerY += 5;
  doc.text(`Data de Emissao: ${formatarData(new Date())} as ${new Date().toLocaleTimeString('pt-BR')}`, margin, footerY);
  footerY += 5;
  doc.text('Validade: 6 (seis) meses, conforme prazos da IN 65/2021', margin, footerY);
  footerY += 15;

  doc.setFontSize(7);
  doc.text('Relatorio confidencial destinado ao uso interno da Administracao Publica', margin, footerY);
  footerY += 15;

  doc.line(margin, footerY, margin + 80, footerY);
  doc.text('Assinatura / Nome do Gestor', margin, footerY + 5);
}
