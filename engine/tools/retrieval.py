"""Apply folder access and explicit filenames before ranking document chunks."""
import re

def buscar_documentos_permitidos(collection, texto, accessible_ids):
    vazio = {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    if accessible_ids is not None and not accessible_ids:
        return vazio
    quantidade = collection.count()
    if not quantidade:
        return vazio
    parametros = {"query_texts": [texto], "n_results": min(20, quantidade),
                  "include": ["documents", "metadatas", "distances"]}
    filters = []
    if accessible_ids is not None:
        filters.append({"folder_id": {"$in": sorted(accessible_ids)}})
    # Explicit filenames must constrain retrieval before the top-20 ranking.
    # Quoted names support spaces; unquoted names support ordinary filename tokens.
    quoted = re.findall(r'["\u201c]([^"\u201d\n]+\.(?:pdf|txt|csv|xlsx))["\u201d]', texto, re.IGNORECASE)
    names = quoted or re.findall(r'(?<![\w.-])([\w.-]+\.(?:pdf|txt|csv|xlsx))\b', texto, re.IGNORECASE)
    if names:
        filters.append({"fonte": {"$in": sorted(set(names))}})
    if filters:
        parametros["where"] = filters[0] if len(filters) == 1 else {"$and": filters}
    return collection.query(**parametros)
