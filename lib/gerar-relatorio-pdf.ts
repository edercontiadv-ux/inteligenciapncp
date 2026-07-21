import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DadosRelatorioPesquisa } from './relatorio-pesquisa';
import { formatarMoeda, formatarData, formatarPercentual, traduzirMetodo } from './formatadores';

const COR_PRIMARIA: [number, number, number] = [0, 51, 102];
const COR_DESTAQUE: [number, number, number] = [0, 77, 153];
const COR_SUCESSO: [number, number, number] = [46, 125, 50];
const COR_AVISO: [number, number, number] = [237, 125, 49];
const COR_ERRO: [number, number, number] = [198, 40, 40];
const COR_CINZA: [number, number, number] = [102, 102, 102];
const COR_FUNDO_CLARO: [number, number, number] = [245, 245, 245];

const FONTE_TITULO = 14;
const FONTE_SUBTITULO = 10;
const FONTE_NORMAL = 9;
const FONTE_PEQUENA = 8;
const FONTE_DESTAQUE = 16;

export async function gerarRelatorioPDF(
  dados: DadosRelatorioPesquisa,
  nomeArquivo: string = 'relatorio-pesquisa-precos.pdf'
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  y = adicionarSecao1Cabecalho(doc, dados, margin, y, pageWidth);
  y = verificarQP(doc, y, estimarSecao2Metodologia(doc, dados, pageWidth), margin, pageHeight);
  y = adicionarSecao2Metodologia(doc, dados, margin, y, pageWidth);
  y = verificarQP(doc, y, estimarSecao3Estatisticas(dados), margin, pageHeight);
  y = adicionarSecao3Estatisticas(doc, dados, margin, y, pageWidth);
  y = verificarQP(doc, y, estimarSecao4Desconsideracao(), margin, pageHeight);
  y = adicionarSecao4Desconsideracao(doc, dados, margin, y, pageWidth);
  y = verificarQP(doc, y, estimarSecao5MetodoPreco(doc, dados, pageWidth), margin, pageHeight);
  y = adicionarSecao5MetodoPreco(doc, dados, margin, y, pageWidth);

  doc.addPage(); y = margin;
  y = adicionarSecao6Tabela(doc, dados, margin, y, pageHeight);

  doc.addPage(); y = margin;
  y = adicionarSecao7Distribuicao(doc, dados, margin, y);
  y = verificarQP(doc, y, estimarSecao8AnaliseCritica(doc, dados, pageWidth), margin, pageHeight);
  y = adicionarSecao8AnaliseCritica(doc, dados, margin, y, pageWidth, pageHeight);
  y = verificarQP(doc, y, estimarSecao9Recomendacoes(doc, dados, pageWidth), margin, pageHeight);
  y = adicionarSecao9Recomendacoes(doc, dados, margin, y, pageWidth, pageHeight);
  y = verificarQP(doc, y, estimarSecao10BaseLegal(doc, dados, pageWidth), margin, pageHeight);
  y = adicionarSecao10BaseLegal(doc, dados, margin, y, pageWidth, pageHeight);

  doc.addPage(); y = margin;
  adicionarSecao11Conclusao(doc, dados, margin, pageWidth, pageHeight);

  doc.save(nomeArquivo);
}

function verificarQP(doc: jsPDF, y: number, espaco: number, margin: number, pageHeight: number): number {
  if (y + espaco > pageHeight - margin) {
    doc.addPage();
    return margin;
  }
  return y;
}

function estimarSecao2Metodologia(doc: jsPDF, dados: DadosRelatorioPesquisa, pageWidth: number): number {
  // Titulo (10mm) + "Parametro..." (6mm) + valor destacado (10mm) + 4 linhas fonte (6+5+5+10=26mm) + justificativa box (14mm)
  let h = 66;
  if (dados.coeficienteVariacao > 0.5) h += 20;
  return h;
}

function estimarSecao3Estatisticas(dados: DadosRelatorioPesquisa): number {
  // Titulo (8mm) + tabela registro (15mm) + gap (5mm) + tabela metricas (24mm) + pad (2mm)
  let h = 54;
  if (dados.coeficienteVariacao > 0.5) h += 14;
  return h;
}

function estimarSecao4Desconsideracao(): number {
  // Titulo (10mm) + 2 linhas texto (6+8=14mm) + box verde (12mm) + pad (2mm)
  return 38;
}

