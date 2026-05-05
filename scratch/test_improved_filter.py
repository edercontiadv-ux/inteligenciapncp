import unicodedata

def remove_accents(input_str):
    if not isinstance(input_str, str):
        return ""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return u"".join([c for c in nfkd_form if not unicodedata.combining(c)])

def test_filter(item, item_desc):
    palavras_ignoradas = {'aquisicao', 'fornecimento', 'prestacao', 'servico', 'compra', 'contratacao'}
    search_terms = [
        t for t in remove_accents(item.lower()).split() 
        if len(t) > 2 and t not in palavras_ignoradas
    ]
    
    desc = remove_accents(item_desc.lower())
    match = not search_terms or all(term in desc for term in search_terms)
    print(f"Query: '{item}' | Item: '{item_desc}'")
    print(f"Terms: {search_terms} | Match: {match}\n")

test_filter("Aquisição de Veículo 1.0", "VEICULO AUTOMOTOR 1.0")
test_filter("Aquisição de Veículo 1.0", "FILTRO DE AR")
test_filter("Fornecimento de Notebook", "NOTEBOOK CORE I5")
test_filter("Fornecimento de Notebook", "MOUSE OPTICO")
