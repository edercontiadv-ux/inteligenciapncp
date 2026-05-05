import requests

def test_page_size(q, size):
    url = "https://pncp.gov.br/api/search/"
    params = {
        "q": q,
        "tipos_documento": "contrato",
        "tam_pagina": size
    }
    res = requests.get(url, params=params)
    data = res.json()
    print(f"Query: {q} | tam_pagina: {size} -> Itens retornados: {len(data.get('items', []))}")

test_page_size("veiculo", 10)
test_page_size("veiculo", 50)
