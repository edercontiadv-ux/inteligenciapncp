import requests
res = requests.get('https://pncp.gov.br/api/search/?q=computador')
print(res.status_code)
print(res.text[:200])
