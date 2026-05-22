export interface KnowledgeEntry {
  keywords: string[];
  answer: string;
}

const FAQ: KnowledgeEntry[] = [
  {
    keywords: ['pesquisar', 'buscar', 'como usar', 'como faz', 'iniciar', 'começar'],
    answer: `Para fazer uma pesquisa, digite no campo de texto uma descrição do objeto que deseja contratar (ex: "cadeiras ergonômicas para escritório") e clique em "Buscar no PNCP". A IA vai interpretar sua descrição, extrair termos técnicos e consultar automaticamente a API do PNCP por contratos e atas dos últimos 12 meses.`,
  },
  {
    keywords: ['pncp', 'portal', 'o que é'],
    answer: `PNCP significa Portal Nacional de Contratações Públicas. É a plataforma oficial do Governo Federal brasileiro que reúne todos os contratos, licitações e atas de registro de preços da Administração Pública. A ferramenta consulta a API pública do PNCP para buscar contratos e atas com objetos similares ao que você deseja contratar.`,
  },
  {
    keywords: ['ata', 'atas', 'registro de preços'],
    answer: `Ata de Registro de Preços é um documento formal onde um órgão público registra os preços de produtos ou serviços por um período determinado (geralmente 12 meses). Diferente de um contrato, a ata não garante a compra, mas estabelece preços que podem ser usados por outros órgãos durante sua vigência.`,
  },
  {
    keywords: ['contrato', 'contratos'],
    answer: `Contrato é o documento formal que concretiza uma compra ou serviço entre a Administração Pública e um fornecedor. A ferramenta busca contratos publicados no PNCP nos últimos 12 meses com objetos similares à sua descrição.`,
  },
  {
    keywords: ['filtrar', 'filtro', 'uf', 'estado', 'tipo', 'valor', 'faixa'],
    answer: `Após a pesquisa, você pode filtrar os resultados por:\n\n• **UF (Estado):** Selecione um estado específico para ver apenas contratos/atas daquela região.\n• **Tipo:** Escolha entre "Contrato" ou "Ata de Registro de Preços".\n• **Faixa de valor:** Defina um valor mínimo e máximo para filtrar por preço.\n\nOs filtros aparecem no painel de resultados assim que a busca é concluída.`,
  },
  {
    keywords: ['exportar', 'relatório', 'pdf', 'relatorio'],
    answer: `Para exportar o relatório em PDF:\n\n1. Selecione os resultados desejados clicando nos cards.\n2. Clique em "Exportar Relatório PDF".\n3. O PDF será gerado automaticamente com:\n   • Termo de busca e data\n   • Referência legal (Art. 23, Lei 14.133/2021)\n   • Tabela com os resultados selecionados\n   • Cálculo do preço médio`,
  },
  {
    keywords: ['selecionar', 'seleção', 'múltiplos', 'check', 'checkbox'],
    answer: `Para selecionar resultados, clique no card do contrato ou ata que deseja incluir no relatório. Você pode selecionar múltiplos resultados. Os cards selecionados ficam destacados visualmente.`,
  },
  {
    keywords: ['preço médio', 'preco medio', 'calcular', 'cálculo', 'media'],
    answer: `O preço médio é calculado automaticamente com base nos resultados que você selecionou. A ferramenta soma todos os valores e divide pelo número de registros selecionados. O resultado aparece no relatório PDF exportado.`,
  },
  {
    keywords: ['base legal', 'lei', 'artigo', '14.133', 'fundamento', 'legal'],
    answer: `A pesquisa de preços para contratações públicas é exigida pelo Art. 23 da Lei nº 14.133/2021 (Nova Lei de Licitações). A ferramenta segue também a IN SEGES/MGI nº 65/2021, que regulamenta os procedimentos de pesquisa de preços.\n\nO Art. 23 determina que a Administração deve realizar pesquisa de preços para estimar o valor da contratação, utilizando fontes como PNCP, painel de preços, fornecedores e outros.`,
  },
  {
    keywords: ['12 meses', '12 meses', 'prazo', 'período', 'periodo'],
    answer: `A ferramenta consulta automaticamente apenas contratos e atas publicados nos últimos 12 meses, contados da data atual. Isso está de acordo com as normas de pesquisa de preços (IN SEGES/MGI nº 65/2021), que recomendam que os preços coletados sejam recentes para refletir o mercado atual.`,
  },
  {
    keywords: ['sem resultado', 'nenhum resultado', 'não encontrou', 'vazio', '0 resultados'],
    answer: `Se a busca não retornar resultados, tente:\n\n1. **Descrever o objeto de forma diferente** — Use sinônimos ou termos mais genéricos.\n2. **Termos mais amplos** — Em vez de "cadeira presidente giratória com braços", tente "cadeira escritório".\n3. **Remover filtros** — Se aplicou filtros de UF ou tipo, remova-os para ampliar a busca.\n4. **Verificar o objeto** — Alguns objetos muito específicos podem não ter registros no PNCP.`,
  },
  {
    keywords: ['termo', 'termos', 'busca', 'extrair', 'ia', 'inteligência', 'inteligencia'],
    answer: `A IA (Inteligência Artificial) analisa sua descrição e extrai os termos técnicos mais relevantes para a busca no PNCP. Você pode ver quais termos foram extraídos e editá-los manualmente se necessário antes de refazer a pesquisa.`,
  },
  {
    keywords: ['erro', 'falha', 'conexão', 'não funcionou', 'problema'],
    answer: `Se ocorrer um erro na consulta:\n\n1. Verifique sua conexão com a internet.\n2. A API do PNCP pode estar temporariamente indisponível — tente novamente em alguns minutos.\n3. Acesse https://pncp.gov.br para verificar se o portal está no ar.\n4. Se o erro persistir, pode ser um problema no servidor da API pública.`,
  },
  {
    keywords: ['pdf', 'visualizar', 'download', 'link', 'documento', 'arquivo'],
    answer: `Cada resultado possui um link para o PDF original publicado no PNCP. Clique no link para visualizar ou baixar o documento completo do contrato ou ata diretamente do portal oficial.`,
  },
  {
    keywords: ['valor', 'valores', 'unitário', 'total', 'preço', 'preco'],
    answer: `Cada card de resultado mostra:\n• **Valor total:** O valor global do contrato ou ata.\n• **Valor unitário** (quando disponível): O valor por unidade do item contratado.\n• **Órgão contratante:** Qual entidade pública realizou a contratação.\n• **UF:** Estado do órgão contratante.`,
  },
  {
    keywords: ['iniciativa', 'privada', 'empresa', 'particular', 'comum'],
    answer: `Esta ferramenta foi projetada para servidores públicos que precisam compor preço médio para contratações públicas. Os dados vêm do PNCP, que é a base oficial de contratos governamentais. Se você é de empresa privada, pode usar a ferramenta para consultar preços de referência do mercado público.`,
  },
  {
    keywords: ['obrigado', 'valeu', 'ajudou', 'útil', 'sim', 'ok'],
    answer: `Disponha! Se tiver mais dúvidas sobre o funcionamento da ferramenta ou sobre a pesquisa de preços, é só perguntar.`,
  },
  {
    keywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'saudações', 'saudacoes'],
    answer: `Olá! Sou o assistente virtual do Inteligência PNCP. Posso ajudar com dúvidas sobre:\n\n• Como fazer uma pesquisa de preços\n• Como usar os filtros e selecionar resultados\n• Como exportar o relatório PDF\n• Base legal (Lei 14.133/2021)\n• Interpretação dos resultados\n\nComo posso ajudar?`,
  },
];

