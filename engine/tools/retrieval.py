"""Apply folder access before ranking document chunks."""

def buscar_documentos_permitidos(collection, texto, accessible_ids):
    vazio = {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    if accessible_ids is not None and not accessible_ids:
        return vazio
    quantidade = collection.count()
    if not quantidade:
        return vazio
    parametros = {"query_texts": [texto], "n_results": min(20, quantidade),
                  "include": ["documents", "metadatas", "distances"]}
    if accessible_ids is not None:
        parametros["where"] = {"folder_id": {"$in": sorted(accessible_ids)}}
    return collection.query(**parametros)
