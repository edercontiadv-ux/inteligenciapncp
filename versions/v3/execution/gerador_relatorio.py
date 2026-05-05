from fpdf import FPDF
import datetime

class RelatorioPNCP(FPDF):
    def header(self):
        # Cabeçalho decorativo superior
        self.set_fill_color(26, 86, 219)  # Azul institucional
        self.rect(0, 0, 210, 35, 'F')
        
        self.set_y(10)
        self.set_font('Arial', 'B', 18)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'RELATÓRIO DE PESQUISA DE PREÇOS', 0, 1, 'C')
        
        self.set_font('Arial', '', 10)
        self.cell(0, 5, 'Portal Nacional de Contratações Públicas (PNCP)', 0, 1, 'C')
        self.ln(15)

    def footer(self):
        self.set_y(-20)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128)
        self.line(40, self.get_y(), 190, self.get_y())
        self.cell(0, 10, f'Página {self.page_no()} | Documento gerado em {datetime.datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 0, 'C')

def gerar_pdf_pesquisa(termo_pesquisa, resultados, metricas, filtros):
    # Configuração de Margens (Esquerda: 40mm para grampo, Superior/Direita: 20mm)
    pdf = RelatorioPNCP(orientation='P', unit='mm', format='A4')
    pdf.set_margins(40, 20, 20)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)
    
    # Reset cor de texto para o corpo
    pdf.set_text_color(0, 0, 0)
    
    # ─── Seção 1: Parâmetros ───
    pdf.ln(5)
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(245, 247, 250)
    pdf.cell(0, 8, ' 1. INFORMAÇÕES DA PESQUISA', 0, 1, 'L', fill=True)
    pdf.ln(3)
    
    def add_field(label, value):
        pdf.set_font('Arial', 'B', 10)
        pdf.set_text_color(70, 70, 70)
        pdf.cell(40, 7, f'{label}:', 0, 0)
        pdf.set_font('Arial', '', 10)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 7, str(value), 0, 1)

    add_field('Objeto Buscado', termo_pesquisa.upper())
    add_field('Período', 'Últimos 10 meses')
    add_field('Fonte', 'PNCP (Governo Federal)')
    
    if filtros:
        for k, v in filtros.items():
            if v: add_field(k, v)
    
    pdf.ln(5)
    
    # ─── Seção 2: Resumo Estatístico ───
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(245, 247, 250)
    pdf.cell(0, 8, ' 2. ANÁLISE ESTATÍSTICA DE MERCADO', 0, 1, 'L', fill=True)
    pdf.ln(4)
    
    # Layout de Tabela Estatística
    available_width = pdf.w - pdf.l_margin - pdf.r_margin
    col_width = available_width / 4
    
    pdf.set_font('Arial', 'B', 9)
    pdf.set_fill_color(230, 235, 245)
    pdf.cell(col_width, 10, 'MENOR VALOR', 1, 0, 'C', fill=True)
    pdf.cell(col_width, 10, 'MEDIANA', 1, 0, 'C', fill=True)
    pdf.cell(col_width, 10, 'MÉDIA', 1, 0, 'C', fill=True)
    pdf.cell(col_width, 10, 'AMOSTRAGEM', 1, 1, 'C', fill=True)
    
    def fmt(v): return f'R$ {v:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    
    pdf.set_font('Arial', 'B', 11)
    pdf.cell(col_width, 12, fmt(metricas.get("minimo", 0)), 1, 0, 'C')
    pdf.cell(col_width, 12, fmt(metricas.get("mediana", 0)), 1, 0, 'C')
    pdf.cell(col_width, 12, fmt(metricas.get("media", 0)), 1, 0, 'C')
    pdf.set_font('Arial', '', 10)
    pdf.cell(col_width, 12, f'{metricas.get("total_encontrado", 0)} itens', 1, 1, 'C')
    
    pdf.ln(10)
    
    # ─── Seção 3: Itens Referenciados ───
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(245, 247, 250)
    pdf.cell(0, 8, ' 3. DETALHAMENTO DAS REFERÊNCIAS', 0, 1, 'L', fill=True)
    pdf.ln(5)
    
    for i, res in enumerate(resultados, 1):
        if pdf.get_y() > 240:
            pdf.add_page()
            pdf.ln(10)
            
        try:
            titulo = f'REF #{i:02d} - {res["titulo"][:70]}'.encode('latin-1', 'replace').decode('latin-1')
            orgao = res["orgao"].encode('latin-1', 'replace').decode('latin-1')
            municipio = f'{res["municipio"]}/{res["uf"]}'.encode('latin-1', 'replace').decode('latin-1')
            desc = res["descricao"].strip().encode('latin-1', 'replace').decode('latin-1')
        except:
            titulo, orgao, municipio, desc = f"REF #{i}", "N/I", "N/I", "N/I"

        pdf.set_font('Arial', 'B', 10)
        pdf.set_text_color(26, 86, 219)
        pdf.cell(0, 8, titulo, 'B', 1, 'L')
        
        pdf.set_text_color(0, 0, 0)
        pdf.ln(1)
        
        pdf.set_font('Arial', 'B', 9)
        pdf.cell(25, 5, 'Órgão:', 0, 0)
        pdf.set_font('Arial', '', 9)
        pdf.cell(0, 5, orgao, 0, 1)
        
        pdf.set_font('Arial', 'B', 9)
        pdf.cell(25, 5, 'Local:', 0, 0)
        pdf.set_font('Arial', '', 9)
        pdf.cell(0, 5, f'{municipio}  |  Publicado em {res["data_publicacao"]}', 0, 1)

        # Link para Rastreabilidade
        pdf.set_font('Arial', 'B', 9)
        pdf.cell(25, 5, 'Link PNCP:', 0, 0)
        pdf.set_font('Arial', '', 8)
        pdf.set_text_color(26, 86, 219)
        pdf.cell(0, 5, res["link_portal"], 0, 1, link=res["link_portal"])
        pdf.set_text_color(0, 0, 0)
        
        pdf.set_fill_color(240, 250, 240)
        pdf.set_font('Arial', 'B', 10)
        pdf.cell(0, 8, f'  VALOR UNITÁRIO HOMOLOGADO: {fmt(res["valor"])}', 0, 1, 'L', fill=True)
        
        pdf.set_font('Arial', 'I', 8)
        pdf.set_text_color(80, 80, 80)
        pdf.multi_cell(0, 4, f'Objeto: {desc}', 0, 'L')
        
        pdf.ln(6)

    return pdf.output(dest='S')
