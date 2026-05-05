import unicodedata

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def test_relevance(item, item_desc):
    palavras_ignoradas = {'aquisicao', 'fornecimento', 'prestacao', 'servico', 'compra', 'contratacao'}
    search_terms = [
        t for t in remove_accents(item.lower()).split() 
        if len(t) > 2 and t not in palavras_ignoradas
    ]
    
    desc = remove_accents(item_desc.lower())
    
    match = False
    if not search_terms:
        match = True
    elif all(term in desc for term in search_terms):
        palavras_desc = [w for w in desc.replace('(', ' ').replace(')', ' ').split() if len(w) > 3 and w not in palavras_ignoradas]
        match = True
        if palavras_desc:
            primeira_palavra_item = palavras_desc[0]
            if primeira_palavra_item not in search_terms:
                if desc.find(search_terms[0]) > 35:
                    match = False
                    
    print(f"Query: '{item}' | Item: '{item_desc}'")
    print(f"Terms: {search_terms} | Match: {match}\n")

# Deve falhar (Filtro não é Veículo)
test_relevance("Aquisição de Veículo 1.0", "Aquisição de 02(dois) Filtro do Ar motor a ser utilizado no veiculo chevrolet / onix 1.0")

# Deve passar (Veículo é o começo)
test_relevance("Aquisição de Veículo 1.0", "VEICULO AUTOMOTOR 1.0")

# Deve passar (Prefixo ignorado, Veículo é o primeiro relevante)
test_relevance("Aquisição de Veículo 1.0", "FORNECIMENTO DE VEICULO 1.0")
