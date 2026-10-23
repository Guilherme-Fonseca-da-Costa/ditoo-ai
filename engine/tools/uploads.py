"""Validate filenames and publish complete uploads atomically."""
import os
import tempfile
from fastapi import HTTPException

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".csv", ".xlsx"}


def nome_upload(filename):
    nome = (filename or "").replace("\\", "/").rsplit("/", 1)[-1].strip()
    if not nome or nome in {".", ".."} or any(c in nome for c in '<>:"|?*') or any(ord(c) < 32 for c in nome) or nome.endswith("."):
        raise HTTPException(status_code=400, detail="Nome de arquivo inv\u00e1lido.")
    stem = nome.split('.')[0].upper()
    if stem in {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}:
        raise HTTPException(status_code=400, detail="Nome de arquivo inv\u00e1lido.")
    if os.path.splitext(nome)[1].lower() not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato n\u00e3o suportado. Envie PDF, TXT, CSV ou XLSX.")
    return nome


def salvar_upload(stream, pasta, nome):
    nome = nome_upload(nome)
    limite = int(os.getenv("DITOO_MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))
    os.makedirs(pasta, exist_ok=True)
    temporario = None
    try:
        with tempfile.NamedTemporaryFile(dir=pasta, suffix=".upload", delete=False) as destino:
            temporario = destino.name
            total = 0
            while bloco := stream.read(1024 * 1024):
                total += len(bloco)
                if total > limite:
                    raise HTTPException(status_code=413, detail="O arquivo excede o limite de upload.")
                destino.write(bloco)
        if os.path.getsize(temporario) == 0:
            raise HTTPException(status_code=400, detail="O arquivo enviado est\u00e1 vazio.")
        caminho = os.path.join(pasta, nome)
        try:
            os.link(temporario, caminho)
        except FileExistsError:
            raise HTTPException(status_code=409, detail="J\u00e1 existe um arquivo com este nome nesta pasta.")
        return caminho
    finally:
        if temporario and os.path.exists(temporario):
            os.remove(temporario)


async def progresso_indexacao(caminho, nome, folder_id, indexar, finalizar):
    """Stream real chunk counts while indexing in a worker thread."""
    import asyncio
    import json
    loop = asyncio.get_running_loop()
    eventos = asyncio.Queue()

    def emitir(evento):
        loop.call_soon_threadsafe(eventos.put_nowait, evento)

    def trabalho():
        try:
            def progresso(concluidos, total):
                emitir({"type":"indexing", "completed":concluidos, "total":total})
            indexado = bool(indexar(caminho, on_progress=progresso))
            mensagem = (f"Arquivo {nome} enviado e indexado com sucesso!" if indexado else
                        f"Arquivo {nome} recebido, mas n\u00e3o foi poss\u00edvel index\u00e1-lo. Verifique se cont\u00e9m texto leg\u00edvel.")
            resultado = {"message":mensagem,"filename":nome,"folder_id":folder_id,"indexed":indexado}
        except Exception as exc:
            print(f"ERRO ao indexar upload {nome}: {exc}")
            resultado = {"message":f"Arquivo {nome} recebido, mas a indexa\u00e7\u00e3o falhou. Tente reindexar o documento.",
                         "filename":nome,"folder_id":folder_id,"indexed":False}
        finally:
            finalizar()
        emitir({"type":"result","result":resultado})

    yield json.dumps({"type":"indexing","completed":0,"total":None}) + "\n"
    tarefa = asyncio.create_task(asyncio.to_thread(trabalho))
    try:
        while True:
            evento = await eventos.get()
            yield json.dumps(evento, ensure_ascii=False) + "\n"
            if evento["type"] == "result":
                break
    finally:
        # Worker retains the cleanup callback even if the client disconnects.
        await asyncio.shield(tarefa)
