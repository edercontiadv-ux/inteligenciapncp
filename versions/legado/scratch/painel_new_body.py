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
            limit=15,
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

        for idx, res in enumerate(resultados_ordenados, 1):
            val_total = res['valor']
            
            # Cálculo de outlier do card
            if m_mdn > 0:
                if val_total > m_mdn * 3:
                    badge_class = "badge-danger"
                    badge_text = "🔴 Possível Outlier"
                elif val_total > m_mdn * 1.5:
                    badge_class = "badge-warn"
                    badge_text = "🟡 Acima da Média"
                else:
                    badge_class = "badge-ok"
                    badge_text = "🟢 Dentro do Esperado"
            else:
                badge_class = "badge-ok"
                badge_text = "🟢 Dentro do Esperado"
                
            local = f"{res['municipio']}/{res['uf']}" if res.get('municipio') else res.get('uf', '')
            
            # Calcular valor unitário geral se a quantidade principal foi fornecida
            price_html = f'<div class="price-container"><div class="card-price-total">💰 Total: {fmt_brl(val_total)}</div>'
            try:
                qtd_num = float(quantidade.replace(',','.')) if quantidade else 0
                if qtd_num > 0:
                    v_unit = val_total / qtd_num
                    price_html += f'<div class="card-price-unit">⚖️ Unitário ref.: {fmt_brl(v_unit)}</div>'
            except: pass
            price_html += '</div>'

            # Montar tabela de itens
            itens_html = ""
            if res.get("itens"):
                rows = ""
                for it in res["itens"][:8]:
                    vunit = fmt_brl(it['valor_unitario'])
                    vtot = fmt_brl(it['valor_total'])
                    rows += f'<tr><td>{it["descricao"][:60]}</td><td style="text-align:center">{it["quantidade"]:g}</td><td style="text-align:center"><span class="unit-badge">{it["unidade_medida"]}</span></td><td style="text-align:right">{vunit}</td><td style="text-align:right">{vtot}</td></tr>'

                itens_html = f'<table class="items-table"><thead><tr><th>Descrição do Item</th><th style="text-align:center">Qtd</th><th style="text-align:center">Unidade</th><th style="text-align:right">Vlr. Unit.</th><th style="text-align:right">Vlr. Total</th></tr></thead><tbody>{rows}</tbody></table>'
                if len(res["itens"]) > 8:
                    itens_html += f'<p style="color:var(--text-muted);font-size:0.78rem;margin-top:4px;">... e mais {len(res["itens"]) - 8} itens</p>'

            # Montar botões
            btns = f'<a href="{res["link_portal"]}" target="_blank" class="btn-portal">🌐 Ver no Portal</a>'
            if res.get("link_pdf"):
                safe_url = quote_plus(res["link_pdf"])
                safe_nome = quote_plus(res.get("link_pdf_nome", "documento.pdf"))
                proxy_url = f"/?download_pdf={safe_url}&nome={safe_nome}"
                btns += f'<a href="{proxy_url}" target="_blank" class="btn-pdf">📄 Baixar PDF</a>'

            card_html = f'<div class="result-card"><div class="card-header"><div class="card-title">{res["titulo"]}</div><span class="status-badge {badge_class}">{badge_text}</span></div><div class="card-meta">🏢 <b>Órgão:</b> {res["orgao"]}</div><div class="card-meta">📍 <b>Local:</b> {local}</div><div class="card-meta">📅 <b>Publicado em:</b> {res["data_publicacao"]}</div><div class="card-meta">📝 <b>Objeto:</b> {res["descricao"][:200]}</div>{price_html}{itens_html}<div class="btn-group">{btns}</div></div>'
            st.markdown(card_html, unsafe_allow_html=True)
