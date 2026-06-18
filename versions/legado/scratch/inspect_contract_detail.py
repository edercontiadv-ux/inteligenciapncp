import requests
import json

cnpj = "48344014000159"
ano = "2025"
seq = "206"

# Buscar DETALHE do contrato
url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}"
res = requests.get(url)
if res.status_code == 200:
    detalhe = res.json()
    print("Detalhe do Contrato (parcial):")
    # Mostrar apenas campos que podem ter itens ou valores
    keys = ['valorGlobal', 'numeroControlePncpCompra', 'numeroSequencialCompra', 'anoCompra']
    for k in keys:
        print(f"{k}: {detalhe.get(k)}")
else:
    print(f"Erro no detalhe do contrato: {res.status_code}")