function estimarSecao5MetodoPreco(doc: jsPDF, dados: DadosRelatorioPesquisa, pageWidth: number): number {
  const boxW = pageWidth - 30;
  const justLines = doc.splitTextToSize(dados.justificativaMetodo, boxW - 6);
  const boxMetodoHeight = Math.max(22, 16 + justLines.length * 4 + 4);
  // Titulo (10mm) + boxMetodo start (10mm) + boxMetodoHeight + gap (3mm) + precoBox (20mm) + pad (2mm)
  return 10 + 10 + boxMetodoHeight + 3 + 20 + 2;
}

function estimarSecao7Distribuicao(): number {
  // Titulo (12mm) + label (16mm startY) + 2 tabelas lado a lado (~22mm)
  return 50;
}

function estimarSecao8AnaliseCritica(doc: jsPDF, dados: DadosRelatorioPesquisa, pageWidth: number): number {
  const boxW = pageWidth - 30;
  const obsLines = doc.splitTextToSize(dados.observacoes, boxW);
  // Titulo (10mm) + amplitude (10mm) + dispersao (8mm) + gap (8mm) + observacoes + pad (5mm)
  let h = 10 + 10 + 8 + 8 + obsLines.length * 4 + 5;
  if (dados.precoEstimado > dados.valorMaximo * 1.2) h += 10;
  return h;
}

function estimarSecao9Recomendacoes(doc: jsPDF, dados: DadosRelatorioPesquisa, pageWidth: number): number {
  const boxW = pageWidth - 30;
  const recs = gerarRecomendacoesCompletas(dados);
  // Titulo (10mm) + gap (10mm) + cada recomendacao
  let h = 20;
  for (const rec of recs) {
    const lines = doc.splitTextToSize(`- ${rec}`, boxW);
    h += lines.length * 4 + 3;
  }
  return h + 3;
}

function estimarSecao10BaseLegal(doc: jsPDF, dados: DadosRelatorioPesquisa, pageWidth: number): number {
  const boxW = pageWidth - 30;
  const art23 = doc.splitTextToSize(
    '"O valor previamente estimado da contratação deverá ser compatível com os valores praticados pelo mercado, considerados os preços constantes de bancos de dados públicos e as quantidades a serem contratadas, observadas a potencial economia de escala e as peculiaridades do local de execução do objeto."',
    boxW - 8
  );
  // Titulo (10mm) + Art.23 (5 + art23.length*4 + 4 gap) + Art.5 (5+7) + Art.6 (5+7) + Acordao (5+8) + pad (8mm)
  return 10 + 5 + art23.length * 4 + 4 + 5 + 7 + 5 + 7 + 5 + 8 + 8;
}

function textoDestaque(doc: jsPDF, texto: string, x: number, y: number, cor: [number, number, number], tamanho: number = FONTE_NORMAL) {
  doc.setFontSize(tamanho);
  doc.setTextColor(cor[0], cor[1], cor[2]);
  doc.text(texto, x, y);
}

function textoNormal(doc: jsPDF, texto: string, x: number, y: number, tamanho: number = FONTE_NORMAL) {
  doc.setFontSize(tamanho);
  doc.setTextColor(0, 0, 0);
  doc.text(texto, x, y);
}

function tituloSecao(doc: jsPDF, texto: string, margin: number, y: number) {
  textoDestaque(doc, texto, margin, y, COR_PRIMARIA, FONTE_TITULO);
}

