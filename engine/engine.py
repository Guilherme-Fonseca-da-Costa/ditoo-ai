from database import SessionLocal, User, engine
import os
import sys
import subprocess
import time
import socket
import json
import uuid
from contextlib import asynccontextmanager

os.environ["OLLAMA_NUM_PARALLEL"] = "4"
os.environ["OLLAMA_MAX_LOADED_MODELS"] = "1"

# Verifica se o Ollama já está rodando antes de subir outro
def ollama_ativo():
    try:
        s = socket.create_connection(("127.0.0.1", 11434), timeout=1)
        s.close()
        return True
    except:
        return False

if not ollama_ativo():
    subprocess.Popen(["ollama", "serve"])
    time.sleep(2)
else:
    print("✅ Ollama já está rodando")

import ollama
import chromadb
import fitz
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from zeroconf import Zeroconf, ServiceInfo
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
from dotenv import load_dotenv

load_dotenv()

# --- CAMINHOS ABSOLUTOS ---
def get_base_path():
    if getattr(sys, 'frozen', False):
        # rodando como executável PyInstaller
        return os.path.dirname(sys.executable)
    else:
        # rodando normalmente como script
        return os.path.dirname(os.path.abspath(__file__))

BASE_PATH = get_base_path()
DOCS_PATH = os.path.join(BASE_PATH, "documentos")
VENV_PATH = os.path.join(BASE_PATH, "vetores_db")
ENV_PATH = os.path.join(BASE_PATH, ".env")

# --- CRIA .env SE NÃO EXISTIR ---
def env_create():
    if not os.path.exists(ENV_PATH):
        import secrets
        secret_key = secrets.token_hex(32)
        with open(ENV_PATH, "w") as f:
            f.write(f"SECRET_KEY={secret_key}\n")
            f.write("DATABASE_URL=sqlite:///ditoo.db\n")
        print("Arquivo .env criado com variáveis de ambiente padrão.")

env_create()

# --- mDNS --- Registra o serviço na rede local para descoberta automática
from zeroconf.asyncio import AsyncZeroconf

async def registrar_mdns():
    ip = socket.gethostbyname(socket.gethostname())
    info = ServiceInfo(
        "_http._tcp.local.",
        "Ditoo._http._tcp.local.",
        addresses=[socket.inet_aton(ip)],
        port=8000,
        properties={"path": "/"},
        server="ditoo.local."
    )
    zeroconf = AsyncZeroconf()
    await zeroconf.async_register_service(info)
    print(f"Acessível em http://ditoo.local:8000")
    return zeroconf

@asynccontextmanager
async def lifespan(app: FastAPI):
    zeroconf = await registrar_mdns()
    yield
    await zeroconf.async_close()

class Ask(BaseModel):
    texto: str


# --- ChromaDB --- Banco de dados vetorial para armazenar os blocos de texto dos documentos
client = chromadb.PersistentClient(path=VENV_PATH)
collection = client.get_or_create_collection(name="meus_documentos")


