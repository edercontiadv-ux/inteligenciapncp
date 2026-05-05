import requests
import json

cnpj = "48344014000159"
ano = "2025"
seq = "137"

url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/resultados"
res = requests.get(url)
if res.status_code == 200:
    resultados = res.json()
    if resultados:
        print(f"Total de resultados encontrados: {len(resultados)}")
        print("Campos do primeiro resultado:")
        print(json.dumps(resultados[0], indent=2))
else:
    print(f"Erro ao buscar resultados: {res.status_code}")