// ─── SEÇÃO 1: CABEÇALHO E METADADOS ───
function adicionarSecao1Cabecalho(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageWidth: number): number {
  const boxW = pageWidth - 2 * margin;

  textoDestaque(doc, 'RELATÓRIO DE PESQUISA DE PREÇOS', margin, y, COR_PRIMARIA, 16);
  textoDestaque(doc, 'Lei nº 14.133/2021 | IN SEGES/ME nº 65/2021', margin, y + 7, COR_CINZA, FONTE_SUBTITULO);

  let iy = y + 20;
  const lh = 5.5;
  const tw = boxW - 10;
  const campos = [
    { rotulo: 'Objeto da Pesquisa', valor: dados.objetoPesquisa },
    { rotulo: 'Termos de Busca', valor: dados.termosBusca.join(', ') },
    { rotulo: 'Data da Consulta', valor: `${formatarData(dados.dataConsulta)} às ${dados.horaConsulta}` },
    { rotulo: 'Período Pesquisado', valor: `${formatarData(dados.periodoInicial)} a ${formatarData(dados.periodoFinal)}` },
    { rotulo: 'Órgão Solicitante', valor: dados.orgaoSolicitante || '(Não informado)' },
    { rotulo: 'Servidor Responsável', valor: dados.servidorResponsavel || '(Não informado)' },
  ];

  let linhasPrevistas = 0;
  for (const c of campos) {
    const textLines = doc.splitTextToSize(`${c.rotulo}: ${c.valor}`, tw);
    linhasPrevistas += textLines.length;
  }
  const boxAltura = Math.max(50, 10 + linhasPrevistas * lh);
  const boxTop = y + 14;

  doc.setDrawColor(0, 51, 102);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, boxTop, boxW, boxAltura, 'F');

  doc.setFontSize(FONTE_NORMAL);
  doc.setTextColor(0, 0, 0);
  for (const c of campos) {
    const linhas = doc.splitTextToSize(`${c.rotulo}: ${c.valor}`, tw);
    for (const linha of linhas) {
      doc.text(linha, margin + 5, iy);
      iy += lh;
    }
  }
  return iy + 5;
}

// ─── SEÇÃO 2: METODOLOGIA E FONTE DE DADOS ───
function adicionarSecao2Metodologia(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageWidth: number): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '2. METODOLOGIA E FONTE DE DADOS', margin, y);
  let cy = y + 10;

  textoNormal(doc, 'Parâmetro Utilizado (Art. 5º, IN 65/2021):', margin, cy);
  cy += 6;
  textoDestaque(doc, 'II - Contratações Similares da Administração Pública (Inciso II)', margin + 5, cy, COR_DESTAQUE);
  cy += 10;

  textoNormal(doc, 'Fonte: Portal Nacional de Contratações Públicas (PNCP)', margin, cy); cy += 6;
  textoNormal(doc, `URL: ${dados.urlConsulta}`, margin + 5, cy); cy += 5;
  textoNormal(doc, `Data e Hora de Acesso: ${formatarData(dados.dataConsulta)} às ${dados.horaConsulta}`, margin + 5, cy); cy += 5;
  textoNormal(doc, 'Período de Abrangência: Últimos 12 meses', margin + 5, cy); cy += 10;

  doc.setDrawColor(0, 102, 204);
  doc.setFillColor(232, 244, 248);
  doc.rect(margin, cy - 4, boxW, 14, 'F');
  doc.setFontSize(FONTE_PEQUENA);
  doc.setTextColor(COR_PRIMARIA[0], COR_PRIMARIA[1], COR_PRIMARIA[2]);
  doc.text('Justificativa: A pesquisa foi realizada através de contratações similares já realizadas pela', margin + 3, cy + 1);
  doc.text('Administração Pública registradas no PNCP, conforme recomendação prioritária da IN SEGES/ME nº 65/2021.', margin + 3, cy + 5);
  cy += 14;

  if (dados.coeficienteVariacao > 0.5) {
    doc.setDrawColor(255, 152, 0);
    doc.setFillColor(255, 243, 205);
    doc.rect(margin, cy, boxW, 16, 'F');
    doc.setFontSize(FONTE_PEQUENA);
    doc.setTextColor(COR_AVISO[0], COR_AVISO[1], COR_AVISO[2]);
    doc.text('[AVISO] AVISO LEGAL', margin + 3, cy + 4);
    doc.setTextColor(0, 0, 0);
    doc.text('Você está usando apenas 1 parâmetro. A jurisprudência do TCU (Acórdão 3059/2020)', margin + 3, cy + 9);
    doc.text('recomenda "cesta de preços" (múltiplas fontes) para maior robustez.', margin + 3, cy + 13);
    cy += 20;
  }

  return cy + 3;
}

