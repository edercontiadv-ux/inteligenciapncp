import requests
import json

base = "https://pncp.gov.br/api/pncp/v1/orgaos/48344014000159/contratos/2025/206"
endpoints = ["/itens", "/arquivos", "/empenhos"]

for ep in endpoints:
    url = base + ep
    print(f"Testing {url}")
    res = requests.get(url)
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json()[:1], indent=2, ensure_ascii=False))
    else:
        print(res.text[:100])
    print("-" * 20)