export function findAnswer(input: string): string | null {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let bestMatch: { entry: KnowledgeEntry; score: number } | null = null;

  for (const entry of FAQ) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const kw = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { entry, score };
    }
  }

  return bestMatch ? bestMatch.entry.answer : null;
}

export const SYSTEM_DESCRIPTION = `Sistema: Inteligência PNCP
Descrição: Ferramenta de composição de preço médio via API do PNCP (Portal Nacional de Contratações Públicas).
Versão: 0.1.0
Público-alvo: Servidores públicos que precisam realizar pesquisa de preços conforme Art. 23 da Lei 14.133/2021.

Funcionalidades implementadas:
- Busca por descrição natural do objeto (IA extrai termos técnicos)
- Consulta à API do PNCP por contratos e atas (últimos 12 meses)
- Painel de resultados com filtros (UF, tipo, faixa de valor)
- Seleção múltipla de resultados
- Exportação de relatório PDF com preço médio
- 11 temas visuais customizáveis
- Rate limiting (30 requisições/minuto por IP)

Fluxo de uso:
1. Usuário descreve o objeto → 2. IA extrai termos → 3. API PNCP consultada → 4. Resultados exibidos → 5. Usuário seleciona → 6. Relatório PDF exportado

Base legal:
- Art. 23, Lei nº 14.133/2021 (obrigatoriedade da pesquisa de preços)
- IN SEGES/MGI nº 65/2021 (regulamentação dos procedimentos)`;