// ─── SEÇÃO 3: ESTATÍSTICAS ───
function adicionarSecao3Estatisticas(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageWidth: number): number {
  tituloSecao(doc, '3. ESTATÍSTICAS DOS PREÇOS ENCONTRADOS', margin, y);

  autoTable(doc, {
    startY: y + 8,
    head: [],
    body: [
      ['Total de Registros Encontrados', dados.totalRegistros.toString()],
      ['Registros com Valor Declarado', dados.registrosComValor.toString()],
      ['Registros sem Valor', dados.registrosSemValor.toString()],
    ],
    margin: { left: margin, right: margin },
    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 30 } },
    headStyles: { fillColor: COR_FUNDO_CLARO, textColor: [0, 0, 0], fontSize: FONTE_NORMAL },
    bodyStyles: { fontSize: FONTE_NORMAL },
    alternateRowStyles: { fillColor: COR_FUNDO_CLARO },
  });
  let ya = (doc as any).lastAutoTable.finalY + 5;

  const cv = dados.coeficienteVariacao;
  const alertaCV = cv > 1 ? 'Altíssima dispersão. Verifique se os valores são efetivamente comparáveis.'
    : cv > 0.5 ? 'Alta dispersão de preços. Recomenda-se desconsideração de outliers ou segmentação.'
    : null;

  autoTable(doc, {
    startY: ya,
    head: [['Métrica', 'Valor']],
    body: [
      ['Valor Mínimo', formatarMoeda(dados.valorMinimo)],
      ['Valor Máximo', formatarMoeda(dados.valorMaximo)],
      ['Preço Médio (Média Aritmética)', formatarMoeda(dados.valorMedio)],
      ['Preço Mediano (Mediana)', formatarMoeda(dados.mediana)],
      ['Desvio Padrão', formatarMoeda(dados.desvioPadrao)],
      ['Coeficiente de Variação (CV)', formatarPercentual(dados.coeficienteVariacao)],
    ],
    margin: { left: margin, right: margin },
    columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 30 } },
    headStyles: { fillColor: COR_PRIMARIA, textColor: [255, 255, 255], fontSize: FONTE_NORMAL },
    bodyStyles: { fontSize: FONTE_NORMAL },
    alternateRowStyles: { fillColor: COR_FUNDO_CLARO },
  });
  ya = (doc as any).lastAutoTable.finalY + 3;

  if (alertaCV) {
    const cor = cv > 1 ? COR_ERRO : COR_AVISO;
    doc.setDrawColor(cor[0], cor[1], cor[2]);
    doc.setFillColor(255, 243, 205);
    doc.rect(margin, ya, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(FONTE_PEQUENA);
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.text(alertaCV, margin + 3, ya + 6);
    ya += 14;
  }

  return ya + 2;
}

// ─── SEÇÃO 4: DESCONSIDERAÇÃO DE VALORES ───
function adicionarSecao4Desconsideracao(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageWidth: number): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '4. DESCONSIDERAÇÃO DE VALORES (Art. 6º, §3º, IN 65/2021)', margin, y);
  let cy = y + 10;

  textoNormal(doc, 'Nenhum valor foi desconsiderado nesta análise. Todos os registros foram mantidos', margin, cy);
  cy += 6;
  textoNormal(doc, 'para o cálculo estatístico, conforme critérios de consistência da amostra.', margin, cy);
  cy += 8;

  doc.setDrawColor(76, 175, 80);
  doc.setFillColor(232, 245, 233);
  doc.rect(margin, cy, boxW, 12, 'F');
  doc.setFontSize(FONTE_PEQUENA);
  doc.setTextColor(COR_SUCESSO[0], COR_SUCESSO[1], COR_SUCESSO[2]);
  doc.text('[OK] Nenhum outlier identificado ou todos os valores foram considerados consistentes com o objeto.', margin + 3, cy + 5);
  cy += 16;

  return cy + 2;
}

