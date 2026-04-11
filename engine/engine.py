from database.db import SessionLocal, User, engine
import os
import sys
import subprocess
import time
import socket
import json
import uuid
from contextlib import asynccontextmanager
import openpyxl
import os
import asyncio
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, UploadFile, File
import shutil
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import datetime


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
from fastapi.responses import FileResponse, StreamingResponse
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
    
def get_dist_path():
    if getattr(sys, 'frozen', False):
        meipass = sys._MEIPASS
        dist = os.path.join(meipass, "dist")
        print(f"DEBUG: _MEIPASS = {meipass}")
        print(f"DEBUG: DIST_PATH = {dist}")
        print(f"DEBUG: dist exists = {os.path.exists(dist)}")
        return dist
    else:
        return os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

BASE_PATH = get_base_path()
DIST_PATH = get_dist_path()
DOCS_PATH = os.path.join(BASE_PATH, "documentos")
VENV_PATH = os.path.join(BASE_PATH, "vetores_db")
ENV_PATH = os.path.join(BASE_PATH, ".env")
MODEL = "qwen2.5:7b"

#Modelos:

#qwen2.5:7b Muito Rápido
#deepseek-r1:8b

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
            time.sleep(1)
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
        elif file_name.endswith(".xlsx"):
            complete_text = readXLSX(caminho)

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

def readXLSX(caminho):
    wb = openpyxl.load_workbook(caminho, data_only=True)
    text = ""
    for sheet in wb.worksheets:
        text += f"\n### Aba: {sheet.title}\n"
        for row in sheet.iter_rows(values_only=True):
            line = " | ".join(str(cell) for cell in row if cell is not None)
            if line:
                text += line + "\n"
    return text

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
def splitter(texto, chunk_length=800, overlap=400):
    chunks = []
    for i in range(0, len(texto), chunk_length - overlap):
        chunks.append(texto[i:i + chunk_length])
    return chunks


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

class UserCreate(BaseModel):
    username: str
    password: str

class Model(BaseModel):
    model: str


SECRET_KEY = os.getenv("SECRET_KEY")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
#API de autenticação para registro e login de usuários, protegendo o endpoint de perguntas para usuários autenticados

@app.post("/changeModel")
def changeModel(model: Model):
    MODEL = model
    print(f"Novo modelo selecionando{MODEL}")
    
