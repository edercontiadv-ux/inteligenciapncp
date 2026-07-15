import { PNCPResult } from './pncp-api';

export interface Estatisticas {
  media: number;
  mediana: number;
  moda: number | undefined;
  minimo: number;
  maximo: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  totalItens: number;
  itensComValor: number;
  outliersRemovidos: number;
}

function calcularModa(valores: number[]): number | undefined {
  const freq = new Map<number, number>();
  let maxFreq = 0;
  let moda: number | undefined;
  for (const v of valores) {
    const f = (freq.get(v) || 0) + 1;
    freq.set(v, f);
    if (f > maxFreq) {
      maxFreq = f;
      moda = v;
    }
  }
  return maxFreq > 1 ? moda : undefined;
}

export function calcularEstatisticas(items: PNCPResult[]): Estatisticas {
  const comValor = items.filter((item) => {
    const v = Number(item.valorInicial);
    return !isNaN(v) && isFinite(v) && v > 0;
  });
  const valoresBrutos = comValor.map((item) => Number(item.valorInicial)).sort((a, b) => a - b);

  if (valoresBrutos.length === 0) {
    return {
      media: 0, mediana: 0, moda: undefined, minimo: 0, maximo: 0,
      desvioPadrao: 0, coeficienteVariacao: 0,
      totalItens: items.length, itensComValor: 0, outliersRemovidos: 0,
    };
  }

  let valoresValidos = valoresBrutos;
  let outliersRemovidos = 0;

  if (valoresBrutos.length >= 4) {
    const q1Index = Math.floor(valoresBrutos.length * 0.25);
    const q3Index = Math.floor(valoresBrutos.length * 0.75);
    const q1 = valoresBrutos[q1Index];
    const q3 = valoresBrutos[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    valoresValidos = valoresBrutos.filter(v => v >= lowerBound && v <= upperBound);
    outliersRemovidos = valoresBrutos.length - valoresValidos.length;
    if (valoresValidos.length === 0) {
      valoresValidos = valoresBrutos;
      outliersRemovidos = 0;
    }
  }

  const n = valoresValidos.length;
  const total = valoresValidos.reduce((acc, v) => acc + v, 0);
  const media = total / n;

  let mediana: number;
  const mid = Math.floor(n / 2);
  if (n % 2 === 0) {
    mediana = (valoresValidos[mid - 1] + valoresValidos[mid]) / 2;
  } else {
    mediana = valoresValidos[mid];
  }

  const somaQuadDiffs = valoresValidos.reduce((acc, v) => acc + (v - media) ** 2, 0);
  const variancia = somaQuadDiffs / n;
  const desvioPadrao = Math.sqrt(variancia);
  const coeficienteVariacao = media > 0 ? desvioPadrao / media : 0;

  const moda = calcularModa(valoresValidos);

  return {
    media,
    mediana,
    moda,
    minimo: valoresValidos[0],
    maximo: valoresValidos[n - 1],
    desvioPadrao,
    coeficienteVariacao,
    totalItens: items.length,
    itensComValor: valoresBrutos.length,
    outliersRemovidos,
  };
}