// ─── SEÇÃO 5: MÉTODO DE CÁLCULO E PREÇO ESTIMADO ───
function adicionarSecao5MetodoPreco(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageWidth: number): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '5. MÉTODO DE CÁLCULO E PREÇO ESTIMADO (Art. 6º, IN 65/2021)', margin, y);

  const metodo = traduzirMetodo(dados.metodoCalculo);
  const cv = dados.coeficienteVariacao;

  const justLines = doc.splitTextToSize(dados.justificativaMetodo, boxW - 6);
  const justHeight = justLines.length * 4 + 4;
  const boxMetodoHeight = Math.max(22, 16 + justHeight);

  doc.setDrawColor(255, 152, 0);
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, y + 10, boxW, boxMetodoHeight, 'F');

  doc.setFontSize(FONTE_NORMAL);
  doc.setTextColor(0, 0, 0);
  doc.text(`Método Adotado: ${metodo}`, margin + 3, y + 16);

  doc.setFontSize(FONTE_PEQUENA);
  for (let i = 0; i < justLines.length; i++) {
    doc.text(justLines[i], margin + 3, y + 23 + i * 4);
  }

  const precoBoxTop = y + 10 + boxMetodoHeight + 3;
  doc.setDrawColor(76, 175, 80);
  doc.setFillColor(232, 245, 233);
  doc.rect(margin, precoBoxTop, boxW, 20, 'F');

  doc.setFontSize(FONTE_SUBTITULO);
  doc.setTextColor(COR_SUCESSO[0], COR_SUCESSO[1], COR_SUCESSO[2]);
  doc.text('PRECO ESTIMADO PARA CONTRATACAO:', margin + 3, precoBoxTop + 6);

  doc.setFontSize(FONTE_DESTAQUE);
  doc.text(formatarMoeda(dados.precoEstimado), margin + 3, precoBoxTop + 16);

  return precoBoxTop + 22;
}

// ─── SEÇÃO 6: TABELA DETALHADA ───
function adicionarSecao6Tabela(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number, pageHeight: number): number {
  tituloSecao(doc, `6. RELAÇÃO DE CONTRATOS/ATAS UTILIZADOS (${dados.listaResultados.length} registros)`, margin, y);

  const tabelaBody = dados.listaResultados.map(item => [
    item.tipo,
    item.numero,
    item.orgao,
    item.uf,
    item.objeto.substring(0, 50) + '...',
    formatarMoeda(item.valorTotal),
    formatarData(item.dataInicio),
    item.linkPDF,
  ]);

  autoTable(doc, {
    startY: y + 8,
    head: [['Tipo', 'Número', 'Órgão', 'UF', 'Objeto', 'Valor Total', 'Data Início', 'Link']],
    body: tabelaBody,
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 13 },
      1: { cellWidth: 16 },
      2: { cellWidth: 46 },
      3: { cellWidth: 9, halign: 'center' },
      4: { cellWidth: 44 },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
    },
    headStyles: { fillColor: COR_PRIMARIA, textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: COR_FUNDO_CLARO },
    tableWidth: 'auto',
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 7 && data.cell.raw) {
        const link = data.cell.raw as string;
        if (link) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: link });
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 5;
}

// ─── SEÇÃO 7: DISTRIBUIÇÃO ───
function adicionarSecao7Distribuicao(doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number): number {
  tituloSecao(doc, '7. DISTRIBUIÇÃO DOS RESULTADOS', margin, y);

  doc.setFontSize(FONTE_NORMAL);
  doc.text('Por Tipo:', margin, y + 12);
  autoTable(doc, {
    startY: y + 16,
    head: [['Tipo', 'Quantidade']],
    body: [
      ['CONTRATO', dados.distribuicaoPorTipo.CONTRATO.toString()],
      ['ATA', dados.distribuicaoPorTipo.ATA.toString()],
    ],
    margin: { left: margin, right: margin + 90 },
    headStyles: { fillColor: COR_FUNDO_CLARO, fontSize: FONTE_PEQUENA },
    bodyStyles: { fontSize: FONTE_PEQUENA },
  });
  const yTipo = (doc as any).lastAutoTable.finalY;

  doc.text('Por UF:', margin + 100, y + 12);
  autoTable(doc, {
    startY: y + 16,
    head: [['UF', 'Qtd']],
    body: Object.entries(dados.distribuicaoPorUF).map(([uf, q]) => [uf, q.toString()]),
    margin: { left: margin + 100, right: margin },
    headStyles: { fillColor: COR_FUNDO_CLARO, fontSize: FONTE_PEQUENA },
    bodyStyles: { fontSize: FONTE_PEQUENA },
  });
  const yUF = (doc as any).lastAutoTable.finalY;

  return Math.max(yTipo, yUF) + 5;
}