# --- Watchdog --- Observa a pasta de documentos e indexa novos arquivos automaticamente
class WatchFolder(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            print(f"\n🆕 Novo arquivo detectado: {event.src_path}")
            self.index_folder(event.src_path)
    
    def index_folder(self, caminho):
        file_name = os.path.basename(caminho)
        complete_text = ""
        print(f"\n🆕 Indexando novo arquivo: {file_name}")
        if file_name.endswith(".txt"):
            with open(caminho, 'r', encoding='utf-8') as f:
                complete_text = f.read()
        elif file_name.endswith(".pdf"):
            doc = fitz.open(caminho)
            for pag in doc:
                complete_text += pag.get_text()

        if complete_text:
            chunks = splitter(complete_text)
            for i, block in enumerate(chunks):
                collection.upsert(
                    documents=[block],
                    ids=[f"{file_name}_part_{i}"],
                    metadatas=[{"fonte": file_name}]
                )
            print(f"\n🆕 Arquivo: {file_name} indexado em {len(chunks)} blocos...")

if not os.path.exists(DOCS_PATH):
    os.makedirs(DOCS_PATH)

FileObserver = Observer()
FileObserver.schedule(WatchFolder(), path=DOCS_PATH, recursive=False)
FileObserver.start()

# FastAPI --- Servidor web para receber perguntas e retornar respostas
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Splitter --- Divide o texto em blocos menores para indexação
def splitter(texto, chunk_length=500):
    return [texto[i:i+chunk_length] for i in range(0, len(texto), chunk_length)]


# Carregar documentos com caminho absoluto
def carregar_documentos(diretorio=None):
    if diretorio is None:
        diretorio = DOCS_PATH

    if not os.path.exists(diretorio):
        os.makedirs(diretorio)
        print(f"Pasta '{diretorio}' criada.")
        return

    print("Indexando documentos...")
    for arquivo in os.listdir(diretorio):
        caminho = os.path.join(diretorio, arquivo)
        texto_completo = ''

        if arquivo.endswith(".txt"):
            with open(caminho, 'r', encoding='utf-8') as f:
                texto_completo = f.read()
        elif arquivo.endswith(".pdf"):
            doc = fitz.open(caminho)
            for pag in doc:
                texto_completo += pag.get_text()

        if texto_completo:
            chunks = splitter(texto_completo)
            for i, bloco in enumerate(chunks):
                collection.upsert(
                    documents=[bloco],
                    ids=[f"{arquivo}_part_{i}"],
                    metadatas=[{"fonte": arquivo}]
                )
            print(f"{arquivo} indexado em {len(chunks)} blocos.")
    print("Base de dados atualizada!")

carregar_documentos()


def percent_files(percentage):
    percentage = max(0, min(10, percentage))
    result = int((percentage / 10) * 100)
    return result


# Endpoint para receber perguntas, consultar o ChromaDB e retornar respostas geradas pelo modelo
@app.post("/ask")
async def answer(request_data: Ask):
    resultsRank = results = collection.query(query_texts=[request_data.texto], n_results=5)

    fontes_com_pontos = {}

    if results['metadatas'] and results['metadatas'][0]:
        for i, meta in enumerate(results['metadatas'][0]):
            arquivo = meta['fonte']
            pontos = 5 - i
            fontes_com_pontos[arquivo] = fontes_com_pontos.get(arquivo, 0) + pontos

        percentResult = percent_files(fontes_com_pontos[max(fontes_com_pontos, key=fontes_com_pontos.get)])
        print(f"DEBUG: Pontuação de fontes: {fontes_com_pontos}")
        print(f"DEBUG: porcentagem de concordância: {percentResult}%")

        fonte_vencedora = max(fontes_com_pontos, key=fontes_com_pontos.get)

    if fonte_vencedora:
        results = collection.query(
            query_texts=[request_data.texto],
            n_results=5,
            where={"fonte": fonte_vencedora},
            include=["documents", "metadatas", "distances"]
        )

    sortedFonts = sorted(fontes_com_pontos.items(), key=lambda x: x[1], reverse=True)
    bestDistance = results['distances'][0][0] if results['distances'] and results['distances'][0] else None
    print(f"DEBUG: Distância do resultado mais relevante: {bestDistance}")

    distanceLimit = 1.1
    # Se a melhor distância for maior que o limite, considerar a segunda melhor fonte
    if bestDistance and bestDistance > distanceLimit and len(sortedFonts) > 1:
        print(f"DEBUG: Distância {bestDistance} é maior que o limite {distanceLimit}. Considerando a segunda melhor fonte.")
        segundaMelhorFonte = sortedFonts[1][0]
        results = collection.query(
            query_texts=[request_data.texto],
            n_results=5,
            where={"fonte": segundaMelhorFonte},
            include=["documents", "metadatas", "distances"]
        )
        fonte_vencedora = segundaMelhorFonte

    if results['metadatas'] and results['metadatas'][0]:
        fontes = [meta['fonte'] for meta in results['metadatas'][0]]
        print(f"DEBUG: Consultando trechos dos arquivos: {list(set(fontes))}")

    if results['documents'] and results['documents'][0]:
        contexto = "\n---\n".join(results['documents'][0])
        print(f"DEBUG: Contexto construído com {contexto}.")
    else:
        contexto = "Nenhum contexto encontrado."
        print(f"DEBUG: Sem Contexto construído com {contexto}.")

    prompt_sistema = f"""
    Você é o Ditoo, um assistente de pesquisa.
    Responda sempre em Português do Brasil.
    Use APENAS o CONTEXTO abaixo para responder à pergunta.
    Se a resposta não estiver no CONTEXTO, diga exatamente: "Não encontrei essa informação nos arquivos."
    Não responda nada fora do contexto fornecido.
    
    CONTEXTO:
    {contexto}
    """

    id_resposta = str(uuid.uuid4())
    # Gerar resposta em streaming usando o modelo do Ollama e enviar atualizações para o frontend
    def generate():
        print(f"id_resposta:{id_resposta}")
        yield json.dumps({"type": "id", "id": id_resposta}) + "\n"
        stream = ollama.chat(
            model='deepseek-r1:8b',
            messages=[
                {'role': 'system', 'content': prompt_sistema},
                {'role': 'user', 'content': request_data.texto}
            ],
            stream=True,
            keep_alive=-1
        )

        for chunk in stream:
            content = chunk['message']['content']
            yield json.dumps({
                "type": "content",
                "text": content,
                "id": id_resposta,
                "fontes": fontes,
                "winner": fonte_vencedora,
                "percent": percentResult
            }) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")


# Servir frontend React se a pasta dist existir
DIST_PATH = os.path.join(BASE_PATH, "dist")
if os.path.exists(DIST_PATH):
    app.mount("/", StaticFiles(directory=DIST_PATH, html=True), name="frontend")
    print("Pasta dist encontrada, frontend será servido")
else:
    print("Pasta dist não encontrada, frontend não será servido")


# Comando para rodar o servidor | python -m uvicorn engine:app --host 0.0.0.0 --port 8000 --reload
#  Comando para buildar o executável:
"""
python -m PyInstaller --onefile --name ditoo-server \
  --add-data "dist;dist" \
  --collect-all chromadb \
  --collect-all onnxruntime \
  --collect-all tokenizers \
  --collect-all watchdog \
  --collect-all zeroconf \
  --collect-all ollama \
  --collect-all fastapi \
  --collect-all uvicorn \
  engine.py
"""