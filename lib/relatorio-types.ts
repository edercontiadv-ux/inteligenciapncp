export interface OrgaoSolicitante {
  nome: string;
  cnpj: string;
}

export interface ServidorResponsavel {
  nome: string;
  matricula: string;
  cpf?: string;
}

export interface FonteConsulta {
  nome: string;
  url: string;
  dataAcesso: Date;
  periodo?: string;
}

export interface RegistroDesconsiderado {
  id: string;
  valorOriginal: number;
  motivo: 'INEXEQUIVEL' | 'EXCESSIVO' | 'INCONSISTENTE' | 'OUTRO';
  outroMotivo?: string;
  justificativa: string;
}

export interface ResultadoItem {
  id: string;
  tipo: 'CONTRATO' | 'ATA';
  numero: string;
  dataContrato: string;
  orgao: string;
  uf: string;
  objeto: string;
  valorTotal: number;
  dataInicio: string;
  linkPDF: string;
  fonte: string;
  dataConsulta: string;
  incluir?: boolean;
}

export interface RelatorioParametros {
  objetoPesquisa: string;
  termosBusca: string;
  dataConsulta: Date;
  horaConsulta: string;
  periodoPesquisa: { inicio: Date; fim: Date };
  orgaoSolicitante: OrgaoSolicitante;
  servidorResponsavel: ServidorResponsavel;
  numeroProcesso?: string;

  parametrosUtilizados: Array<'I' | 'II' | 'III' | 'IV' | 'V'>;
  justificativaParametros: string;
  multiplosParametros: boolean;
  fontes: FonteConsulta[];

  registros: ResultadoItem[];
  registrosDesconsiderados: RegistroDesconsiderado[];

  metodoPrecoEstimado: 'media' | 'mediana' | 'menor' | 'outro';
  justificativaMetodo: string;
  precoEstimado: number;

  analiseCritica: string;
  recomendacoes: string[];

  dataEmissao: Date;
  assinanteNome: string;
  assinanteCargo: string;
}

export interface EstatisticasCalculadas {
  totalRegistros: number;
  registrosComValor: number;
  registrosSemValor: number;
  valorMinimo: number;
  valorMaximo: number;
  valorMedio: number;
  mediana: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  moda?: number;
  amplitude: number;
}

export interface SugestaoMetodo {
  metodo: 'media' | 'mediana' | 'menor';
  justificativa: string;
  preco: number;
}

export interface ValidacaoRelatorio {
  valido: boolean;
  erros: string[];
  avisos: string[];
}
