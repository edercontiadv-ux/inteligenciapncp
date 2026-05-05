import requests
import json

# Exemplo de contrato com arquivos (usando um CNPJ e sequencial conhecido do print do usuario)
cnpj = "45685120000108"
ano = "2026"
seq = "4" # Baseado na URL que estava aberta no browser do usuario no print

url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}/arquivos"
res = requests.get(url)
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Erro: {res.status_code}")
