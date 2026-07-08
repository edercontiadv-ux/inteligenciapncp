export interface ResultadoItem {
  id: string;
  tipo: 'CONTRATO' | 'ATA';
  numero: string;
  dataContrato: string;
  orgao: string;
  uf: string;
  objeto: string;
  valorUnitario?: number;
  valorTotal: number;
  dataInicio: string;
  linkPDF: string;
  fonte: string;
  dataConsulta: string;
}

export interface DadosRelatorioPesquisa {
  objetoPesquisa: string;
  termosBusca: string[];
  dataSolicitacao: Date;
  dataConsulta: Date;
  horaConsulta: string;
  periodoInicial: Date;
  periodoFinal: Date;

  orgaoSolicitante?: string;
  servidorResponsavel?: string;
  emailResponsavel?: string;

  fonte: 'PNCP' | 'COMPRAS_GOV' | 'PAINEL_PRECOS' | 'MISTO';
  urlConsulta: string;

  listaResultados: ResultadoItem[];
  totalRegistros: number;
  registrosComValor: number;
  registrosSemValor: number;

  valorMinimo: number;
  valorMaximo: number;
  valorMedio: number;
  mediana: number;
  modaValor?: number;
  desvioPadrao: number;
  coeficienteVariacao: number;

  metodoCalculo: 'media' | 'mediana' | 'menor_valor';
  precoEstimado: number;
  margemAdicionada: number;
  justificativaMetodo: string;

  observacoes: string;
  distribuicaoPorUF: Record<string, number>;
  distribuicaoPorTipo: { CONTRATO: number; ATA: number };

  precoMaximoSugerido: number;
  precoMinimoSugerido: number;
  recomendacoes: string[];

  validadadeRelatorioDias: number;
}

export class GeradorRelatorioPesquisa {
  private dados: DadosRelatorioPesquisa;

  constructor(dados: DadosRelatorioPesquisa) {
    this.dados = dados;
    this.validarDados();
  }

  private validarDados(): void {
    if (this.dados.totalRegistros < 3) {
      throw new Error(
        'IN 65/2021 Art. 6º: Mínimo de 3 preços necessários para cálculo estatístico'
      );
    }
    if (!this.dados.fonte) {
      throw new Error('Fonte de dados obrigatória');
    }
    if (!this.dados.metodoCalculo) {
      throw new Error('Método de cálculo obrigatório');
    }
  }

  getDados(): DadosRelatorioPesquisa {
    return { ...this.dados };
  }

  gerarJSON(): string {
    return JSON.stringify(this.dados, null, 2);
  }
}
