import imaplib
import email
import email.utils
import os
import re
import json
from html.parser import HTMLParser
from sender import send_email
from dotenv import load_dotenv
import requests

load_dotenv()

BASE_URL = os.getenv("DITOO_URL", "http://localhost:5173")
SESSION = requests.Session()

def login() -> None:
    r = SESSION.post(
        f"{BASE_URL}/loginUser",
        json={
            "email": os.getenv("DITOO_EMAIL"),
            "password": os.getenv("DITOO_PASSWORD"),
        },
        timeout=30,
    )

    r.raise_for_status()
    dados = r.json()

    if dados.get("message") != "Login realizado":
        raise RuntimeError(f"Falha no login: {dados}")

    if "ditoo_token" not in SESSION.cookies:
        raise RuntimeError(
            "Login respondeu com sucesso, mas o cookie ditoo_token "
            "não foi recebido. Confira o Set-Cookie do backend."
        )

    print(f"Login realizado como {dados.get('username')}")

REMETENTES_PERMITIDOS = ["g.fonsecadacosta@gmail.com"]  # ajuste


class _HTMLTexto(HTMLParser):
    def __init__(self):
        super().__init__()
        self.partes = []

    def handle_data(self, data):
        self.partes.append(data)


def _html_para_texto(html: str) -> str:
    p = _HTMLTexto()
    p.feed(html)
    return re.sub(r"\s+", " ", " ".join(p.partes)).strip()


def _extrair_corpo(msg) -> str:
    texto, html = "", ""
    for part in msg.walk():
        if part.get_content_disposition() == "attachment":
            continue
        tipo = part.get_content_type()
        if tipo not in ("text/plain", "text/html"):
            continue
        payload = part.get_payload(decode=True)
        if not payload:
            continue
        conteudo = payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        if tipo == "text/plain" and not texto:
            texto = conteudo
        elif tipo == "text/html" and not html:
            html = conteudo
    return texto.strip() or _html_para_texto(html)


def get_emails() -> str:
    endereco = os.getenv("EMAIL_ADDRESS")
    senha_app = os.getenv("GMAIL_APP_PASSWORD")
    if not endereco or not senha_app:
        raise RuntimeError("Defina EMAIL_ADDRESS e GMAIL_APP_PASSWORD no .env")

    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(endereco, senha_app)
    mail.select("inbox")

    ids = []
    for remetente in REMETENTES_PERMITIDOS:
        _, data = mail.search(None, "UNSEEN", "FROM", f'"{remetente}"')
        ids.extend(data[0].split())

    print(f"E-mails não lidos de remetentes permitidos: {len(ids)}")
    if not ids:
        mail.logout()
        return ""

    ultimo = sorted(ids, key=int)[-1]
    _, msg_data = mail.fetch(ultimo, "(BODY.PEEK[])")
    msg = email.message_from_bytes(msg_data[0][1])

    corpo = _extrair_corpo(msg)
    

    mail.logout()
    return corpo


def ask(texto: str, titulo: str | None = None) -> str:
    resposta = ""

    with SESSION.post(
        f"{BASE_URL}/ask",
        json={
            "texto": texto,
            "conversationId": None,
            "title": titulo,
            "mail": True
        },
        stream=True,
        timeout=300,
    ) as r:
        r.raise_for_status()

        for linha in r.iter_lines():
            if not linha:
                continue

            evento = json.loads(linha)

            if evento.get("type") == "content":
                resposta += evento.get("text", "")

    print(resposta)
    return resposta



if __name__ == "__main__":
    corpo = get_emails()
    if not corpo:
        print("Nada para processar.")
    else:
        login()
        resposta = ask(corpo, titulo="Pergunta via e-mail")
        send_email(
            to_address="g.fonsecadacosta@gmail.com",
            subject="Resposta do Ditoo",
            body=resposta
        )
        
