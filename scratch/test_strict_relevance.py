import unicodedata

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def test_strict_relevance(item, item_desc):
    palavras_ignoradas = {
        'aquisicao', 'fornecimento', 'prestacao', 'servico', 'compra', 'contratacao',
        'item', 'peca', 'pecas', 'material', 'para', 'com', 'pelo', 'pela'
    }
    search_terms = [
        t for t in remove_accents(item.lower()).split() 
        if len(t) > 2 and t not in palavras_ignoradas
    ]
    
    desc = remove_accents(item_desc.lower())
    
    match = False
    if not search_terms:
        match = True
    elif all(term in desc for term in search_terms):
        palavras_desc = [w for w in desc.replace('(', ' ').replace(')', ' ').replace('-', ' ').split() if len(w) > 3 and w not in palavras_ignoradas]
        match = True
        if palavras_desc:
            cabecalho_item = palavras_desc[:2]
            if not any(termo in cabecalho_item for termo in search_terms):
                match = False
                    
    print(f"Query: '{item}' | Item: '{item_desc}'")
    print(f"Terms: {search_terms} | Match: {match}\n")

# Deve falhar (Filtro é a 1ª palavra relevante, Veículo é a 3ª)
# Desc: FILTRO (1) DO AR (X) MOTOR (2) VEICULO (3)
test_strict_relevance("Aquisição de Veículo 1.0", "FILTRO DO AR MOTOR VEICULO ONIX JOY 1.0 ANO 2019")

# Deve passar (Veículo é a 1ª palavra relevante)
test_strict_relevance("Aquisição de Veículo 1.0", "VEICULO AUTOMOTOR 1.0")

# Deve passar (Prefixo ignorado, Veículo é a 1ª relevante)
test_strict_relevance("Aquisição de Veículo 1.0", "AQUISICAO DE VEICULO 1.0")
