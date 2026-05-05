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
    layout="centered",
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