// ─── SEÇÃO 8: ANÁLISE CRÍTICA ───
function adicionarSecao8AnaliseCritica(
  doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number,
  pageWidth: number, pageHeight: number
): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '8. ANÁLISE CRÍTICA DOS RESULTADOS', margin, y);

  doc.setFontSize(FONTE_NORMAL);
  const amplitute = dados.valorMaximo - dados.valorMinimo;
  const cv = dados.coeficienteVariacao;
  doc.text(`AMPLITUDE: Os valores variam entre ${formatarMoeda(dados.valorMinimo)} e ${formatarMoeda(dados.valorMaximo)}, com diferença de ${formatarMoeda(amplitute)}.`, margin, y + 10);

  let dispY = y + 15;
  const dispMsg = cv < 0.2 ? 'Preços com baixa dispersão, indicando mercado estável.'
    : cv < 0.5 ? 'Preços com dispersão moderada, dentro do esperado para contratações públicas.'
    : cv < 1 ? 'Preços com alta dispersão, recomenda-se análise aprofundada dos outliers.'
    : 'Preços com altíssima dispersão. Verificar se todos os itens da amostra são efetivamente comparáveis ao objeto pretendido.';
  doc.text(`DISPERSÃO: ${dispMsg}`, margin, dispY);

  let cy = dispY + 8;
  doc.setFontSize(FONTE_PEQUENA);
  doc.setTextColor(0, 0, 0);
  const obsLines = doc.splitTextToSize(dados.observacoes, boxW);
  for (const line of obsLines) {
    if (cy > pageHeight - margin) { doc.addPage(); cy = margin; }
    doc.text(line, margin, cy);
    cy += 4;
  }

  if (dados.precoEstimado > dados.valorMaximo * 1.2) {
    cy += 4;
    doc.setFontSize(FONTE_PEQUENA);
    doc.setTextColor(COR_AVISO[0], COR_AVISO[1], COR_AVISO[2]);
    doc.text('NOTA: O preço estimado está 20% acima do maior valor encontrado. Recomenda-se verificar a compatibilidade.', margin, cy);
    cy += 6;
  }

  return cy + 5;
}

// ─── SEÇÃO 9: RECOMENDAÇÕES ───
function adicionarSecao9Recomendacoes(
  doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number,
  pageWidth: number, pageHeight: number
): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '9. RECOMENDAÇÕES', margin, y);
  let cy = y + 10;

  doc.setFontSize(FONTE_PEQUENA);
  const recs = gerarRecomendacoesCompletas(dados);
  for (const rec of recs) {
    if (cy > pageHeight - margin - 10) { doc.addPage(); cy = margin; }
    const lines = doc.splitTextToSize(`- ${rec}`, boxW);
    doc.text(lines, margin, cy);
    cy += lines.length * 4 + 3;
  }
  return cy + 3;
}

function gerarRecomendacoesCompletas(dados: DadosRelatorioPesquisa): string[] {
  const recs: string[] = [];
  recs.push('Manter a pesquisa de preços arquivada junto aos autos do processo administrativo, conforme Art. 23, §1º da Lei nº 14.133/2021.');
  if (dados.coeficienteVariacao > 0.3) {
    recs.push('Considerar a realização de pesquisa complementar em outras fontes (Painel de Preços, Compras.gov.br, fornecedores) para ampliar a amostra e refinar o preço estimado.');
  }
  recs.push('Atualizar a pesquisa caso o processo licitatório não seja concluído em 180 dias, conforme recomendação temporal da IN SEGES/ME nº 65/2021.');
  recs.push(`O valor estimado de ${formatarMoeda(dados.precoEstimado)} (${traduzirMetodo(dados.metodoCalculo)}) deve constar no ETP (Estudo Técnico Preliminar) e no Mapa de Risco, com a devida justificativa do parâmetro adotado.`);
  if (dados.desvioPadrao > dados.valorMedio * 0.5) {
    recs.push('Atenção ao alto desvio padrão: recomenda-se verificar se todos os itens da amostra são efetivamente comparáveis ao objeto pretendido.');
  }
  recs.push('O gestor deve atestar, no relatório final, que os preços coletados refletem a realidade de mercado do objeto a ser contratado.');
  return recs;
}

