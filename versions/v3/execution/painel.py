import sys
import os

# Adicionar o diretório execution ao path para importar o módulo buscar_pncp
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st
import requests
from buscar_pncp import buscar_atas_contratos
from gerador_relatorio import gerar_pdf_pesquisa

import base64
import unicodedata
import re
from urllib.parse import quote_plus, unquote_plus

def limpar_nome_arquivo(nome: str) -> str:
    nfkd = unicodedata.normalize('NFKD', nome)
    ascii_str = nfkd.encode('ASCII', 'ignore').decode('ASCII')
    limpo = re.sub(r'[^\w\-\_\. ]', '_', ascii_str)
    if not limpo.lower().endswith('.pdf'):
        limpo += '.pdf'
    return limpo

@st.cache_data(show_spinner=False)
def obter_bytes_pdf(url: str):
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    return r.content

# ─── Configuração da Página ───
st.set_page_config(
    page_title="Inteligência PNCP — Busca de Preços",
    page_icon="🏛️",
    layout="wide",
)

# ─── Roteamento (Proxy vs Main App) ───
if "download_pdf" in st.query_params:
    pdf_url = unquote_plus(st.query_params["download_pdf"])
    pdf_nome_original = unquote_plus(st.query_params.get("nome", "documento.pdf"))
    pdf_nome_seguro = limpar_nome_arquivo(pdf_nome_original)
    
    st.markdown(f"### 📥 Preparando arquivo...")
    st.info("Como o portal do governo está com instabilidades (baixando arquivos sem nome), nosso sistema assumiu o controle para consertar o arquivo para você...")
    
    try:
        pdf_bytes = obter_bytes_pdf(pdf_url)
        
        st.success("✅ O arquivo foi corrigido com sucesso! Clique no botão abaixo para baixar o PDF.")
        st.download_button(
            label="📥 SALVAR PDF CORRIGIDO",
            data=pdf_bytes,
            file_name=pdf_nome_seguro,
            mime="application/pdf",
            use_container_width=True,
            type="primary"
        )
        st.markdown("<br><p style='text-align: center; color: #6b7280;'>Após o download, você pode fechar esta aba.</p>", unsafe_allow_html=True)
    except Exception as e:
        st.error("Erro ao baixar o arquivo do portal PNCP. O servidor deles pode estar instável no momento.")