@app.post("/register")
def register(user: UserCreate):
    db = SessionLocal()
    if db.query(User).filter_by(username=user.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    novo_user = User(
        username=user.username,
        password=pwd_context.hash(user.password)
    )
    db.add(novo_user)
    db.commit()
    return {"message": "Usuário criado!"}

@app.post("/loginUser")
def login(user: UserCreate):
    db = SessionLocal()
    db_user = db.query(User).filter_by(username=user.username).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = jwt.encode({
        "sub": user.username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8)
    }, SECRET_KEY, algorithm="HS256")
    
    return {"token": token}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    end = os.path.join(DOCS_PATH, file.filename)
    
    with open(end, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    print(f"Arquivo recebido: {file.filename}")
    return {"message": f"Arquivo {file.filename} enviado com sucesso!"}
# Endpoint para receber perguntas, consultar o ChromaDB e retornar respostas geradas pelo modelo
@app.post("/ask")
async def answer(request_data: Ask):
    percentResult = 0
    max_fonts = 3
    context_parts = []
    fonts = []
    smlFonts = {}
    winnerFont = None
    MIN_GAP = 0.15

    results = collection.query(
        query_texts=[request_data.texto],
        n_results=10,
        include=["documents", "metadatas", "distances"]
    )

    rawScores = {}
    for i, meta in enumerate(results['metadatas'][0]):
        archive = meta["fonte"]
        distance = results['distances'][0][i]
        slm = 1 / (1 + distance)
        if slm > rawScores.get(archive, 0):
            rawScores[archive] = slm

    bestDistance = results['distances'][0][0] if results['distances'] and results['distances'][0] else None
    print(f"DEBUG: Distância do resultado mais relevante: {bestDistance}")
    print(f"Distâncias: {results['distances']}")

    # conta chunks reais de cada arquivo no índice completo
    all_metas = collection.get(include=["metadatas"])["metadatas"]
    chunk_counts = {}
    for meta in all_metas:
        fonte = meta["fonte"]
        chunk_counts[fonte] = chunk_counts.get(fonte, 0) + 1

    if results['metadatas'] and results['metadatas'][0]:
        for i, meta in enumerate(results['metadatas'][0]):
            archive = meta["fonte"]
            distances = results['distances'][0][i]
            slm = 1 / (1 + distances)
            if slm > smlFonts.get(archive, 0):
                smlFonts[archive] = slm

        # penaliza pelo tamanho real do arquivo
        for arquivo in smlFonts:
            total_chunks = chunk_counts.get(arquivo, 1)
            smlFonts[arquivo] = smlFonts[arquivo] / (1 + 0.01 * total_chunks)

    fonts = [meta['fonte'] for meta in results["metadatas"][0]]
    print(f"DEBUG: Similaridade por fonte: {smlFonts}")
    print(f"DEBUG: Chunks reais por arquivo: {chunk_counts}")

    winnerFont = max(smlFonts, key=smlFonts.get)
    max_score = smlFonts[winnerFont]

    winnerFonts = [
        fonte for fonte, score in smlFonts.items()
        if max_score - score <= MIN_GAP
    ]
    print(f"DEBUG: Fontes vencedoras ({MIN_GAP}): {winnerFonts}")

    best_raw = max(rawScores[f] for f in winnerFonts)
    winnerFonts = sorted(winnerFonts, key=lambda f: smlFonts[f], reverse=True)

    percents = {
        fonte: round((rawScores[fonte] / best_raw) * 100)
        for fonte in winnerFonts
    }
    print(f"DEBUG: Percentuais por fonte: {percents}")
    

    if results['documents'] and results['documents'][0]:
        fonte_para_chunks = {}
        for i, meta in enumerate(results['metadatas'][0]):
            fonte = meta['fonte']
            texto = results['documents'][0][i]
            fonte_para_chunks.setdefault(fonte, []).append(texto)

        for fonte in winnerFonts[:max_fonts]:
            chunks = fonte_para_chunks.get(fonte, [])
            textos = "\n---\n".join(chunks)
            context_parts.append(f"### {fonte}\n{textos}")

        contexto = "\n\n".join(context_parts)
        print(f"Contexto atual: {contexto}")

    else:
        contexto = "Nenhum contexto encontrado."
        print(f"DEBUG: Sem Contexto construído com {contexto}.")

    prompt_sistema = f"""
    Você é o Ditoo, um assistente de pesquisa.
    Responda sempre em Português do Brasil.
    Use APENAS o CONTEXTO abaixo para responder à pergunta.
    Se a resposta não estiver no CONTEXTO, diga exatamente: "Não encontrei essa informação nos arquivos."
    Não invente informações. Não use conhecimento externo.
    Se a informação estiver parcialmente no contexto, responda com o que houver disponível.
    Seja direto e objetivo na resposta.
    
    CONTEXTO:
    {contexto}
    """

    id_resposta = str(uuid.uuid4())

    async def generate():
        print(f"id_resposta:{id_resposta}")
        yield json.dumps({"type": "id", "id": id_resposta}) + "\n"
        
        loop = asyncio.get_event_loop()
        stream = await loop.run_in_executor(
            None,  # usa thread pool padrão
            lambda: ollama.chat(
                model=MODEL,
                messages=[
                    {'role': 'system', 'content': prompt_sistema},
                    {'role': 'user', 'content': request_data.texto}
                ],
                stream=True,
                keep_alive=-1
            )
        )

        for chunk in stream:
            content = chunk['message']['content']
            yield json.dumps({
                "type": "content",
                "text": content,
                "id": id_resposta,
                "fontes": fonts,
                "winner": winnerFonts,
                "percent": percents
            }) + "\n"
            await asyncio.sleep(0)

    return StreamingResponse(
    generate(),
    media_type="application/x-ndjson",
    headers={
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked"
    }
)


# Servir frontend React se a pasta dist existir
if os.path.exists(DIST_PATH):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_PATH, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index = os.path.join(DIST_PATH, "index.html")
        return FileResponse(index)
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

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
  --collect-all passlib \
  --collect-all jose \
  --collect-all openpyxl \
  --collect-all dotenv \
  --collect-all fitz \
  --collect-all asyncio \
  --collect-all sqlalchemy \
  --collect-all python-multipart \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.loops \
  --hidden-import uvicorn.loops.auto \
  --hidden-import uvicorn.protocols \
  --hidden-import uvicorn.protocols.http.auto \
  --hidden-import uvicorn.lifespan \
  --hidden-import uvicorn.lifespan.on \
  engine.py
"""