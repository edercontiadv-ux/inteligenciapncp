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
else:
    # ─── AUTENTICAÇÃO FIREBASE ───
    FIREBASE_API_KEY = "AIzaSyBo_a1Gn2juQqR8rsCOEWcm7lszhpzkdo8"
    
    if 'usuario_logado' not in st.session_state:
        st.session_state['usuario_logado'] = False

    if not st.session_state['usuario_logado']:
        # ─── SKILL: Design High-End para Login ───
        st.markdown("""
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            #MainMenu, footer, header {visibility: hidden;}
            
            .stApp {
                background: radial-gradient(circle at 50% 50%, #060B1A 0%, #02040A 100%) !important;
                font-family: 'Outfit', sans-serif;
            }

            /* Container Premium - Glassmorphism Profundo */
            [data-testid="stColumn"]:nth-of-type(2) [data-testid="stVerticalBlock"] {
                background: rgba(255, 255, 255, 0.02) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-radius: 40px !important;
                padding: 100px 70px !important;
                backdrop-filter: blur(40px) brightness(1.2) !important;
                box-shadow: 0 60px 150px -30px rgba(0, 0, 0, 0.9) !important;
                max-width: 850px !important;
                margin: 100px auto !important;
                text-align: center;
                position: relative;
                overflow: hidden;
            }

            /* Efeito de Luz Difusa no Fundo do Card */
            [data-testid="stColumn"]:nth-of-type(2) [data-testid="stVerticalBlock"]::before {
                content: '';
                position: absolute;
                top: -50%; left: -50%; width: 200%; height: 200%;
                background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
                pointer-events: none;
            }
            
            /* Título "HERO" com Bricolage Grotesque */
            .login-title {
                font-family: 'Bricolage Grotesque', sans-serif !important;
                color: #FFFFFF !important;
                font-size: 5.5rem !important;
                font-weight: 800 !important;
                margin-bottom: 10px !important;
                letter-spacing: -4px !important;
                line-height: 0.9 !important;
                background: linear-gradient(180deg, #FFFFFF 0%, #60A5FA 100%);
                -webkit-background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
            }
            .login-subtitle {
                color: #64748b !important;
                font-size: 1.6rem !important;
                margin-bottom: 70px !important;
                font-weight: 300 !important;
                letter-spacing: 0.5px;
            }
            
            /* Form Style */
            div[data-testid="stForm"] {
                border: none !important;
                padding: 0 !important;
                background: transparent !important;
                width: 100% !important;
                max-width: 550px !important;
            }

            /* Inputs com Design Limpo e Moderno */
            div[data-testid="stTextInput"] label p {
                color: #94a3b8 !important;
                font-weight: 600 !important;
                font-size: 1.1rem !important;
                margin-bottom: 12px !important;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            div[data-testid="stTextInput"] input {
                background-color: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                color: white !important;
                border-radius: 20px !important;
                padding: 35px 25px !important;
                font-size: 1.6rem !important;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
                height: 85px !important;
            }
            div[data-testid="stTextInput"] input:focus {
                border-color: #3b82f6 !important;
                background-color: rgba(255, 255, 255, 0.06) !important;
                box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.15) !important;
            }
            
            /* Botão de Login de Alta Performance */
            div[data-testid="stFormSubmitButton"] button {
                background: #FFFFFF !important;
                color: #02040A !important;
                font-family: 'Bricolage Grotesque', sans-serif !important;
                font-weight: 800 !important;
                font-size: 1.8rem !important;
                border-radius: 24px !important;
                padding: 45px !important;
                border: none !important;
                margin-top: 40px !important;
                width: 100% !important;
                text-transform: uppercase;
                letter-spacing: 2px;
                box-shadow: 0 20px 60px -10px rgba(255, 255, 255, 0.2);
                transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1) !important;
                height: auto !important;
            }
            div[data-testid="stFormSubmitButton"] button:hover {
                background: #3b82f6 !important;
                color: #FFFFFF !important;
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 40px 80px -20px rgba(59, 130, 246, 0.4);
            }
            
            /* Links de Apoio */
            .login-footer-links {
                display: flex;
                justify-content: space-between;
                margin-top: 35px;
                width: 100%;
            }
            .login-footer-links a, .login-footer-links span {
                color: #475569;
                font-size: 1.1rem;
                text-decoration: none;
                transition: color 0.3s ease;
                font-weight: 500;
            }
            .login-footer-links a:hover { color: #FFFFFF; }

            /* Grid de Fundo Texturizado */
            .bg-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background-image: 
                    radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 0),
                    url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
                background-size: 80px 80px, auto;
                opacity: 0.4;
                z-index: -1;
            }
        </style>
        <div class="bg-overlay"></div>
        """, unsafe_allow_html=True)
        
        _, col_login, _ = st.columns([0.05, 0.9, 0.05])
        
        with col_login:
            st.markdown('<h1 class="login-title">Inteligência PNCP</h1>', unsafe_allow_html=True)
            st.markdown('<p class="login-subtitle">Ecossistema de Inteligência em Compras Públicas</p>', unsafe_allow_html=True)
            
            with st.form("login_form"):
                email = st.text_input("Credencial", placeholder="seu@email.com")
                senha = st.text_input("Chave de Acesso", type="password", placeholder="••••••••")
                
                st.markdown("""
                <div class="login-footer-links">
                    <span><input type="checkbox" id="remember" style="margin-right: 12px; transform: scale(1.6); vertical-align: middle;"> Manter conectado</span>
                    <a href="#">Recuperar acesso</a>
                </div>
                """, unsafe_allow_html=True)
                
                submit = st.form_submit_button("ENTRAR NO SISTEMA", use_container_width=True)
                
                if submit:
                    if not email or not senha:
                        st.warning("Preencha todos os campos.")
                    else:
                        with st.spinner("Autenticando..."):
                            try:
                                url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
                                r = requests.post(url, json={"email": email, "password": senha, "returnSecureToken": True})
                                if r.status_code == 200:
                                    st.session_state['usuario_logado'] = True
                                    st.rerun()
                                else:
                                    st.error("Credenciais incorretas.")
                            except Exception as e:
                                st.error("Erro de conexão.")
            
            st.markdown("""
            <p style="text-align: center; color: #475569; margin-top: 60px; font-size: 1.2rem; font-weight: 500; letter-spacing: 1px;">
                © 2026 Inteligência PNCP • <a href="#" style="color: #3b82f6; text-decoration: none;">Suporte Exclusivo</a>
            </p>
            """, unsafe_allow_html=True)
        st.stop()
    
    
    # ─── DESIGN DASHBOARD SKILL ───
    st.markdown("""
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@800&family=Outfit:wght@300;400;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
    <style>
        #MainMenu, footer, header {visibility: hidden;}
        
        .stApp {
            background: radial-gradient(circle at 50% 50%, #060B1A 0%, #02040A 100%) !important;
            font-family: 'Outfit', sans-serif;
            color: #FFFFFF;
        }

        /* ── Sidebar Style ── */
        [data-testid="stSidebar"] {
            background-color: rgba(2, 4, 10, 0.7) !important;
            backdrop-filter: blur(20px) !important;
            border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        /* ── Hero / Branding ── */
        .hero {
            text-align: left;
            padding: 60px 0 40px;
            animation: fadeIn 1s ease-out;
        }
        .hero h1 {
            font-family: 'Bricolage Grotesque', sans-serif;
            font-size: 3.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #FFFFFF 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            letter-spacing: -2px;
        }
        .hero p {
            color: #94a3b8;
            font-size: 1.2rem;
            font-weight: 300;
            max-width: 600px;
        }

        /* ── Search Container ── */
        .search-container {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 30px;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
        }

        /* Streamlit Widget Overrides */
        div[data-testid="stTextInput"] input {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            color: white !important;
            padding: 12px !important;
        }
        div[data-testid="stTextInput"] label p {
            color: #94a3b8 !important;
            font-weight: 600 !important;
        }
        .stButton>button {
            background: #3b82f6 !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 20px !important;
            font-weight: 700 !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .stButton>button:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        /* ── Stats Grid ── */
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 50px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            overflow: hidden;
            transition: transform 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card::after {
            content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
        }
        .stat-card.blue::after { background: #3b82f6; }
        .stat-card.green::after { background: #10b981; }
        .stat-card.gray::after { background: #64748b; }
        .stat-card.red::after { background: #ef4444; }

        .stat-title {
            font-size: 0.8rem;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .stat-value {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.8rem;
            font-weight: 500;
            color: #FFFFFF;
        }
        .stat-sub { font-size: 0.8rem; color: #475569; margin-top: 5px; }

        /* ── Results Cards ── */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 25px;
        }
        .result-card {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 24px;
            padding: 30px;
            display: flex;
            flex-direction: column;
            transition: all 0.4s ease;
            animation: cardReveal 0.6s ease-out backwards;
        }
        .result-card:hover {
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            transform: translateY(-8px);
        }

        @keyframes cardReveal {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .card-id { font-size: 0.7rem; color: #3b82f6; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .card-title { font-size: 1.25rem; font-weight: 600; color: #FFFFFF; margin: 5px 0 20px; line-height: 1.3; }
        
        .badge {
            background: rgba(59, 130, 246, 0.1);
            color: #60a5fa;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .badge.warn { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
        .badge.danger { background: rgba(239, 68, 68, 0.1); color: #f87171; }

        .meta-group { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { font-size: 0.65rem; color: #475569; font-weight: 700; text-transform: uppercase; }
        .meta-val { font-size: 0.85rem; color: #cbd5e1; margin-top: 2px; }

        .object-box {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 15px;
            font-size: 0.85rem;
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 255, 255, 0.03);
        }

        .price-hero { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; }
        .price-label { font-size: 0.7rem; color: #475569; font-weight: 700; text-transform: uppercase; }
        .price-val { font-family: 'JetBrains Mono', monospace; font-size: 1.8rem; font-weight: 500; color: #10b981; }

        .btn-group { display: flex; gap: 10px; margin-top: 20px; }
        .btn-action {
            flex: 1; text-align: center; padding: 12px; border-radius: 10px;
            font-size: 0.85rem; font-weight: 600; text-decoration: none;
            transition: all 0.2s;
        }
        .btn-portal { background: rgba(255, 255, 255, 0.05); color: #FFFFFF !important; border: 1px solid rgba(255, 255, 255, 0.1); }
        .btn-portal:hover { background: rgba(255, 255, 255, 0.1); }
        .btn-pdf { background: #3b82f6; color: #FFFFFF !important; }
        .btn-pdf:hover { background: #2563eb; }

        /* Animations */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
    """, unsafe_allow_html=True)
    
    # ─── Hero ───
    st.markdown("""
    <div class="hero">
        <h1>Inteligência PNCP</h1>
        <p>Análise estratégica e monitoramento em tempo real de editais, atas e contratos em todo o território nacional.</p>
    </div>
    """, unsafe_allow_html=True)
    
    # ─── Formulário de Busca ───
    st.markdown('<div class="search-container">', unsafe_allow_html=True)
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        item = st.text_input("Item Estratégico", placeholder="Ex: Equipamentos Médicos, Software, Obras Civis...")
    with col2:
        quantidade = st.text_input("Volumetria", placeholder="Qtd")
    with col3:
        unidade = st.text_input("Unidade", placeholder="un, m2, global")
    
    buscar = st.button("EXECUTAR ANÁLISE DE MERCADO", use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
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
            st.markdown("### 📊 Inteligência de Mercado")
            
            def fmt_brl(v): return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            
            is_outlier = m_max > m_mdn * 3 if m_mdn > 0 else False
            max_status = "red" if is_outlier else ("yellow" if m_max > m_mdn * 1.5 else "green")
            
            cards_html = f"""
            <div class="stat-grid">
                <div class="stat-card green">
                    <div class="stat-title">📉 Piso de Mercado</div>
                    <div class="stat-value">{fmt_brl(m_min)}</div>
                    <div class="stat-sub">{n_precos} fontes analisadas</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-title">〜 Mediana Estratégica</div>
                    <div class="stat-value">{fmt_brl(m_mdn)}</div>
                    <div class="stat-sub">Referência central</div>
                </div>
                <div class="stat-card gray">
                    <div class="stat-title">⌀ Média Ponderada</div>
                    <div class="stat-value">{fmt_brl(m_med)}</div>
                    <div class="stat-sub">Média aritmética</div>
                </div>
                <div class="stat-card {max_status}">
                    <div class="stat-title">📈 Teto de Mercado {'⚠' if is_outlier else ''}</div>
                    <div class="stat-value">{fmt_brl(m_max)}</div>
                    <div class="stat-sub">Limite superior</div>
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
                
                # Cálculo de status
                if m_mdn > 0:
                    if val_unitario > m_mdn * 3:
                        badge_class = "danger"
                        badge_text = "OUTLIER"
                    elif val_unitario > m_mdn * 1.5:
                        badge_class = "warn"
                        badge_text = "ACIMA DA MÉDIA"
                    else:
                        badge_class = ""
                        badge_text = "REFERÊNCIA IDEAL"
                else:
                    badge_class = ""
                    badge_text = "REFERÊNCIA"
                    
                local = f"{res['municipio']}/{res['uf']}" if res.get('municipio') else res.get('uf', '')
                
                # Qtd/Total Format
                qtd_str = ""
                try:
                    qtd_num = float(quantidade.replace(',','.')) if quantidade else 0
                    if qtd_num > 0:
                        v_total_calc = val_unitario * qtd_num
                        qtd_str = f'{quantidade} {unidade or "un"} • total {fmt_brl(v_total_calc)}'
                except: pass
                
                orgao_nome = res["orgao"][:45] + "..." if len(res["orgao"]) > 45 else res["orgao"]

                # PDF Button
                btn_pdf_html = ""
                if res.get("link_pdf"):
                    safe_url = quote_plus(res["link_pdf"])
                    safe_nome = quote_plus(res.get("link_pdf_nome", "documento.pdf"))
                    proxy_url = f"/?download_pdf={safe_url}&nome={safe_nome}"
                    btn_pdf_html = f'<a href="{proxy_url}" target="_blank" class="btn-action btn-pdf">BAIXAR PDF</a>'
                else:
                    btn_pdf_html = '<div class="btn-action btn-portal" style="opacity:0.3; cursor:not-allowed;">SEM PDF</div>'
                
                # Staggered animation delay
                delay = (idx % 5) * 0.1

                card_html = f"""
<div class="result-card" style="animation-delay: {delay}s">
    <div class="card-id">CONTRATO • {res['titulo'].replace('Contrato ', '')}</div>
    <div class="card-title">{res['titulo']}</div>
    <div style="margin-bottom: 20px;">
        <span class="badge {badge_class}">{badge_text}</span>
    </div>
    
    <div class="meta-group">
        <div class="meta-item">
            <span class="meta-label">Órgão Comprador</span>
            <span class="meta-val" title="{res['orgao']}">{orgao_nome}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Localidade</span>
            <span class="meta-val">{local}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Publicação</span>
            <span class="meta-val">{res["data_publicacao"]}</span>
        </div>
    </div>
    
    <div class="object-box">
        {res["descricao"][:250]}...
    </div>
    
    <div class="price-hero">
        <span class="price-label">Valor Unitário</span>
        <div class="price-val">{fmt_brl(val_unitario)}</div>
        {f'<div style="color:#64748b; font-size:0.8rem; margin-top:4px;">{qtd_str}</div>' if qtd_str else ''}
    </div>
    
    <div class="btn-group">
        <a href="{res["link_portal"]}" target="_blank" class="btn-action btn-portal">VER PORTAL</a>
        {btn_pdf_html}
    </div>
</div>
"""
                cards_html_list.append(card_html)
                
            st.markdown(f'<div class="cards-grid">{"".join(cards_html_list)}</div>', unsafe_allow_html=True)
