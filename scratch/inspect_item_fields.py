import requests
import json

# Exemplo de contrato para inspecionar itens
# Usando Guaíra como exemplo que funcionou antes
cnpj = "48344014000159"
ano = "2025"
seq = "206"

# Buscar itens da compra vinculada ao contrato
url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens"
res = requests.get(url)
if res.status_code == 200:
    itens = res.json()
    if itens:
        print("Campos disponíveis no item:")
        print(json.dumps(itens[0], indent=2))
else:
    print(f"Erro ao buscar itens: {res.status_code}")
