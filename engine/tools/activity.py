"""Stream observable execution stages, separately from answer text."""
import asyncio
from contextvars import ContextVar
import json

_EMIT = ContextVar("ditoo_activity", default=None)
MESSAGES = {
    "received":"Recebendo sua pergunta...",
    "permissions":"Verificando os documentos dispon\u00edveis...",
    "search":"Procurando informa\u00e7\u00f5es nos documentos...",
    "file":"Lendo o arquivo",
    "table":"Lendo as planilhas e colunas...",
    "planning":"Preparando a consulta com o modelo...",
    "code":"Executando a consulta nos dados...",
    "code_generation":"Gerando e executando c\u00f3digo de an\u00e1lise...",
    "validating":"Conferindo o resultado da an\u00e1lise...",
    "retry":"Ajustando a consulta e tentando novamente...",
    "model":"Preparando o modelo para responder...",
    "generating":"Gerando a resposta...",
    "formatting":"Organizando o resultado...",
    "percentage":"Conferindo o percentual no documento...",
    "clock":"Consultando a data e a hora do servidor...",
    "complete":"Resposta conclu\u00edda",
}


def emitir_etapa(stage, detail=None):
    callback = _EMIT.get()
    if callback is not None and stage in MESSAGES:
        message = MESSAGES[stage]
        if detail:
            message += f": {detail}"
        callback(json.dumps({"type":"status", "stage":stage,"message":message}, ensure_ascii=False) + "\n")


async def transmitir_processamento(preparar):
    """Run preparation and streaming on the same worker, without blocking status delivery."""
    queue = asyncio.Queue()
    loop = asyncio.get_running_loop()
    def send(event):
        loop.call_soon_threadsafe(queue.put_nowait, event)

    async def executar():
        response = await preparar()
        async for chunk in response.body_iterator:
            send(chunk)
        emitir_etapa("complete")

    def worker():
        token = _EMIT.set(send)
        try:
            asyncio.run(executar())
        except Exception as exc:
            print(f"ERRO ao responder: {type(exc).__name__}: {exc}")
            send(json.dumps({"type":"error", "message":"N\u00e3o foi poss\u00edvel concluir a resposta. Tente novamente."}) + "\n")
        finally:
            _EMIT.reset(token)
            send(None)

    yield json.dumps({"type":"status", "stage":"received", "message":MESSAGES["received"]}, ensure_ascii=False) + "\n"
    task = asyncio.create_task(asyncio.to_thread(worker))
    try:
        while True:
            event = await queue.get()
            if event is None:
                break
            yield event
    finally:
        await asyncio.shield(task)
