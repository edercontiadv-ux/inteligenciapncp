import requests
import json

cnpj = "48344014000159"
ano = "2025"
seq = "206"

# Tentar buscar itens do CONTRATO diretamente
url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}/itens"
print(f"Buscando em: {url}")
res = requests.get(url)
if res.status_code == 200:
    itens = res.json()
    if itens:
        print("Campos disponíveis no item do CONTRATO:")
        print(json.dumps(itens[0], indent=2))
else:
    print(f"Erro ao buscar itens do contrato: {res.status_code}")

# Se falhar, vamos ver se o endpoint de 'resultados' da compra tem o preço final
url_res = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/resultados"
print(f"\nBuscando resultados em: {url_res}")
res_res = requests.get(url_res)
if res_res.status_code == 200:
    resultados = res_res.json()
    if resultados:
        print("Campos disponíveis no RESULTADO da compra:")
        print(json.dumps(resultados[0], indent=2))
