import requests
import datetime
import math
import re
import unicodedata
import difflib
from dateutil.relativedelta import relativedelta

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def term_exists_fuzzy(term, text, threshold=0.85):
    """
    Verifica se um termo existe no texto, seja literalmente ou de forma aproximada (fuzzy).
    """
    # 1. Busca Literal (Rápida)
    if term in text:
        return True
    
    # 2. Busca Fuzzy por palavra
    # Quebra o texto em palavras para comparar com o termo
    palavras_texto = text.split()
    for palavra in palavras_texto:
        # Só compara palavras de tamanho similar (evita falsos positivos)
        if abs(len(palavra) - len(term)) <= 2:
            similiaridade = difflib.SequenceMatcher(None, term, palavra).ratio()
            if similiaridade >= threshold:
                return True
    return False


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
    Retorna tupla (url, titulo) do primeiro arquivo (geralmente o PDF do contrato).
    """
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}/arquivos"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            arquivos = res.json()
            if arquivos:
                arquivo = arquivos[0]
                pdf_url = arquivo.get("url", "")
                pdf_titulo = arquivo.get("titulo", "")  # ex: "CONTRATO 180 25.pdf"
                return pdf_url, pdf_titulo
    except Exception:
        pass
    return "", ""


def _buscar_valor_homologado(cnpj, ano, seq, numero_item, valor_estimado):
    """
    Busca o valor homologado (final) de um item específico.
    Se não encontrar ou der erro, retorna o valor estimado original.
    """
    if not numero_item:
        return valor_estimado
    url = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/compras/{ano}/{seq}/itens/{numero_item}/resultados"
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            resultados = res.json()
            if resultados:
                # Geralmente o primeiro resultado é o vencedor/homologado
                return resultados[0].get("valorUnitarioHomologado", valor_estimado)
    except Exception:
        pass
    return valor_estimado


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
        res = requests.get(url, headers=HEADERS, timeout=10)
        if res.status_code == 200:
            dados = res.json()
            itens = []
            for item in dados:
                itens.append({
                    "numero_item": item.get("numeroItem"),
                    "descricao": item.get("descricao", ""),
                    "quantidade": item.get("quantidade", 0),
                    "unidade_medida": item.get("unidadeMedida", "N/I"),
                    "valor_unitario": item.get("valorUnitarioEstimado", 0),
                    "valor_total": item.get("valorTotal", 0),
                    # Guardamos dados da compra para buscar o homologado depois se o item for filtrado
                    "compra_cnpj": cnpj,
                    "compra_ano": ano,
                    "compra_seq": seq
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

    resultados = []
    pagina_atual = 1
    max_paginas = 20  # Aumentar para capturar mais resultados

    # Parse da quantidade alvo
    qtd_alvo = None
    if quantidade:
        try:
            qtd_alvo = float(quantidade.replace(',', '.'))
        except ValueError:
            pass

    try:
        # Limpar pontuação do item e extrair termos relevantes para a query da API
        item_clean = re.sub(r'[^\w\s]', ' ', item)
        search_terms_api = [
            t for t in remove_accents(item_clean.lower()).split()
            if len(t) > 1 and t not in {'aquisicao', 'fornecimento', 'prestacao', 'servico', 'compra', 'contratacao',
                                         'item', 'peca', 'pecas', 'material', 'para', 'com', 'pelo', 'pela',
                                         'de', 'da', 'do', 'em', 'no', 'na', 'ao', 'os', 'as', 'um', 'uma'}
            and not t.replace('.', '').replace(',', '').isdigit()
        ]
        # Query com os 3 primeiros termos (incluindo 'a4' se presente)
        api_query = " ".join(search_terms_api[:3]) if search_terms_api else item

        while pagina_atual <= max_paginas and len(resultados) < limit:
            params = {
                "q": api_query,
                "tipos_documento": "contrato",
                "tam_pagina": 100,
                "pagina": pagina_atual
            }

            response = requests.get(base_url, params=params, headers=HEADERS, timeout=15)
            response.raise_for_status()
            data = response.json()

            items = data.get("items", [])
            if not items:
                break

            for doc in items:
                if len(resultados) >= limit:
                    break
                    
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
                pdf_nome = ""
                if cnpj and ano and seq:
                    pdf_url, pdf_nome = _buscar_arquivos_contrato(cnpj, ano, seq)

                # Buscar itens detalhados da compra vinculada
                numero_compra = doc.get("numero_controle_pncp_compra") or doc.get("numero_sequencial_compra_ata")
                numero_compra_full = ""
                if cnpj:
                    try:
                        url_detalhe = f"https://pncp.gov.br/api/pncp/v1/orgaos/{cnpj}/contratos/{ano}/{seq}"
                        res_detalhe = requests.get(url_detalhe, headers=HEADERS, timeout=10)
                        if res_detalhe.status_code == 200:
                            detalhe = res_detalhe.json()
                            numero_compra_full = detalhe.get("numeroControlePncpCompra", "")
                    except Exception:
                        pass

                itens_detalhados = _buscar_itens_compra(numero_compra_full)

                # Fallback: se não achou itens da compra, usar dados do próprio contrato
                if not itens_detalhados:
                    valor_global = doc.get("valor_global") or 0
                    itens_detalhados = [{
                        "descricao": doc.get("description", ""),
                        "quantidade": 1,
                        "unidade_medida": "un",
                        "valor_unitario": valor_global,
                        "valor_total": valor_global,
                        "numero_item": None,
                        "compra_cnpj": cnpj or "",
                        "compra_ano": ano or "",
                        "compra_seq": seq or ""
                    }]

                # Filtrar termos de busca (limpos, sem pontuação, sem numéricos)
                palavras_ignoradas = {
                    'aquisicao', 'fornecimento', 'prestacao', 'servico', 'compra', 'contratacao',
                    'item', 'peca', 'pecas', 'material', 'para', 'com', 'pelo', 'pela',
                    'de', 'da', 'do', 'em', 'no', 'na', 'ao', 'os', 'as', 'um', 'uma'
                }
                search_terms = [
                    t for t in remove_accents(item_clean.lower()).split()
                    if len(t) > 1 and t not in palavras_ignoradas
                    and not t.replace('.', '').replace(',', '').isdigit()
                ]
                
                # Também usar descrição do contrato para matching (mais detalhada que a do item)
                contrato_desc = remove_accents((doc.get("description", "") + " " + doc.get("title", "")).lower())

                matched_items = []
                for it in itens_detalhados:
                    desc = remove_accents(it.get("descricao", "").lower())
                    
                    if not search_terms:
                        matched_items.append(it)
                        continue
                    
                    # Para itens de compras reais (com numero_item), matching apenas pela descrição do item
                    # Para fallback (sem numero_item), usa descrição combinada com contrato
                    if it.get("numero_item"):
                        # Regra 1: Matching rigoroso apenas na descrição do item
                        termos_presentes = sum(1 for term in search_terms if term_exists_fuzzy(term, desc))
                        if termos_presentes / len(search_terms) < 0.6:
                            continue
                    else:
                        # Fallback: matching combinado item + contrato com threshold maior
                        desc_combinada = f"{desc} {contrato_desc}"
                        termos_presentes = sum(1 for term in search_terms if term_exists_fuzzy(term, desc_combinada))
                        if termos_presentes / len(search_terms) < 0.8:
                            continue
                    
                    # Regra 2: Relevância - pelo menos um termo no início da descrição do item
                    palavras_desc = [w for w in desc.replace('(', ' ').replace(')', ' ').replace('-', ' ').split() if len(w) > 3 and w not in palavras_ignoradas]
                    if palavras_desc:
                        cabecalho_item = " ".join(palavras_desc[:3])
                        if not any(term_exists_fuzzy(termo, cabecalho_item) for termo in search_terms):
                            continue
                    
                    # Regra 3: Economia de Escala - calcula valor total projetado mas não filtra
                    # (a unidade do PNCP raramente corresponde à unidade informada pelo usuário)
                                        
                    # Buscar Valor Homologado
                    v_homologado = _buscar_valor_homologado(
                        it["compra_cnpj"], it["compra_ano"], it["compra_seq"], 
                        it["numero_item"], it["valor_unitario"]
                    )
                    it["valor_unitario"] = v_homologado
                    it["valor_total"] = v_homologado * it["quantidade"]
                    
                    matched_items.append(it)
                        
                if not matched_items:
                    continue
                    
                valor_ref = matched_items[0]["valor_unitario"]

                url_portal = f"https://pncp.gov.br/app{doc.get('item_url', '')}"

                resultados.append({
                    "titulo": doc.get("title", "Contrato sem título"),
                    "descricao": doc.get("description", ""),
                    "orgao": doc.get("orgao_nome", "Órgão não identificado"),
                    "municipio": doc.get("municipio_nome", ""),
                    "uf": doc.get("uf", ""),
                    "valor": valor_ref,
                    "data_publicacao": data_pub.strftime("%d/%m/%Y"),
                    "link_portal": url_portal,
                    "link_pdf": pdf_url,
                    "link_pdf_nome": pdf_nome,
                    "itens": matched_items,
                })
                
            # Avançar página
            pagina_atual += 1

        # Calcular Métricas
        precos = [r["valor"] for r in resultados if r["valor"] > 0]
        
        media = 0
        minimo = 0
        maximo = 0
        mediana = 0
        desvio_padrao = 0
        
        if precos:
            media = sum(precos) / len(precos)
            minimo = min(precos)
            maximo = max(precos)
            
            # Cálculo de mediana
            precos_ordenados = sorted(precos)
            n = len(precos_ordenados)
            if n % 2 == 0:
                mediana = (precos_ordenados[n//2 - 1] + precos_ordenados[n//2]) / 2
            else:
                mediana = precos_ordenados[n//2]
                
            # Cálculo de desvio padrão populacional
            variancia = sum((x - media) ** 2 for x in precos) / n
            desvio_padrao = math.sqrt(variancia)

        metricas = {
            "media": media,
            "minimo": minimo,
            "maximo": maximo,
            "mediana": mediana,
            "desvio_padrao": desvio_padrao,
            "total_encontrado": len(precos)
        }

        return {
            "resultados": resultados,
            "metricas": metricas
        }

    except Exception as e:
        print(f"Erro ao buscar no PNCP: {e}")
        return {"resultados": [], "metricas": {}}


if __name__ == "__main__":
    import json
    res = buscar_atas_contratos("computador", limit=2)
    print(json.dumps(res, indent=2, ensure_ascii=False))