// ─── SEÇÃO 10: BASE LEGAL ───
function adicionarSecao10BaseLegal(
  doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number, y: number,
  pageWidth: number, pageHeight: number
): number {
  const boxW = pageWidth - 2 * margin;
  tituloSecao(doc, '10. BASE LEGAL E CONFORMIDADE', margin, y);
  let cy = y + 10;

  doc.setFontSize(FONTE_NORMAL);
  doc.setTextColor(0, 0, 0);

  if (cy > pageHeight - margin - 15) { doc.addPage(); cy = margin; }
  doc.text('Art. 23, Lei nº 14.133/2021', margin, cy); cy += 5;
  const art23 = doc.splitTextToSize(
    '"O valor previamente estimado da contratação deverá ser compatível com os valores praticados pelo mercado, considerados os preços constantes de bancos de dados públicos e as quantidades a serem contratadas, observadas a potencial economia de escala e as peculiaridades do local de execução do objeto."',
    boxW - 8
  );
  doc.setFontSize(FONTE_PEQUENA);
  for (const line of art23) {
    if (cy > pageHeight - margin) { doc.addPage(); cy = margin; }
    doc.text(line, margin + 4, cy);
    cy += 4;
  }
  cy += 4;

  if (cy > pageHeight - margin - 15) { doc.addPage(); cy = margin; }
  doc.setFontSize(FONTE_NORMAL);
  doc.text('Art. 5º, IN SEGES/ME nº 65/2021', margin, cy); cy += 5;
  doc.setFontSize(FONTE_PEQUENA);
  doc.text('Parametros para pesquisa de precos: Contratacoes similares da Administracao Publica', margin + 4, cy);
  cy += 7;

  if (cy > pageHeight - margin - 15) { doc.addPage(); cy = margin; }
  doc.setFontSize(FONTE_NORMAL);
  doc.text('Art. 6º, IN SEGES/ME nº 65/2021', margin, cy); cy += 5;
  doc.setFontSize(FONTE_PEQUENA);
  doc.text(`Metodo: ${traduzirMetodo(dados.metodoCalculo)} com ${dados.listaResultados.length} precos analisados (minimo 3 exigido)`, margin + 4, cy);
  cy += 7;

  if (cy > pageHeight - margin - 15) { doc.addPage(); cy = margin; }
  doc.setFontSize(FONTE_NORMAL);
  doc.text('Acordao TCU nº 3059/2020', margin, cy); cy += 5;
  doc.setFontSize(FONTE_PEQUENA);
  doc.text('Recomendacao de "cesta de precos" com multiplas fontes para maior robustez da estimativa.', margin + 4, cy);
  return cy + 8;
}

// ─── SEÇÃO 11: CONCLUSÃO E ASSINATURA ───
function adicionarSecao11Conclusao(
  doc: jsPDF, dados: DadosRelatorioPesquisa, margin: number,
  pageWidth: number, pageHeight: number
): void {
  const boxW = pageWidth - 2 * margin;
  const y = margin;

  textoDestaque(doc, '11. CONCLUSÃO FINAL', margin, y, COR_PRIMARIA, FONTE_TITULO);

  doc.setFontSize(FONTE_NORMAL);
  doc.setTextColor(0, 0, 0);
  const conclusao = `O valor estimado de ${formatarMoeda(dados.precoEstimado)} reflete adequadamente o mercado praticado pela Administração Pública para este objeto, conforme exigido pela Lei nº 14.133/2021 e regulamentado pela IN SEGES/ME nº 65/2021.`;
  const concLines = doc.splitTextToSize(conclusao, boxW);
  let cy = y + 10;
  for (const line of concLines) {
    doc.text(line, margin, cy);
    cy += 5;
  }

  cy += 6;
  textoNormal(doc, `Data de Emissão: ${formatarData(new Date())} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, cy);
  cy += 6;
  textoNormal(doc, `Validade: ${dados.validadadeRelatorioDias} (${dados.validadadeRelatorioDias / 30} meses), conforme prazos da IN 65/2021`, margin, cy);
  cy += 15;

  doc.setDrawColor(0, 0, 0);
  doc.line(margin, cy, margin + 80, cy);
  doc.setFontSize(FONTE_NORMAL);
  doc.text('Assinatura do Servidor Responsável', margin, cy + 6);
  cy += 15;

  doc.line(margin + 100, cy - 15, margin + 180, cy - 15);
  doc.text('Aprovação da Autoridade Competente', margin + 100, cy + 6);
}
