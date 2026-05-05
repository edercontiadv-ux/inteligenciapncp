import requests
import json
url = "https://pncp.gov.br/api/search/?q=computador&tipos_documento=contrato"
res = requests.get(url)
data = res.json()
items = data.get("items", [])
if items:
    print(json.dumps(items[0], indent=2, ensure_ascii=False))
else:
    print("No items")
