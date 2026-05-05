import requests
import json

# O contrato aponta para a compra: 48344014000159-1-000137/2025
# Vamos buscar os itens da COMPRA (não do contrato)
cnpj = "48344014000159"
ano = "2025"
seq = "137"

url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens"
print(f"Testing: {url}")
res = requests.get(url)
print(f"Status: {res.status_code}")
if res.status_code == 200:
    data = res.json()
    # Mostrar primeiro item completo
    if data:
        print(json.dumps(data[0], indent=2, ensure_ascii=False))
        print(f"\nTotal itens: {len(data)}")
else:
    print(res.text[:200])
