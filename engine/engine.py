from database.db import Conversation, Message, SessionLocal, User, engine
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
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from chromadb.utils import embedding_functions
embedding = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="intfloat/multilingual-e5-large")


os.environ["OLLAMA_NUM_PARALLEL"] = "4"
os.environ["OLLAMA_MAX_LOADED_MODELS"] = "1"
os.environ["OLLAMA_CONTEXT_LENGTH"] = "8192"
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
    conversationId: str | None = None
    title: str | None = None 


# --- ChromaDB --- Banco de dados vetorial para armazenar os blocos de texto dos documentos
client = chromadb.PersistentClient(path=VENV_PATH)
collection = client.get_or_create_collection(
    name="meus_documentos",
    embedding_function=embedding
)


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
FileObserver.schedule(WatchFolder(), path=DOCS_PATH, recursive=True)
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
def splitter(texto, chunk_length=500, overlap=250):
    chunks = []
    for i in range(0, len(texto), chunk_length - overlap):
        chunks.append(texto[i:i + chunk_length])

    if len(chunks) >= 2 and len(chunks[-1].strip()) < 150:
        chunks[-2] = chunks[-2] + " " + chunks[-1]
        chunks.pop()
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
    email: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str


class Model(BaseModel):
    model: str


SECRET_KEY = os.getenv("SECRET_KEY")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    
    token = credentials.credentials
    print(f"CURRENT: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
#API de autenticação para registro e login de usuários, protegendo o endpoint de perguntas para usuários autenticados

@app.post("/changeModel")
def changeModel(model: Model):
    global MODEL
    MODEL = model.model
    
    try:
        ollama.chat(model=MODEL, messages=[{"role": "user", "content": "ok"}], keep_alive=0)
    except:
        pass
    
    ollama.pull(model.model)  # garante que o modelo existe localmente
    
    print(f"Modelo trocado para: {MODEL}")
    return {"message": f"Modelo trocado para {MODEL}"}

@app.get("/fetchMessages/{conversation_id}")
async def fetch_messages(conversation_id: str, user=Depends(current_user)):
    db = SessionLocal()
    try:
        db_user = db.query(User).filter_by(email=user).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        messages = (
            db.query(Message)
            .filter_by(conversation_id=conversation_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        
        print("Mensagens" + str([m.content for m in messages]))
        return [
            {"id": m.id, "sender": m.role, "text": m.content}
            for m in messages
        ]
    finally:
        db.close()

@app.get("/getHistory")
async def get_conversations(user=Depends(current_user)):
    db = SessionLocal()
    try:
        db_user = db.query(User).filter_by(email=user).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        conversations = (
            db.query(Conversation)
            .filter_by(user_id=db_user.id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

        return [
            {"id": c.id, "title": c.title, "updatedAt": c.updated_at.isoformat()}
            for c in conversations
        ]
    finally:
        db.close()

@app.post("/register")
def register(user: UserCreate):
    db = SessionLocal()
    if db.query(User).filter_by(username=user.username).first():
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    novo_user = User(
        username=user.username,
        email=user.email,
        password=pwd_context.hash(user.password),
        role=user.role
    )
    db.add(novo_user)
    db.commit()
    return {"message": "Usuário criado!"}

@app.get("/getUsers")
async def getUsers(user=Depends(current_user)):
    db = SessionLocal()
    db_users = db.query(User).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role
        }
        for u in db_users
    ]
@app.post("/loginUser")
async def login(user: UserLogin):
    print(f"Usuário: {user}")
    db = SessionLocal()
    db_user = db.query(User).filter_by(email=user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = jwt.encode({
        "user": db_user.username,
        "sub": db_user.email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        "role": db_user.role
    }, SECRET_KEY, algorithm="HS256")
    
    return {"token": token}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(current_user)):
    end = os.path.join(DOCS_PATH, file.filename)
    
    with open(end, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    print(f"Arquivo recebido: {file.filename}")
    return {"message": f"Arquivo {file.filename} enviado com sucesso!"}
# Endpoint para receber perguntas, consultar o ChromaDB e retornar respostas geradas pelo modelo
@app.post("/ask")
async def answer(request_data: Ask, user=Depends(current_user)):
    db = SessionLocal()
    db_user = db.query(User).filter_by(email=user).first()

    if request_data.conversationId:
        conversation = db.query(Conversation).filter_by(id=request_data.conversationId, user_id=db_user.id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")
    else:
        conversation = Conversation(user_id=db_user.id, title=request_data.title or "Nova Conversa")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    history = db.query(Message).filter_by(conversation_id=conversation.id).order_by(Message.created_at.desc()).all()
    print(f"DEBUG: Histórico de mensagens Inicial: {[{'role': m.role, 'content': m.content} for m in history]}")
    MAX_HISTORY = 15
    memory = history[:MAX_HISTORY]
    memory.reverse() 

    db.add(Message(conversation_id=conversation.id, role="user", content=request_data.texto))
    db.commit()

   

    percentResult = 0
    max_fonts = 3
    context_parts = []
    fonts = []
    smlFonts = {}
    winnerFont = None
    MIN_GAP = 0.15

    results = collection.query(
        query_texts=[request_data.texto],
        n_results=20,
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

    if not smlFonts:
    # nenhum documento relevante encontrado (base vazia ou sem match)
        winnerFonts = []
        percents = {}
        contexto = "Nenhum documento disponível na base de conhecimento."

    else:
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
    Você é o Ditoo, um assistente de IA interno da empresa, especializado em ajudar pessoas a encontrar e entender informações nos documentos da organização.

## Como se comunicar

Converse de forma natural, como uma pessoa competente e atenciosa conversaria — não como um sistema que gera relatórios. Isso significa:

- Escreva em prosa corrida na maioria das vezes. Só use listas ou tópicos quando a informação for genuinamente sequencial (passo a passo) ou quando enumerar itens deixa mais claro que texto corrido — não use listas por padrão.
- Varie a estrutura das respostas. Nem toda resposta precisa de introdução + tópicos + conclusão. Às vezes a melhor resposta é um parágrafo direto.
- Combine informações relacionadas em vez de fragmentar tudo em bullets soltos.
- Para mensagens sociais (agradecimentos, cumprimentos, confirmações, despedidas) ou comentários que não pedem informação, responda de forma breve e natural — uma frase ou duas, sem estrutura, sem tópicos, sem repetir contexto de documentos.
- Não repita a pergunta do usuário antes de responder.
- Evite frases de preenchimento como "Aqui estão as informações que você pediu" — vá direto ao ponto.
- Adapte o tamanho da resposta à pergunta: perguntas simples merecem respostas curtas; perguntas complexas ou que pedem análise merecem mais desenvolvimento.

## Como usar o contexto de documentos

Você recebe abaixo um CONTEXTO extraído de documentos internos, relevante (ou não) à mensagem atual.

- Se a mensagem pedir informação que está no contexto, use-o como base da resposta, conectando informações de diferentes trechos quando fizer sentido.
- Se o contexto trouxer apenas indícios parciais, responda com base neles e diga que é uma inferência a partir do que está disponível — sem inventar detalhes que não estão lá.
- Se a mensagem não tiver relação com o contexto (perguntas sociais, de esclarecimento sobre a própria conversa, ou fora do escopo dos documentos), ignore o contexto completamente e responda apenas com base na conversa e no seu conhecimento geral, deixando claro quando a resposta não vem dos documentos da empresa.
- Só diga que não encontrou a informação se não houver absolutamente nenhuma pista no contexto relacionada à pergunta.
- Nunca cite nomes de arquivo ou metadados de forma mecânica dentro do texto (ex: "de acordo com relatorio.pdf") — as fontes já são exibidas separadamente na interface.

## Idioma

Responda sempre em Português do Brasil, em tom profissional mas acessível — como um colega experiente ajudando, não um manual técnico.

    
    CONTEXTO:
    {contexto}
    """

    id_resposta = str(uuid.uuid4())
    messages = [{'role': 'system', 'content': prompt_sistema}]
    for msg in memory:
        role = "ai" if msg.role == "ai" else "user"
        messages.append({'role': role, 'content': msg.content})
    messages.append({'role': 'user', 'content': request_data.texto})


    async def generate():
        print(f"id_resposta:{id_resposta}")
        print(f"DEBUG: Prompt do sistema: {prompt_sistema}")
        print(f"DEBUG: Memória: {memory}")
        print(f"DEBUG: Histórico de mensagens: {messages}")
        yield json.dumps({"type": "id", "id": id_resposta, "conversationId": conversation.id}) + "\n"

        loop = asyncio.get_event_loop()
        stream = await loop.run_in_executor(
            None,  # usa thread pool padrão
            lambda: ollama.chat(
                model=MODEL,
                messages=messages,
                stream=True,
                keep_alive=-1
            )
        )

        final_response = ""

        for chunk in stream:
            content = chunk['message']['content']
            final_response += content
            print(f"DEBUG: Conteúdo do chunk: {content}")
            yield json.dumps({
                "type": "content",
                "text": content,
                "id": id_resposta,
                "fontes": fonts,
                "winner": winnerFonts,
                "percent": percents,
                "conversationId": conversation.id
            }) + "\n"
            await asyncio.sleep(0)

        
        db.add(Message(conversation_id=conversation.id, role="ai", content=final_response))
        db.commit()
        print(f"DEBUG: Resposta final: {final_response} - FIM DA RESPOSTA")

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
    print(f"DIST_PATH: {DIST_PATH}")
    print(f"dist existe: {os.path.exists(DIST_PATH)}")
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
Gerar build para Windows:

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

""""
Gerar build para Linux:
python -m PyInstaller --onefile --name ditoo-server \
  --add-data "dist:dist" \
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
  --collect-all "python-multipart" \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.loops \
  --hidden-import uvicorn.loops.auto \
  --hidden-import uvicorn.protocols \
  --hidden-import uvicorn.protocols.http.auto \
  --hidden-import uvicorn.lifespan \
  --hidden-import uvicorn.lifespan.on \
  engine.py
"""

"É possível que de erro ao rodar na rede, veja se a redfe está como publica ou privada, teste alterar para privada"
"É preciso fazer um ajuste para evitar erro caso não haja nenhum arquivo indexado"