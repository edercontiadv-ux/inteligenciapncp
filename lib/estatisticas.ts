import { PNCPResult } from './pncp-api';

export interface Estatisticas {
  media: number;
  mediana: number;
  minimo: number;
  maximo: number;
  totalItens: number;
  itensComValor: number;
}

export function calcularEstatisticas(items: PNCPResult[]): Estatisticas {
  const comValor = items.filter(
    (item) => item.valorInicial !== undefined && item.valorInicial !== null && item.valorInicial > 0
  );
  const valores = comValor.map((item) => item.valorInicial!).sort((a, b) => a - b);

  if (valores.length === 0) {
    return { media: 0, mediana: 0, minimo: 0, maximo: 0, totalItens: items.length, itensComValor: 0 };
  }

  const total = valores.reduce((acc, v) => acc + v, 0);
  const media = total / valores.length;

  let mediana: number;
  const mid = Math.floor(valores.length / 2);
  if (valores.length % 2 === 0) {
    mediana = (valores[mid - 1] + valores[mid]) / 2;
  } else {
    mediana = valores[mid];
  }

  return {
    media,
    mediana,
    minimo: valores[0],
    maximo: valores[valores.length - 1],
    totalItens: items.length,
    itensComValor: valores.length,
  };
}
