import requests
import json

res = requests.get("https://pncp.gov.br/api/search/?q=computador&tipos_documento=contrato")
data = res.json()
print(json.dumps(data["items"][0], indent=2))
