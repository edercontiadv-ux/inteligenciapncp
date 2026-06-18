import requests

cnpj = "48344014000159"
ano = "2025"
seq = "137"

endpoints = [
    f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/resultados",
    f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens/resultados",
    f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/resultados-itens",
]

for url in endpoints:
    res = requests.get(url)
    print(f"URL: {url} -> Status: {res.status_code}")
    if res.status_code == 200:
        print(f"Sucesso! Encontrado {len(res.json())} itens.")
        break
