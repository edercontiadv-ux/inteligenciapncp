import requests
import datetime
from dateutil.relativedelta import relativedelta


def _extrair_cnpj_ano_seq(numero_controle_pncp: str):
    """
    Extrai CNPJ, ano e sequencial a partir do numero_controle_pncp.
    Formato exemplo: '48344014000159-2-000206/2025'
    """
    try:
        partes = numero_controle_pncp.split("-")
        cnpj = partes[0]
        seq_ano = partes[2]  # '000206/2025'
        seq, ano = seq_ano.split("/")
        return cnpj, ano, str(int(seq))  # remove zeros à esquerda
    except Exception:
        return None, None, None


def _buscar_arquivos_contrato(cnpj: str, ano: str, seq: str):
    """
    Busca os arquivos PDF vinculados ao contrato.
    Retorna a URL direta do primeiro arquivo (geralmente o PDF do contrato).
    """
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}/arquivos"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            arquivos = res.json()
            if arquivos:
                return arquivos[0].get("url", "")
    except Exception:
        pass
    return ""


def _buscar_itens_compra(numero_controle_compra: str):
    """
    Busca os itens detalhados da compra vinculada ao contrato.
    Retorna lista de dicts com descricao, quantidade, unidadeMedida, valorUnitarioEstimado.
    """
    if not numero_controle_compra:
        return []

    try:
        partes = numero_controle_compra.split("-")
        cnpj = partes[0]
        seq_ano = partes[2]  # '000137/2025'
        seq, ano = seq_ano.split("/")
        seq = str(int(seq))
    except Exception:
        return []

    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens"
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            dados = res.json()
            itens = []
            for item in dados:
                itens.append({
                    "descricao": item.get("descricao", ""),
                    "quantidade": item.get("quantidade", 0),
                    "unidade_medida": item.get("unidadeMedida", "N/I"),
                    "valor_unitario": item.get("valorUnitarioEstimado", 0),
                    "valor_total": item.get("valorTotal", 0),
                })
            return itens
    except Exception:
        pass
    return []


def buscar_atas_contratos(item: str, quantidade: str = None, unidade_medida: str = None, limit: int = 5):
    """
    Busca os contratos/atas mais recentes no PNCP relacionados ao item,
    limitando-se aos últimos 10 meses.

    Args:
        item: Nome do produto/serviço a buscar.
        quantidade: Quantidade aproximada desejada (texto).
        unidade_medida: Unidade de medida desejada (ex: 'km', 'm²', 'un').
        limit: Número máximo de resultados a retornar.

    Returns:
        Lista de dicionários com os dados dos contratos encontrados.
    """
    base_url = "https://pncp.gov.br/api/search/"

    # Calcular data limite de 10 meses atrás
    hoje = datetime.date.today()
    dez_meses_atras = hoje - relativedelta(months=10)

    params = {
        "q": item,
        "tipos_documento": "contrato",
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    try:
        response = requests.get(base_url, params=params, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()

        items = data.get("items", [])

        resultados = []
        for doc in items:
            # Filtrar por data de publicação
            data_pub_str = doc.get("data_publicacao_pncp")
            if not data_pub_str:
                continue

            try:
                data_pub = datetime.datetime.strptime(
                    data_pub_str.split("T")[0], "%Y-%m-%d"
                ).date()
            except ValueError:
                continue

            if data_pub < dez_meses_atras:
                continue

            # Extrair dados do contrato
            numero_controle = doc.get("numero_controle_pncp", "")
            cnpj, ano, seq = _extrair_cnpj_ano_seq(numero_controle)

            # Buscar link do PDF do contrato
            pdf_url = ""
            if cnpj and ano and seq:
                pdf_url = _buscar_arquivos_contrato(cnpj, ano, seq)

            # Buscar itens detalhados da compra vinculada
            numero_compra = doc.get("numero_controle_pncp_compra") or doc.get("numero_sequencial_compra_ata")
            # Montar o número de controle da compra a partir dos dados do contrato
            numero_compra_full = ""
            if cnpj:
                # Tentar buscar detalhes do contrato para pegar o numero da compra
                try:
                    url_detalhe = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}"
                    res_detalhe = requests.get(url_detalhe, timeout=10)
                    if res_detalhe.status_code == 200:
                        detalhe = res_detalhe.json()
                        numero_compra_full = detalhe.get("numeroControlePncpCompra", "")
                except Exception:
                    pass

            itens_detalhados = _buscar_itens_compra(numero_compra_full)

            url_portal = f"https://pncp.gov.br/app{doc.get('item_url', '')}"

            resultados.append({
                "titulo": doc.get("title", "Contrato sem título"),
                "descricao": doc.get("description", ""),
                "orgao": doc.get("orgao_nome", "Órgão não identificado"),
                "municipio": doc.get("municipio_nome", ""),
                "uf": doc.get("uf", ""),
                "valor": doc.get("valor_global", 0.0),
                "data_publicacao": data_pub.strftime("%d/%m/%Y"),
                "link_portal": url_portal,
                "link_pdf": pdf_url,
                "itens": itens_detalhados,
            })

            if len(resultados) >= limit:
                break

        return resultados

    except Exception as e:
        print(f"Erro ao buscar no PNCP: {e}")
        return []


if __name__ == "__main__":
    import json
    res = buscar_atas_contratos("computador", limit=2)
    print(json.dumps(res, indent=2, ensure_ascii=False))
