import requests
import json
import unicodedata

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def test_search(item):
    base_url = "https://pncp.gov.br/api/search/"
    params = {
        "q": item,
        "tipos_documento": "contrato",
    }
    headers = {"User-Agent": "Mozilla/5.0"}
    
    print(f"Buscando: {item}")
    res = requests.get(base_url, params=params, headers=headers)
    data = res.json()
    items = data.get("items", [])
    print(f"Total encontrados na API: {len(items)}")
    
    search_terms = remove_accents(item.lower()).split()
    print(f"Termos de busca processados: {search_terms}")
    
    for doc in items[:5]:
        print(f"\nContrato: {doc.get('title')}")
        print(f"Descriçao Contrato: {doc.get('description')}")
        
        # Simular busca de itens (como o item_url costuma ser /contratos/CNPJ/ANO/SEQ)
        # Mas aqui só queremos ver se o filtro 'all' mataria o resultado baseado no que temos
        desc_contrato = remove_accents(doc.get('description', '').lower())
        match = all(term in desc_contrato for term in search_terms)
        print(f"Bate com o filtro (na descrição do contrato)? {'SIM' if match else 'NÃO'}")

test_search("Aquisição de Veículo 1.0")
test_search("Veículo 1.0")
