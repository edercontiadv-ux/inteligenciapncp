import requests
import json
url = "https://pncp.gov.br/api/pncp/v1/orgaos/48344014000159/contratos/2025/206"
res = requests.get(url)
if res.status_code == 200:
    data = res.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"Error: {res.status_code}")
    print(res.text)
