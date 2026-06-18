import requests
import json

def search(q):
    res = requests.get("https://pncp.gov.br/api/search/", params={"q": q, "tipos_documento": "contrato"})
    data = res.json()
    print(f"\n--- Q: {q} (Total: {data.get('total', 0)}) ---")
    for item in data.get("items", [])[:3]:
        print("- Title:", item.get("title", ""))
        print("  Desc:", item.get("description", "")[:100])

search("filtro de ar")
search('"filtro de ar"')
search("computador")
search('"computador"')
