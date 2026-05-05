import sys
import os

# Adicionar o diretório execution ao path para importar o módulo buscar_pncp
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st
from buscar_pncp import buscar_atas_contratos

# ─── Configuração da Página ───
st.set_page_config(
    page_title="Inteligência PNCP — Busca de Preços",
    page_icon="🏛️",
    layout="centered",
)

# ─── CSS Customizado (Design Premium Dark Mode) ───
st.markdown("""
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
    /* ── Reset e Base ── */
    #MainMenu, footer, header {visibility: hidden;}
    .stApp {
        font-family: 'Inter', sans-serif;
    }

    /* ── Hero / Título ── */
    .hero {
        text-align: center;
        padding: 30px 10px 10px;
    }
    .hero h1 {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 6px;
    }
    .hero p {
        color: #94a3b8;
        font-size: 1rem;
        margin-top: 0;
    }

    /* ── Cards de Resultado ── */
    .result-card {
        background: linear-gradient(145deg, #1a1d23, #22262d);
        border: 1px solid #2d333b;
        border-radius: 14px;
        padding: 28px;
        margin-bottom: 24px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.25);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .result-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 32px rgba(96, 165, 250, 0.12);
        border-color: #3b82f6;
    }
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        flex-wrap: wrap;
        gap: 8px;
    }
    .card-title {
        color: #f1f5f9;
        font-size: 1.2rem;
        font-weight: 700;
        line-height: 1.4;
        flex: 1;
    }
    .badge {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        white-space: nowrap;
    }
    .card-meta {
        color: #94a3b8;
        font-size: 0.88rem;
        margin-bottom: 6px;
        line-height: 1.6;
    }
    .card-meta b {
        color: #cbd5e1;
    }
    .card-price {
        color: #4ade80;
        font-weight: 800;
        font-size: 1.35rem;
        margin: 16px 0;
        letter-spacing: -0.5px;
    }

    /* ── Tabela de Itens ── */
    .items-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin: 14px 0;
        font-size: 0.82rem;
        border-radius: 8px;
        overflow: hidden;
    }
    .items-table thead th {
        background: #2d333b;
        color: #94a3b8;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 0.5px;
    }
    .items-table tbody td {
        padding: 9px 12px;
        color: #cbd5e1;
        border-bottom: 1px solid #2d333b;
    }
    .items-table tbody tr:last-child td {
        border-bottom: none;
    }
    .items-table tbody tr:hover {
        background: rgba(59, 130, 246, 0.06);
    }
    .unit-badge {
        background: #374151;
        color: #a78bfa;
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 0.78rem;
        font-weight: 600;
    }

    /* ── Botões de Link ── */
    .btn-group {
        display: flex;
        gap: 10px;
        margin-top: 18px;
        flex-wrap: wrap;
    }
    .btn-portal {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        transition: opacity 0.2s;
    }
    .btn-portal:hover { opacity: 0.88; }
    .btn-pdf {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 18px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white !important;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        transition: opacity 0.2s;
    }
    .btn-pdf:hover { opacity: 0.88; }

    /* ── Contador de Resultados ── */
    .results-count {
        text-align: center;
        color: #64748b;
        font-size: 0.85rem;
        margin-bottom: 20px;
        padding: 8px;
        border-bottom: 1px solid #1e293b;
    }
    .results-count span {
        color: #60a5fa;
        font-weight: 700;
    }
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
        item = st.text_input(
            "🔍 Item desejado",
            placeholder="Ex: Notebook, Resma de Papel, Cimento..."
        )
    with col2:
        quantidade = st.text_input(
            "📦 Quantidade",
            placeholder="Ex: 50"
        )
    with col3:
        unidade = st.text_input(
            "📐 Unidade",
            placeholder="Ex: m², kg, un"
        )

    buscar = st.button("Pesquisar no PNCP", type="primary", use_container_width=True)

# ─── Resultados ───
if buscar:
    if not item:
        st.warning("Por favor, digite um item para buscar.")
    else:
        with st.spinner("🔄 Conectando à API do Governo Federal e enriquecendo dados..."):
            resultados = buscar_atas_contratos(
                item,
                quantidade=quantidade,
                unidade_medida=unidade,
                limit=5,
            )

        if not resultados:
            st.info("Nenhum contrato encontrado para este item nos últimos 10 meses.")
        else:
            st.markdown(
                f'<div class="results-count">Exibindo <span>{len(resultados)}</span> contratos encontrados para "<span>{item}</span>"</div>',
                unsafe_allow_html=True,
            )

            for idx, res in enumerate(resultados, 1):
                valor_fmt = f"R$ {res['valor']:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                local = f"{res['municipio']}/{res['uf']}" if res.get('municipio') else res.get('uf', '')

                # Montar tabela de itens (SEM indentação para evitar que Streamlit trate como código)
                itens_html = ""
                if res.get("itens"):
                    rows = ""
                    for it in res["itens"][:8]:
                        vunit = f"R$ {it['valor_unitario']:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                        vtot = f"R$ {it['valor_total']:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                        rows += f'<tr><td>{it["descricao"][:60]}</td><td style="text-align:center">{it["quantidade"]:g}</td><td style="text-align:center"><span class="unit-badge">{it["unidade_medida"]}</span></td><td style="text-align:right">{vunit}</td><td style="text-align:right">{vtot}</td></tr>'

                    itens_html = f'<table class="items-table"><thead><tr><th>Descrição do Item</th><th style="text-align:center">Qtd</th><th style="text-align:center">Unidade</th><th style="text-align:right">Vlr. Unit.</th><th style="text-align:right">Vlr. Total</th></tr></thead><tbody>{rows}</tbody></table>'
                    if len(res["itens"]) > 8:
                        itens_html += f'<p style="color:#64748b;font-size:0.78rem;margin-top:4px;">... e mais {len(res["itens"]) - 8} itens</p>'

                # Montar botões
                btns = f'<a href="{res["link_portal"]}" target="_blank" class="btn-portal">🌐 Ver no Portal</a>'
                if res.get("link_pdf"):
                    btns += f'<a href="{res["link_pdf"]}" target="_blank" class="btn-pdf">📄 Baixar PDF</a>'

                card_html = f'<div class="result-card"><div class="card-header"><div class="card-title">{res["titulo"]}</div><span class="badge">#{idx}</span></div><div class="card-meta">🏢 <b>Órgão:</b> {res["orgao"]}</div><div class="card-meta">📍 <b>Local:</b> {local}</div><div class="card-meta">📅 <b>Publicado em:</b> {res["data_publicacao"]}</div><div class="card-meta">📝 <b>Objeto:</b> {res["descricao"][:200]}</div><div class="card-price">💰 {valor_fmt}</div>{itens_html}<div class="btn-group">{btns}</div></div>'
                st.markdown(card_html, unsafe_allow_html=True)
