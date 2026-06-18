# Buscar Atas e Contratos no PNCP

**Descrição**: Esta diretriz define o funcionamento da ferramenta de busca de Atas e Contratos no Portal Nacional de Contratações Públicas (PNCP).

## Entradas (Inputs)
- **Item**: Nome do produto ou serviço a ser buscado.
- **Quantidade** (Opcional): Quantidade desejada para tentar aproximar resultados.

## Ferramentas (Layer 3)
- `execution/buscar_pncp.py`: Script Python que realiza a requisição HTTP para a API do PNCP (`https://pncp.gov.br/api/search/`).
- `execution/painel.py`: Interface de usuário construída em Streamlit para facilitar o acesso.

## Regras de Negócio e Lógica
1. **Endpoint da API**: Utilizar o endpoint de busca pública do PNCP: `https://pncp.gov.br/api/search/`.
2. **Parâmetros Obrigatórios**: A API exige o parâmetro `tipos_documento`. Passar `contrato` e/se desejar, `edital`. Para esta diretriz, focaremos em `contrato` e `ata` (que geralmente entra como contrato ou edital de registro de preços).
3. **Filtro de Tempo**: Filtrar resultados dos últimos 10 meses. Como a API de busca textual pode não suportar filtros de data complexos via URL de forma documentada, o script deve buscar os mais recentes (ordenar por data) e aplicar o filtro de 10 meses localmente (no Python) até obter 5 resultados válidos.
4. **Filtro de Quantidade**: (Melhor esforço). O texto livre busca o item. O script tentará priorizar retornos que possuam a quantidade próxima, se possível.
5. **Apresentação**: A interface deve ser moderna, usando os recursos do Streamlit para criar uma lista visualmente limpa e profissional com os links para acesso direto.