else:
    # ─── CSS Customizado (Design Claro Institucional) ───
    st.markdown("""
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --brand-primary: #1a56db;
            --brand-secondary: #0e9f6e;
            --brand-warning: #e3a008;
            --brand-danger: #e02424;
            --brand-neutral: #6b7280;
            
            --surface-bg: #f9fafb;
            --surface-card: #ffffff;
            --surface-dark: #111827;
            --surface-muted: #f3f4f6;
            
            --border-default: #e5e7eb;
            --border-focus: #1a56db;
            
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
        }
    
        /* ── Reset e Base ── */
        #MainMenu, footer, header {visibility: hidden;}
        .stApp {
            background-color: var(--surface-bg);
            font-family: 'DM Sans', sans-serif;
            color: var(--text-primary);
        }
    
        /* Força fundos de componentes Streamlit para transparente ou branco onde aplicável */
        .stTextInput>div>div>input {
            background-color: var(--surface-card);
            color: var(--text-primary);
            border: 1px solid var(--border-default);
            font-family: 'DM Sans', sans-serif;
        }
        .stTextInput>div>div>input:focus {
            border-color: var(--border-focus);
            box-shadow: 0 0 0 3px rgba(26,86,219,0.15);
        }
        .stButton>button {
            background-color: var(--brand-primary);
            color: white;
            font-weight: 600;
            border-radius: 8px;
            transition: all 0.2s;
        }
        .stButton>button:hover {
            background-color: #1e40af;
            border-color: #1e40af;
            color: white;
        }
    
        /* ── Hero / Título ── */
        .hero {
            text-align: center;
            padding: 40px 10px 20px;
        }
        .hero h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--surface-dark);
            margin-bottom: 8px;
        }
        .hero p {
            color: var(--text-secondary);
            font-size: 1.1rem;
            margin-top: 0;
        }
    
        /* ── Stat Cards ── */
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background-color: var(--surface-card);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .stat-card-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            font-weight: 600;
            color: var(--text-secondary);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .stat-card-value {
            font-family: 'DM Mono', monospace;
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 4px;
        }
        .stat-card-sub {
            font-size: 0.8rem;
            color: var(--text-muted);
        }
        
        /* Bordas de status */
        .border-green { border-left: 4px solid var(--brand-secondary); }
        .border-blue { border-left: 4px solid var(--brand-primary); }
        .border-gray { border-left: 4px solid var(--brand-neutral); }
        .border-red { border-left: 4px solid var(--brand-danger); }
        .border-yellow { border-left: 4px solid var(--brand-warning); }
    
        /* ── Grid e Cards de Resultado ── */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
            margin-top: 24px;
        }
        
        .result-card {
            background: var(--surface-card);
            border: 1px solid var(--border-default);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
        }
        .card-title-box {
            display: flex;
            flex-direction: column;
        }
        .card-label {
            font-size: 0.7rem;
            color: var(--text-secondary);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
        }
        .card-number {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: 1px solid;
        }
        .status-badge::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
        .badge-ok { background: #f3faf7; color: #057a55; border-color: #057a55; }
        .badge-ok::before { background-color: #057a55; }
        .badge-warn { background: #fffbeb; color: #b45309; border-color: #b45309; }
        .badge-warn::before { background-color: #b45309; }
        .badge-danger { background: #fef2f2; color: #b91c1c; border-color: #b91c1c; }
        .badge-danger::before { background-color: #b91c1c; }
        
        .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .meta-col { display: flex; flex-direction: column; }
        .meta-label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; }
        .meta-value { font-size: 0.85rem; color: var(--text-primary); }
        
        .desc-box {
            background-color: #f4f3ec;
            border-radius: 8px;
            padding: 12px;
            font-size: 0.85rem;
            color: var(--text-primary);
            margin-bottom: 16px;
            min-height: 48px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .footer-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
            flex-wrap: wrap;
            gap: 12px;
        }
        .price-box { display: flex; flex-direction: column; }
        .price-label { font-size: 0.65rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
        .price-value { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }
        .price-sub { font-size: 0.75rem; color: var(--text-secondary); }
        
        .card-btns { display: flex; gap: 8px; }
        .btn-outline {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 12px;
            background: #ffffff;
            border: 1px solid var(--border-default);
            color: var(--text-primary) !important;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn-outline:hover { background: var(--surface-bg); border-color: #9ca3af; }
    
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: var(--surface-card);
            border-radius: 12px;
            border: 1px dashed var(--border-default);
            margin-top: 40px;
        }
        .empty-state h3 { color: var(--text-primary); font-size: 1.25rem; font-weight: 600; margin-bottom: 8px; }
        .empty-state p { color: var(--text-secondary); margin-bottom: 24px; }
        .suggestion-pills { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .suggestion-pill { background: var(--surface-muted); padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; color: var(--text-primary); cursor: pointer; transition: background 0.2s; }
        .suggestion-pill:hover { background: #e5e7eb; }
    </style>
    """, unsafe_allow_html=True)
    
    
    # ─── Hero ───
    st.markdown("""
    <div class="hero">
        <h1>🏛️ Inteligência PNCP</h1>
        <p>Busque atas e contratos dos últimos 10 meses no Portal Nacional de Contratações Públicas</p>
    </div>
    """, unsafe_allow_html=True)
    
    # ─── Formulário de Busca ───
    with st.container():
        col1, col2, col3 = st.columns([3, 1, 1])
        with col1:
            item = st.text_input("🔍 Item desejado", placeholder="Ex: Notebook, Resma de Papel, Cimento...")
        with col2:
            quantidade = st.text_input("📦 Quantidade", placeholder="Ex: 50")
        with col3:
            unidade = st.text_input("📐 Unidade", placeholder="Ex: m², kg, un")
    
        buscar = st.button("Pesquisar no PNCP", type="primary", use_container_width=True)
    
    # ─── Estado Vazio / Resultados ───
    if not buscar and not item:
        st.markdown("""
        <div class="empty-state">
            <h3>Pronto para iniciar?</h3>
            <p>Pesquise qualquer item para ver a distribuição de preços, encontrar contratos de referência e baixar os PDFs.</p>
            <div class="suggestion-pills">
                <span class="suggestion-pill" onclick="document.querySelector('input').value='Notebook Dell';">Notebook Dell</span>
                <span class="suggestion-pill">Resma de Papel A4</span>
                <span class="suggestion-pill">Cadeira Ergonômica</span>
                <span class="suggestion-pill">Locação de Impressora</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    elif buscar and not item:
        st.warning("Por favor, digite um item para buscar.")
    elif item:
        with st.spinner("🔄 Conectando à API do Governo Federal e analisando dados..."):
            dados = buscar_atas_contratos(
                item,
                quantidade=quantidade,
                unidade_medida=unidade,
                limit=30,
            )
            
            resultados_brutos = dados.get("resultados", [])
            metricas_originais = dados.get("metricas", {})
    
        if not resultados_brutos:
            st.info("Nenhum contrato encontrado para este item nos últimos 10 meses.")
        else:
            # Extrair dados para filtros
            ufs = sorted(list(set(r.get('uf') for r in resultados_brutos if r.get('uf'))))
            orgaos = sorted(list(set(r.get('orgao') for r in resultados_brutos if r.get('orgao'))))
            
            # Sidebar com filtros
            st.sidebar.markdown("### 🎛️ Filtros de Pesquisa")
            filtro_uf = st.sidebar.multiselect("Estado (UF)", ufs, placeholder="Todos")
            
            # Aplicar filtros
            resultados = resultados_brutos
            if filtro_uf:
                resultados = [r for r in resultados if r.get('uf') in filtro_uf]
                
            # Recalcular métricas após filtro
            precos = [r["valor"] for r in resultados if r["valor"] > 0]
            n_precos = len(precos)
            if n_precos > 0:
                precos_ord = sorted(precos)
                m_min = precos_ord[0]
                m_max = precos_ord[-1]
                m_med = sum(precos)/n_precos
                m_mdn = (precos_ord[n_precos//2 - 1] + precos_ord[n_precos//2])/2 if n_precos%2==0 else precos_ord[n_precos//2]
            else:
                m_min = m_max = m_med = m_mdn = 0
                
            metricas = {"minimo": m_min, "maximo": m_max, "media": m_med, "mediana": m_mdn, "total_encontrado": n_precos}
    
            # Histogram na Sidebar
            if n_precos > 0:
                st.sidebar.markdown("---")
                st.sidebar.markdown("**Distribuição de Preços**")
                import pandas as pd
                import numpy as np
                counts, bins = np.histogram(precos, bins=10)
                df_hist = pd.DataFrame({'Faixa': [f"R$ {int(b):,}".replace(',','.') for b in bins[:-1]], 'Contratos': counts})
                st.sidebar.bar_chart(df_hist.set_index('Faixa'))
    
            # 📊 Dashboard de Métricas (Stat Cards)
            st.markdown("### 📊 Resumo da Pesquisa")
            
            # Formatação Helper
            def fmt_brl(v): return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            
            is_outlier = m_max > m_mdn * 3 if m_mdn > 0 else False
            max_border = "border-red" if is_outlier else ("border-yellow" if m_max > m_mdn * 1.5 else "border-green")
            
            cards_html = f"""
            <div class="stat-grid">
                <div class="stat-card border-green">
                    <div class="stat-card-title">📉 Menor Valor</div>
                    <div class="stat-card-value">{fmt_brl(m_min)}</div>
                    <div class="stat-card-sub">{n_precos} contratos analisados</div>
                </div>
                <div class="stat-card border-blue">
                    <div class="stat-card-title">〜 Mediana</div>
                    <div class="stat-card-value">{fmt_brl(m_mdn)}</div>
                    <div class="stat-card-sub">Valor central do mercado</div>
                </div>
                <div class="stat-card border-gray">
                    <div class="stat-card-title">⌀ Média</div>
                    <div class="stat-card-value">{fmt_brl(m_med)}</div>
                    <div class="stat-card-sub">Afetada por valores extremos</div>
                </div>
                <div class="stat-card {max_border}">
                    <div class="stat-card-title">📈 Maior Valor {'⚠ Outlier' if is_outlier else ''}</div>
                    <div class="stat-card-value">{fmt_brl(m_max)}</div>
                    <div class="stat-card-sub">Extremo superior</div>
                </div>
            </div>
            """
            st.markdown(cards_html, unsafe_allow_html=True)
    
            # 📄 Ação: Gerar Relatório
            pdffile = gerar_pdf_pesquisa(item, resultados, metricas, {"Quantidade": quantidade, "Unidade": unidade})
            
            nome_relatorio = f"relatorio_pesquisa_{item.replace(' ', '_')}.pdf"
            b64_relatorio = base64.b64encode(bytes(pdffile)).decode('utf-8')
            btn_relatorio = f'''
            <a href="data:application/pdf;base64,{b64_relatorio}" download="{nome_relatorio}" 
               style="display: block; width: 100%; text-align: center; padding: 10px; 
                      background-color: var(--surface-dark); color: white; text-decoration: none; 
                      border-radius: 8px; font-weight: bold; border: 1px solid var(--border-default);
                      transition: opacity 0.2s;">
                📄 Baixar Relatório de Pesquisa (Capa)
            </a>
            '''
            st.markdown(btn_relatorio, unsafe_allow_html=True)
            
            st.markdown("---")
            # Ordenar resultados por valor
            resultados_ordenados = sorted(resultados, key=lambda x: x['valor'])
            
            cards_html_list = []
            
            for idx, res in enumerate(resultados_ordenados, 1):
                val_unitario = res['valor']
                
                # Cálculo de outlier do card
                if m_mdn > 0:
                    if val_unitario > m_mdn * 3:
                        badge_class = "badge-danger"
                        badge_text = "Possível Outlier"
                    elif val_unitario > m_mdn * 1.5:
                        badge_class = "badge-warn"
                        badge_text = "Acima da Média"
                    else:
                        badge_class = "badge-ok"
                        badge_text = "Dentro do Esperado"
                else:
                    badge_class = "badge-ok"
                    badge_text = "Dentro do Esperado"
                    
                local = f"{res['municipio']}/{res['uf']}" if res.get('municipio') else res.get('uf', '')
                
                # Extraindo o título
                title_parts = res['titulo'].split(' ', 1)
                label_titulo = "CONTRATO"
                num_titulo = res['titulo']
                if len(title_parts) == 2 and title_parts[0].upper() == "CONTRATO":
                    num_titulo = title_parts[1]
                
                # Qtd/Total Format
                qtd_str = ""
                try:
                    qtd_num = float(quantidade.replace(',','.')) if quantidade else 0
                    if qtd_num > 0:
                        v_total_calc = val_unitario * qtd_num
                        qtd_str = f'{quantidade} un • total {fmt_brl(v_total_calc)}'
                except: pass
                
                # Limite nome orgao
                orgao_nome = res["orgao"][:35] + "..." if len(res["orgao"]) > 35 else res["orgao"]

                # PDF Button
                btn_pdf_html = ""
                if res.get("link_pdf"):
                    safe_url = quote_plus(res["link_pdf"])
                    safe_nome = quote_plus(res.get("link_pdf_nome", "documento.pdf"))
                    proxy_url = f"/?download_pdf={safe_url}&nome={safe_nome}"
                    btn_pdf_html = f'<a href="{proxy_url}" target="_blank" class="btn-outline">Baixar PDF</a>'
                
                card_html = f"""
<div class="result-card">
    <div class="card-header">
        <div class="card-title-box">
            <span class="card-label">{label_titulo}</span>
            <span class="card-number">{num_titulo}</span>
        </div>
        <span class="status-badge {badge_class}">{badge_text}</span>
    </div>
    <div class="meta-row">
        <div class="meta-col">
            <span class="meta-label">Órgão</span>
            <span class="meta-value" title="{res['orgao']}">{orgao_nome}</span>
        </div>
        <div class="meta-col">
            <span class="meta-label">Local</span>
            <span class="meta-value">{local}</span>
        </div>
        <div class="meta-col">
            <span class="meta-label">Publicado em</span>
            <span class="meta-value">{res["data_publicacao"]}</span>
        </div>
    </div>
    <div class="desc-box">
        {res["descricao"]}
    </div>
    <div class="footer-row">
        <div class="price-box">
            <span class="price-label">Valor Unitário</span>
            <span class="price-value">{fmt_brl(val_unitario)}</span>
            {f'<span class="price-sub">{qtd_str}</span>' if qtd_str else ''}
        </div>
        <div class="card-btns">
            <a href="{res["link_portal"]}" target="_blank" class="btn-outline">Ver no portal</a>
            {btn_pdf_html}
        </div>
    </div>
</div>
"""
                cards_html_list.append(card_html)
                
            st.markdown(f'<div class="cards-grid">{"".join(cards_html_list)}</div>', unsafe_allow_html=True)
