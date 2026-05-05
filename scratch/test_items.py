import requests
import json
# Using the ID from the previous successful search test
url = "https://pncp.gov.br/api/pncp/v1/orgaos/48344014000159/contratos/2025/206/itens"
res = requests.get(url)
if res.status_code == 200:
    data = res.json()
    print(json.dumps(data[:1], indent=2, ensure_ascii=False))
else:
    print(f"Error: {res.status_code}")
    print(res.text)
