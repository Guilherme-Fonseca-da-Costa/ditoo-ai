# code_executor.py
import json
import ollama
import pandas as pd
import pdfplumber
import queryframe as qf

JUIZ_MODEL = "qwen2.5-coder:7b"
qf.configure(provider="ollama", model=JUIZ_MODEL)


def carregar_dataframe(caminho_arquivo: str) -> pd.DataFrame:
    df = None
    if caminho_arquivo.endswith(".pdf"):
        with pdfplumber.open(caminho_arquivo) as pdf:
            for page in pdf.pages:
                tabelas = page.extract_tables()
                if tabelas:
                    for tabela in tabelas:
                        df_extraido = pd.DataFrame(tabela[1:], columns=tabela[0])
                        df = (
                            df_extraido
                            if df is None
                            else pd.concat([df, df_extraido], ignore_index=True)
                        )
    elif caminho_arquivo.endswith((".xlsx", ".csv")):
        df = (
            pd.read_excel(caminho_arquivo)
            if caminho_arquivo.endswith(".xlsx")
            else pd.read_csv(caminho_arquivo)
        )

    return df


def montar_schema_info(df: pd.DataFrame) -> str:
    linhas = []
    for col in df.columns:
        exemplo = (
            df[col].dropna().iloc[0] if not df[col].dropna().empty else "N/A"
        )
        linhas.append(f"- {col} (dtype={df[col].dtype}, exemplo='{exemplo}')")
    return "\n".join(linhas)


def julgar_codigo(
    pergunta: str, codigo: str, resultado, schema_info: str
) -> dict:
    prompt_sistema = """Você é um revisor de código pandas. Valide se o código responde à pergunta.
Responda SOMENTE em JSON: {"valido": true ou false, "motivo": "explicação curta"}"""

    prompt_usuario = f"SCHEMA:\n{schema_info}\n\nPERGUNTA:\n{pergunta}\n\nCÓDIGO:\n{codigo}\n\nRESULTADO:\n{resultado}"

    resposta = ollama.chat(
        model=JUIZ_MODEL,
        messages=[
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_usuario},
        ],
        keep_alive=-1,
        format="json",
    )
    try:
        return json.loads(resposta["message"]["content"])
    except Exception:
        return {"valido": False, "motivo": "Erro ao ler JSON do juiz"}


def executar_analise_tabular(
    caminho_arquivo: str, pergunta: str, max_tentativas: int = 2
):
    """Função principal chamada pelo engine.py"""
    df = carregar_dataframe(caminho_arquivo)
    if df is None or df.empty:
        return {"sucesso": False, "erro": "Não foi possível extrair tabela."}

    schema_info = montar_schema_info(df)
    feedback_anterior = ""

    for tentativa in range(1, max_tentativas + 1):
        pergunta_atual = (
            f"{pergunta}\n[Atenção: {feedback_anterior}]"
            if feedback_anterior
            else pergunta
        )
        try:
            resultado = qf.ask(df, pergunta_atual)
            veredito = julgar_codigo(
                pergunta, resultado.code, resultado.data, schema_info
            )

            if veredito.get("valido"):
                return {
                    "sucesso": True,
                    "resultado": str(resultado.data),
                    "codigo": resultado.code,
                    "tentativas": tentativa,
                }
            feedback_anterior = veredito.get("motivo", "Erro de validação")
        except Exception as e:
            feedback_anterior = f"Erro de execução: {e}"

    return {
        "sucesso": False,
        "resultado": str(resultado.data) if "resultado" in locals() else None,
        "motivo": feedback_anterior,
    }