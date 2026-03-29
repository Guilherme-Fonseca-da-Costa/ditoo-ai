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
from dotenv import load_dotenv
load_dotenv()
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


# Splitter (Vai dividir o texto em blocos menores para o ChromaDB)
def splitter(texto, chunk_length=500):
    return [texto[i:i+chunk_length] for i in range(0, len(texto), chunk_length)]

# docs (Vai ler os arquivos da pasta "documentos" e indexar no ChromaDB)
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
              
# (vai inserir o bloco no ChromaDB, associando o ID e a fonte do arquivo)
                collection.upsert(
                    documents=[bloco],
                    ids=[f"{arquivo}_part_{i}"],
                   
                    metadatas=[{"fonte": arquivo}] 
                )
            print(f"✅ {arquivo} indexado em {len(chunks)} blocos.")
    print("Base de dados atualizada!")

carregar_documentos()

def percent_files(percentage):
    percentage = max(0, min(10, percentage))
    result = int((percentage / 10) * 100)
    return result
# --- LOOP DO CHAT ---
@app.post("/ask")
async def answer(request_data: Ask):
    # (Vai consultar o ChromaDB usando o texto da pergunta e obter os resultados mais relevantes)
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

    #(vai escolher a fonte mais relevante com base na pontuação e consultar novamente o ChromaDB para obter os blocos de texto relacionados a essa fonte)
    if fonte_vencedora:
        results = collection.query(query_texts=[request_data.texto], n_results=5, where={"fonte": fonte_vencedora}, include=["documents", "metadatas", "distances"])

    sortedFonts = sorted(fontes_com_pontos.items(), key=lambda x: x[1], reverse=True)
    bestDistance = results['distances'][0][0] if results['distances'] and results['distances'][0] else None
    print(f"DEBUG: Distância do resultado mais relevante: {bestDistance}")

    distanceLimit = 1.1

    if bestDistance > distanceLimit and len(sortedFonts) > 1:
        print(f"DEBUG: Distância {bestDistance} é maior que o limite {distanceLimit}. Considerando a segunda melhor fonte.")
        segundaMelhorFonte = sortedFonts[1][0]
        results = collection.query(query_texts=[request_data.texto], n_results=5, where={"fonte": segundaMelhorFonte}, include=["documents", "metadatas", "distances"])
        fonte_vencedora = segundaMelhorFonte

    # (vai construir o contexto para a resposta usando os blocos de texto obtidos e criar o prompt para o modelo de linguagem, incluindo o contexto e a pergunta do usuário)
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

# LLM Model:
    id_resposta = str(uuid.uuid4())
    # (vai enviar o prompt para o modelo de linguagem e obter a resposta gerada, enviando a resposta em partes para o frontend usando streaming)
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
        #adicionei este parâmetro para evitar que a conexão seja fechada automaticamente após o término da resposta, melhora bastante a velocidade da resposta já que o modelo fica sempre carregado depois que inicia
        # tem que lembrar de fechar o ollama para desocupar a VRAM ou reiniciar a máquina.
        keep_alive=-1
    )
        
        for chunk in stream:
            content = chunk['message']['content']
            yield json.dumps({"type": "content", "text": content, "id": id_resposta, "fontes": fontes, "winner": fonte_vencedora, "percent": percentResult}) + "\n"

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