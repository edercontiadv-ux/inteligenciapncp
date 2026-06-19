import { PNCPResult } from './pncp-api';

export interface Estatisticas {
  media: number;
  mediana: number;
  minimo: number;
  maximo: number;
  totalItens: number;
  itensComValor: number;
  outliersRemovidos: number;
}

export function calcularEstatisticas(items: PNCPResult[]): Estatisticas {
  const comValor = items.filter(
    (item) => item.valorInicial !== undefined && item.valorInicial !== null && item.valorInicial > 0
  );
  const valoresBrutos = comValor.map((item) => item.valorInicial!).sort((a, b) => a - b);

  if (valoresBrutos.length === 0) {
    return { media: 0, mediana: 0, minimo: 0, maximo: 0, totalItens: items.length, itensComValor: 0, outliersRemovidos: 0 };
  }

  // Identificar outliers usando IQR (Intervalo Interquartil)
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
    
    // Fallback se a remoção de outliers esvaziar a lista (muito improvável, mas seguro)
    if (valoresValidos.length === 0) {
       valoresValidos = valoresBrutos;
       outliersRemovidos = 0;
    }
  }

  const total = valoresValidos.reduce((acc, v) => acc + v, 0);
  const media = total / valoresValidos.length;

  let mediana: number;
  const mid = Math.floor(valoresValidos.length / 2);
  if (valoresValidos.length % 2 === 0) {
    mediana = (valoresValidos[mid - 1] + valoresValidos[mid]) / 2;
  } else {
    mediana = valoresValidos[mid];
  }

  return {
    media,
    mediana,
    minimo: valoresValidos[0],
    maximo: valoresValidos[valoresValidos.length - 1],
    totalItens: items.length,
    itensComValor: valoresBrutos.length,
    outliersRemovidos,
  };
}
