import requests

url = "https://pncp.gov.br/pncp-api/v1/orgaos/45685120000108/contratos/2026/4/arquivos/1"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status: {res.status_code}")
    print(f"Content-Type: {res.headers.get('Content-Type')}")
    print(f"Content-Length: {len(res.content)}")
    if res.status_code == 200:
        with open("scratch/test_download.pdf", "wb") as f:
            f.write(res.content)
        print("Arquivo salvo em scratch/test_download.pdf")
except Exception as e:
    print(f"Erro: {e}")
