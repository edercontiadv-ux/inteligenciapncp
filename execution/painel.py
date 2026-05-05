import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import streamlit as st
import requests
import base64
import unicodedata
import re
from urllib.parse import quote_plus, unquote_plus

from buscar_pncp import buscar_atas_contratos
from gerador_relatorio import gerar_pdf_pesquisa

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
    # ─── AUTENTICAÇÃO FIREBASE ───
    FIREBASE_API_KEY = "AIzaSyBo_a1Gn2juQqR8rsCOEWcm7lszhpzkdo8"
    
    if 'usuario_logado' not in st.session_state:
        st.session_state['usuario_logado'] = False

    if not st.session_state['usuario_logado']:
        st.markdown("""
        <style>
            #MainMenu, footer, header {visibility: hidden;}
            .stApp { 
                font-family: 'Inter', sans-serif; 
                background-color: #f8f9fb; 
                background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
                background-size: 30px 30px;
            }
            div[data-testid="stForm"] {
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px 24px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            }
            .login-header {
                text-align: center;
                margin-bottom: 1.5rem;
            }
            .login-header h2 {
                color: #0f172a;
                font-size: 1.6rem;
                font-weight: 600;
                margin-bottom: 0.4rem;
                letter-spacing: -0.02em;
            }
            .login-header p {
                color: #64748b;
                font-size: 0.85rem;
                margin: 0;
            }
            div[data-testid="stTextInput"] label p {
                font-weight: 500;
                color: #334155;
            }
            div[data-testid="stFormSubmitButton"] button {
                border-radius: 8px;
                font-weight: 600;
                padding: 6px 0;
                margin-top: 10px;
            }
        </style>
        """, unsafe_allow_html=True)
        
        st.markdown("<br><br><br><br>", unsafe_allow_html=True)
        col1, col2, col3 = st.columns([1, 1.2, 1])
        with col2:
            st.markdown("""
            <div class="login-header">
                <h2>🏛️ Inteligência PNCP</h2>
                <p>Faça login para acessar o painel de pesquisa</p>
            </div>
            """, unsafe_allow_html=True)
            
            with st.form("login_form"):
                email = st.text_input("E-mail corporativo", placeholder="seu@email.com")
                senha = st.text_input("Senha", type="password", placeholder="••••••••")
                submit = st.form_submit_button("Entrar no sistema", type="primary", use_container_width=True)
                
                if submit:
                    if not email or not senha:
                        st.warning("Preencha e-mail e senha.")
                    else:
                        with st.spinner("Verificando credenciais..."):
                            try:
                                url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
                                r = requests.post(url, json={"email": email, "password": senha, "returnSecureToken": True})
                                if r.status_code == 200:
                                    st.session_state['usuario_logado'] = True
                                    st.rerun()
                                else:
                                    st.error("E-mail ou senha incorretos. Verifique suas credenciais.")
                            except Exception as e:
                                st.error("Erro ao conectar no servidor de autenticação.")
        st.stop()

    # Se chegou aqui, o usuário está logado.
    st.sidebar.markdown("### 👤 Minha Conta")
    if st.sidebar.button("Sair (Logout)", use_container_width=True):
        st.session_state['usuario_logado'] = False
        st.rerun()

    # ─── CSS ───
    st.markdown("""
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        #MainMenu, footer, header {visibility: hidden;}

        .stApp {
            font-family: 'Inter', sans-serif;
            background-color: #f8f9fb;
        }

        /* ── Hero ── */
        .hero {
            text-align: center;
            padding: 28px 10px 8px;
        }
        .hero h1 {
            font-size: 1.4rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 4px;
            letter-spacing: -0.02em;
        }
        .hero p {
            color: #64748b;
            font-size: 0.82rem;
            margin-top: 0;
        }

        /* ── Bloco de busca ── */
        .search-block {
            background: #fff;
            border: 0.5px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px 18px;
            margin: 16px 0 0;
        }

        /* ── Resumo ── */
        .section-lbl {
            font-size: 0.65rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin: 18px 0 8px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 6px;
        }
        .stat {
            background: #f8fafc;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .stat.accent {
            border-left: 2px solid #3b82f6;
            border-radius: 0 8px 8px 0;
        }
        .stat-lbl {
            font-size: 0.65rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .stat-val {
            font-size: 0.9rem;
            font-weight: 500;
            color: #0f172a;
            letter-spacing: -0.01em;
        }
        .stat.accent .stat-val {
            color: #1d4ed8;
        }
        .stat-sub {
            font-size: 0.65rem;
            color: #94a3b8;
            margin-top: 1px;
        }

        /* ── Botão relatório ── */
        .btn-report {
            display: block;
            width: 100%;
            padding: 7px;
            border-radius: 8px;
            border: 0.5px solid #cbd5e1;
            background: transparent;
            color: #334155 !important;
            font-size: 0.76rem;
            font-weight: 500;
            cursor: pointer;
            margin: 8px 0 16px;
            font-family: 'Inter', sans-serif;
            text-align: center;
            text-decoration: none;
            transition: background 0.2s;
        }
        .btn-report:hover { background: #f1f5f9; }

        /* ── Contador ── */
        .results-count {
            text-align: center;
            color: #94a3b8;
            font-size: 0.78rem;
            margin-bottom: 12px;
            padding: 5px;
            border-bottom: 0.5px solid #e2e8f0;
        }
        .results-count span {
            color: #0f172a;
            font-weight: 500;
        }

        /* ── Grid de cards ── */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        /* ── Card ── */
        .result-card {
            background: #fff;
            border: 0.5px solid #e2e8f0;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .card-scroll {
            overflow-y: auto;
            max-height: 340px;
            padding: 14px 14px 0;
        }
        .card-scroll::-webkit-scrollbar { width: 3px; }
        .card-scroll::-webkit-scrollbar-track { background: transparent; }
        .card-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            gap: 6px;
        }
        .card-id-lbl {
            font-size: 0.62rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            margin-bottom: 1px;
        }
        .card-title {
            color: #0f172a;
            font-size: 0.82rem;
            font-weight: 500;
            line-height: 1.4;
        }
        
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f0fdf4;
            color: #15803d;
            border: 0.5px solid #bbf7d0;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 0.62rem;
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .badge-dot { width: 4px; height: 4px; border-radius: 50%; background: #15803d; display: inline-block; flex-shrink: 0; }
        
        /* Cores Dinâmicas do Badge */
        .badge.warn { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .badge.warn .badge-dot { background: #b45309; }
        .badge.danger { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .badge.danger .badge-dot { background: #b91c1c; }

        .card-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 8px;
        }
        .meta-key {
            font-size: 0.62rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            display: block;
            margin-bottom: 1px;
        }
        .meta-val {
            font-size: 0.72rem;
            color: #1e293b;
            line-height: 1.3;
        }
        .card-object {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 7px;
            padding: 7px 10px;
            font-size: 0.72rem;
            color: #334155;
            line-height: 1.5;
            margin-bottom: 10px;
        }

        /* ── Tabela de itens ── */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 10px;
            font-size: 0.68rem;
            table-layout: fixed;
        }
        .items-table thead th {
            background: rgba(255, 255, 255, 0.4);
            color: #94a3b8;
            padding: 6px 8px;
            text-align: left;
            font-weight: 500;
            text-transform: uppercase;
            font-size: 0.6rem;
            letter-spacing: 0.06em;
            border-bottom: 0.5px solid #e2e8f0;
        }
        .items-table tbody td {
            padding: 7px 8px;
            color: #334155;
            border-bottom: 0.5px solid #f1f5f9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .items-table tbody tr:last-child td {
            border-bottom: none;
        }
        .unit-pill {
            background: #f1f5f9;
            color: #475569;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 0.62rem;
            font-weight: 500;
        }

        /* ── Rodapé do card ── */
        .card-footer {
            border-top: 0.5px solid #f1f5f9;
            padding: 10px 14px;
            background: #fff;
            flex-shrink: 0;
            margin-top: auto;
        }
        .price-lbl {
            font-size: 0.62rem;
            font-weight: 500;
            color: #94a3b8;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .price-val {
            font-size: 1.05rem;
            font-weight: 500;
            color: #0f172a;
            letter-spacing: -0.02em;
        }
        .price-sub {
            font-size: 0.65rem;
            color: #94a3b8;
            margin-top: 1px;
            margin-bottom: 8px;
            min-height: 12px;
        }
        .btn-group {
            display: flex;
            gap: 6px;
        }
        .btn-ghost {
            flex: 1;
            padding: 6px 0;
            border-radius: 7px;
            border: 0.5px solid #cbd5e1;
            background: transparent;
            color: #334155 !important;
            font-size: 0.72rem;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            transition: background 0.2s;
        }
        .btn-ghost:hover { background: #f8fafc; }
        
        .btn-solid {
            flex: 1;
            padding: 6px 0;
            border-radius: 7px;
            border: none;
            background: #0f172a;
            color: #fff !important;
            font-size: 0.72rem;
            font-weight: 500;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            font-family: 'Inter', sans-serif;
            transition: background 0.2s;
        }
        .btn-solid:hover { background: #1e293b; }
    </style>
    """, unsafe_allow_html=True)

    # ─── Hero ───
    st.markdown("""
    <div class="hero">
        <h1>Inteligência PNCP</h1>
        <p>Busque atas e contratos dos últimos 10 meses no Portal Nacional de Contratações Públicas</p>
    </div>
    """, unsafe_allow_html=True)

    # ─── Formulário de Busca ───
    with st.container():
        col1, col2, col3 = st.columns([3, 1, 1])
        with col1:
            item = st.text_input("Item desejado", placeholder="Ex: Notebook, Resma de Papel, Cimento...")
        with col2:
            quantidade = st.text_input("Quantidade", placeholder="Ex: 50")
        with col3:
            unidade = st.text_input("Unidade", placeholder="Ex: m², kg, un")

        buscar = st.button("Pesquisar no PNCP", type="primary", use_container_width=True, disabled=not bool(quantidade.strip()))

    # ─── Resultados ───
    if not buscar and not item:
        pass
    elif buscar and not item:
        st.warning("Por favor, digite um item para buscar.")
    elif item and not quantidade.strip():
        st.warning("⚠️ O preenchimento da **Quantidade** é obrigatório para aplicarmos o filtro rigoroso de **Economia de Escala** (limite de 20% para cima ou para baixo).")
    elif item and quantidade.strip():
        with st.spinner("🔄 Conectando à API do Governo Federal e enriquecendo dados..."):
            dados = buscar_atas_contratos(
                item,
                quantidade=quantidade,
                unidade_medida=unidade,
                limit=30,
            )
            
            resultados_brutos = dados.get("resultados", [])

        if not resultados_brutos:
            st.info("Nenhum contrato encontrado para este item nos últimos 10 meses.")
        else:
            # ── Sidebar com Filtros ──
            ufs = sorted(list(set(r.get('uf') for r in resultados_brutos if r.get('uf'))))
            st.sidebar.markdown("### 🎛️ Filtros")
            filtro_uf = st.sidebar.multiselect("Estado (UF)", ufs, placeholder="Todos")
            
            resultados = resultados_brutos
            if filtro_uf:
                resultados = [r for r in resultados if r.get('uf') in filtro_uf]

            # ── Resumo estatístico ──
            valores = [r["valor"] for r in resultados if r.get("valor")]
            if valores:
                valores_sorted = sorted(valores)
                menor = valores_sorted[0]
                maior = valores_sorted[-1]
                n = len(valores_sorted)
                mediana = valores_sorted[n // 2] if n % 2 != 0 else (valores_sorted[n // 2 - 1] + valores_sorted[n // 2]) / 2
                media = sum(valores_sorted) / n

                def fmt(v):
                    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                def fmt0(v):
                    return f"R$ {v:,.0f}".replace(",", "X").replace(".", ",").replace("X", ".")

                # Atualizar métricas para o PDF
                metricas = {"minimo": menor, "maximo": maior, "media": media, "mediana": mediana, "total_encontrado": n}
                
                # Botão relatório
                pdffile = gerar_pdf_pesquisa(item, resultados, metricas, {"Quantidade": quantidade, "Unidade": unidade})
                nome_relatorio = f"relatorio_pesquisa_{item.replace(' ', '_')}.pdf"
                b64_relatorio = base64.b64encode(bytes(pdffile)).decode('utf-8')

                st.markdown(f"""
                <div class="section-lbl">Resumo da pesquisa</div>
                <div class="summary-grid">
                <div class="stat accent">
                    <div class="stat-lbl">Menor valor</div>
                    <div class="stat-val">{fmt0(menor)}</div>
                    <div class="stat-sub">{n} contratos analisados</div>
                </div>
                <div class="stat">
                    <div class="stat-lbl">Mediana</div>
                    <div class="stat-val">{fmt0(mediana)}</div>
                    <div class="stat-sub">Valor central do mercado</div>
                </div>
                <div class="stat">
                    <div class="stat-lbl">Média</div>
                    <div class="stat-val">{fmt0(media)}</div>
                    <div class="stat-sub">Média por valores admitidos</div>
                </div>
                <div class="stat">
                    <div class="stat-lbl">Maior valor</div>
                    <div class="stat-val">{fmt0(maior)}</div>
                    <div class="stat-sub">Teto esperado</div>
                </div>
                </div>
                <a href="data:application/pdf;base64,{b64_relatorio}" download="{nome_relatorio}" class="btn-report">
                    📄 Baixar relatório de pesquisa (capa)
                </a>
                """, unsafe_allow_html=True)

            # ── Histogram na Sidebar ──
            if len(valores) > 0:
                st.sidebar.markdown("---")
                st.sidebar.markdown("**Distribuição de Preços**")
                import pandas as pd
                import numpy as np
                counts, bins = np.histogram(valores, bins=10)
                df_hist = pd.DataFrame({'Faixa': [f"R$ {int(b):,}".replace(',','.') for b in bins[:-1]], 'Contratos': counts})
                st.sidebar.bar_chart(df_hist.set_index('Faixa'))

            # ── Contador ──
            st.markdown(
                f'<div class="results-count">Exibindo <span>{len(resultados)}</span> contratos encontrados para "<span>{item}</span>"</div>',
                unsafe_allow_html=True,
            )

            # ── Grid de cards ──
            # Ordenar resultados
            resultados_ordenados = sorted(resultados, key=lambda x: x['valor'])
            
            cards_html_list = []
            card_colors = ["#f8fafc", "#f0fdf4", "#f0f9ff", "#fffbeb", "#faf5ff", "#fff1f2"]

            for idx, res in enumerate(resultados_ordenados):
                bg_color = card_colors[idx % len(card_colors)]
                valor_fmt = fmt(res['valor'])
                local = f"{res['municipio']}/{res['uf']}" if res.get("municipio") else res.get("uf", "")

                # Badge Outlier Logic
                badge_class = ""
                badge_text = "Dentro do esperado"
                if mediana > 0:
                    if res['valor'] > mediana * 3:
                        badge_class = "danger"
                        badge_text = "Possível Outlier"
                    elif res['valor'] > mediana * 1.5:
                        badge_class = "warn"
                        badge_text = "Acima da Média"

                # Tabela de itens
                itens_html = ""
                if res.get("itens"):
                    rows = ""
                    for it in res["itens"][:8]:
                        vtot = fmt(it['valor_total'])
                        desc_curta = it['descricao'][:45] + "..." if len(it['descricao']) > 45 else it['descricao']
                        rows += f"""
<tr>
  <td>{desc_curta}</td>
  <td style="text-align:center">{it['quantidade']:g}</td>
  <td style="text-align:center"><span class="unit-pill">{it['unidade_medida']}</span></td>
  <td style="text-align:right;font-weight:500">{vtot}</td>
</tr>"""

                    itens_html = f"""
<table class="items-table">
  <thead>
    <tr>
      <th>Descrição</th>
      <th style="text-align:center;width:32px">Qtd</th>
      <th style="text-align:center;width:44px">Und</th>
      <th style="text-align:right;width:74px">Total</th>
    </tr>
  </thead>
  <tbody>{rows}</tbody>
</table>"""

                    if len(res["itens"]) > 8:
                        itens_html += f'<p style="color:#94a3b8;font-size:0.65rem;margin-bottom:8px">... e mais {len(res["itens"]) - 8} itens</p>'

                # Botão PDF Proxy condicional
                btn_pdf = '<span class="btn-solid" style="opacity:0.35;cursor:default">Baixar PDF</span>'
                if res.get("link_pdf"):
                    safe_url = quote_plus(res["link_pdf"])
                    safe_nome = quote_plus(res.get("link_pdf_nome", "documento.pdf"))
                    proxy_url = f"/?download_pdf={safe_url}&nome={safe_nome}"
                    btn_pdf = f'<a href="{proxy_url}" target="_blank" class="btn-solid">Baixar PDF</a>'
                
                # Qtd string
                qtd_str = ""
                try:
                    qtd_num = float(quantidade.replace(',','.')) if quantidade else 0
                    if qtd_num > 0:
                        v_total_calc = res['valor'] * qtd_num
                        qtd_str = f'{quantidade} un • total {fmt(v_total_calc)}'
                except: pass

                card_html = f"""
<div class="result-card" style="background-color: {bg_color};">
  <div class="card-scroll">
    <div class="card-header">
      <div>
        <div class="card-id-lbl">Contrato</div>
        <div class="card-title">{res['titulo']}</div>
      </div>
      <span class="badge {badge_class}"><span class="badge-dot"></span>{badge_text}</span>
    </div>
    <div class="card-meta-grid">
      <div><span class="meta-key">Órgão</span><span class="meta-val" title="{res['orgao']}">{res['orgao'][:25]}{"..." if len(res['orgao'])>25 else ""}</span></div>
      <div><span class="meta-key">Local</span><span class="meta-val">{local}</span></div>
      <div><span class="meta-key">Publicado em</span><span class="meta-val">{res['data_publicacao']}</span></div>
    </div>
    <div class="card-object">{res['descricao'][:180]}{"..." if len(res['descricao'])>180 else ""}</div>
    {itens_html}
  </div>
  <div class="card-footer">
    <div class="price-lbl">Valor unitário</div>
    <div class="price-val">{valor_fmt}</div>
    {f'<div class="price-sub">{qtd_str}</div>' if qtd_str else '<div class="price-sub"><br></div>'}
    <div class="btn-group">
      <a href="{res['link_portal']}" target="_blank" class="btn-ghost">Ver no portal</a>
      {btn_pdf}
    </div>
  </div>
</div>"""
                cards_html_list.append(card_html)

            st.markdown(f'<div class="cards-grid">{"".join(cards_html_list)}</div>', unsafe_allow_html=True)
