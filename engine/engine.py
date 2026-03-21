import os
import subprocess
import time
os.environ["OLLAMA_NUM_PARALLEL"] = "4"
os.environ["OLLAMA_MAX_LOADED_MODELS"] = "1"
subprocess.Popen(["ollama", "serve"])
time.sleep(2)
import ollama
import chromadb
import fitz
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
import json
import uuid



class Ask(BaseModel):
    texto: str


# ChromaDB
client = chromadb.PersistentClient(path="./vetores_db")
collection = client.get_or_create_collection(name="meus_documentos")


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

Observer = Observer()
Observer.schedule(WatchFolder(), path="./documentos", recursive=False)
Observer.start()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# Splitter
def splitter(texto, chunk_length=500):
    return [texto[i:i+chunk_length] for i in range(0, len(texto), chunk_length)]

# docs
def carregar_documentos(diretorio="./documentos"):
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
            print(f"✅ {arquivo} indexado em {len(chunks)} blocos.")
    print("Base de dados atualizada!")

carregar_documentos()

# --- LOOP DO CHAT ---
@app.post("/ask")
async def answer(request_data: Ask):

    results = collection.query(query_texts=[request_data.texto], n_results=5)

    fontes_com_pontos = {}
    
    if results['metadatas'] and results['metadatas'][0]:

        for i, meta in enumerate(results['metadatas'][0]):
            arquivo = meta['fonte']
            pontos = 5 - i
            
            fontes_com_pontos[arquivo] = fontes_com_pontos.get(arquivo, 0) + pontos
            
        print(f"DEBUG: Pontuação de fontes: {fontes_com_pontos}")

    if fontes_com_pontos:
        fonte_vencedora = max(fontes_com_pontos, key=fontes_com_pontos.get)
    else:
        fonte_vencedora = "Nenhuma"

    # Show source
    if results['metadatas'] and results['metadatas'][0]:
        fontes = [meta['fonte'] for meta in results['metadatas'][0]]
        print(f"DEBUG: Consultando trechos dos arquivos: {list(set(fontes))}")

    if results['documents'] and results['documents'][0]:
        contexto = "\n---\n".join(results['documents'][0])
    else:
        contexto = "Nenhum contexto encontrado."

    prompt_sistema = f"""
    Você é o Ditoo, um assistente de pesquisa.
    Responda sempre em Português do Brasil.
    Use APENAS o CONTEXTO abaixo para responder à pergunta.
    Se a resposta não estiver no CONTEXTO, diga exatamente: "Não encontrei essa informação nos arquivos."
    Não responda nada fora do contexto fornecido.
    
    CONTEXTO:
    {contexto}
    """

# LLM Model:
    id_resposta = str(uuid.uuid4())
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
    )
        for chunk in stream:
            content = chunk['message']['content']
            yield json.dumps({"type": "content", "text": content, "id": id_resposta, "fontes": fontes, "winner": fonte_vencedora}) + "\n"

    return StreamingResponse(generate(), media_type="application/x-ndjson")
    
    #return {
    #    "stream": stream['message']['content'],
    #    "source": fontes
    #}

    #print("Ditoo AI: ", end='')
    #for chunk in stream:
    #    print(chunk['message']['content'], end='', flush=True)
    #print()

    #Para executar:
    #source venv/Scripts/activate
    #python -m uvicorn engine:app --host 0.0.0.0 --port 8000 --reload

    
    #Tem que dar source venv/Scripts/activate