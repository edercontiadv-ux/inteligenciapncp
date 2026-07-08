export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR');
}

export function formatarPercentual(valor: number): string {
  return `${(valor * 100).toFixed(1).replace('.', ',')}%`;
}

export function traduzirMetodo(metodo: string): string {
  const traducoes: Record<string, string> = {
    media: 'Média Aritmética',
    mediana: 'Mediana',
    menor_valor: 'Menor Valor',
  };
  return traducoes[metodo] || metodo;
}

export function truncate(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  return texto.substring(0, max).trimEnd() + '…';
}
