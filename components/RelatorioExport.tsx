'use client';

import { PNCPResult } from '@/lib/pncp-api';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calcularEstatisticas } from '@/lib/estatisticas';

interface RelatorioExportProps {
  selectedResults: PNCPResult[];
  termoBusca: string;
}

export default function RelatorioExport({ selectedResults, termoBusca }: RelatorioExportProps) {
  const exportPDF = () => {
    try {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('pt-BR');

    doc.setFontSize(18);
    doc.text('Relatório de Pesquisa de Preços - PNCP', 14, 22);

    doc.setFontSize(11);
    doc.text(`Termo de busca: ${termoBusca}`, 14, 32);
    doc.text(`Data da consulta: ${now}`, 14, 38);
    doc.text(`Base legal: Art. 23, Lei nº 14.133/2021`, 14, 44);

    const tableData = selectedResults.map(item => [
      item.tipo === 'CONTRATO' ? `Contrato ${item.numeroContrato}/${item.anoContrato}` : `Ata ${item.numeroAtaRegistroPreco}/${item.anoAta}`,
      item.orgaoEntidade?.razaoSocial || item.unidadeOrgao?.nomeUnidade || '—',
      item.unidadeOrgao?.ufSigla || '—',
      item.valorInicial ? item.valorInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-',
      item.dataVigenciaInicio ? new Date(item.dataVigenciaInicio).toLocaleDateString('pt-BR') : '—'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Identificação', 'Órgão', 'UF', 'Valor', 'Data Início']],
      body: tableData,
    });

    const stats = calcularEstatisticas(selectedResults);

    const finalY = (doc as any).lastAutoTable?.cursor?.y ? (doc as any).lastAutoTable.cursor.y + 10 : 50;
    doc.setFontSize(12);
    
    let textoMedia = `Preço Médio (${stats.itensComValor} itens com valor): ${stats.media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    if (stats.outliersRemovidos > 0) {
      textoMedia += ` | * ${stats.outliersRemovidos} valores extremos ignorados (Regra TCU)`;
    }
    
    doc.text(textoMedia, 14, finalY);

    doc.save(`relatorio-pesquisa-${termoBusca.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    }
  };

  return (
    <button
      onClick={exportPDF}
      disabled={selectedResults.length === 0}
      className="btn-secondary text-xs px-4 py-2"
    >
      <FileDown className="mr-1.5 h-4 w-4" />
      Exportar ({selectedResults.length})
    </button>
  );
}
