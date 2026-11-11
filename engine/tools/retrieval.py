"""Apply folder access and explicit filenames before ranking document chunks."""
import re

def buscar_documentos_permitidos(collection, texto, accessible_ids, max_results=20, *, diversify=False):
    vazio = {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    if accessible_ids is not None and not accessible_ids:
        return vazio
    quantidade = collection.count()
    if not quantidade:
        return vazio
    parametros = {"query_texts": [texto], "n_results": min(max_results, quantidade),
                  "include": ["documents", "metadatas", "distances"]}
    filters = []
    if accessible_ids is not None:
        filters.append({"folder_id": {"$in": sorted(accessible_ids)}})
    # Explicit filenames must constrain retrieval before the top-20 ranking.
    # Quoted names support spaces; unquoted names support ordinary filename tokens.
    quoted = re.findall(r'["\u201c]([^"\u201d\n]+\.(?:pdf|docx|txt|csv|xlsx))["\u201d]', texto, re.IGNORECASE)
    names = quoted or re.findall(r'(?<![\w.-])([\w.-]+\.(?:pdf|docx|txt|csv|xlsx))\b', texto, re.IGNORECASE)
    if names:
        filters.append({"fonte": {"$in": sorted(set(names))}})
    if filters:
        parametros["where"] = filters[0] if len(filters) == 1 else {"$and": filters}
    results = collection.query(**parametros)
    if not diversify or names or not results["metadatas"][0]:
        return results

    # A file with many similar chunks can fill every slot in the first query.
    seen = sorted({meta["fonte"] for meta in results["metadatas"][0]})
    alternate_filters = filters + [{"fonte": {"$nin": seen}}]
    alternate = collection.query(
        **{**parametros, "n_results": min(8, quantidade),
           "where": alternate_filters[0] if len(alternate_filters) == 1 else {"$and": alternate_filters}})
    for key in ("documents", "metadatas", "distances"):
        results[key][0].extend(alternate[key][0])
    return results
