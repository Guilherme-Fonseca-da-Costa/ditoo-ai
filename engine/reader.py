
import imaplib
import email
import os
from email.header import decode_header
from dotenv import load_dotenv

load_dotenv()


def get_emails():
    mail = None

    try:
        email_address = os.getenv("EMAIL_ADDRESS")
        app_password = os.getenv("GMAIL_APP_PASSWORD")

        if not email_address or not app_password:
            raise ValueError(
                "EMAIL_ADDRESS ou GMAIL_APP_PASSWORD não configurado no .env"
            )

        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_address, app_password)

        status, _ = mail.select("INBOX")

        if status != "OK":
            raise RuntimeError("Não foi possível abrir a caixa de entrada.")

        status, data = mail.search(None, "UNSEEN")

        if status != "OK" or not data or not data[0]:
            return {
                "emails": [],
                "message": "Não foi possível buscar os e-mails."
            }

        mail_ids = data[0].split()

        print(f"Total de e-mails não lidos: {len(mail_ids)}")

        if not mail_ids:
            return {
                "emails": [],
                "message": "Nenhum e-mail não lido encontrado."
            }

        # Busca o e-mail não lido mais recente
        latest_id = mail_ids[-1]
        status, msg_data = mail.fetch(latest_id, "(BODY.PEEK[])")

        if status != "OK" or not msg_data:
            raise RuntimeError("Não foi possível buscar o conteúdo do e-mail.")

        raw_email = next(
            (
                item[1]
                for item in msg_data
                if isinstance(item, tuple) and len(item) > 1
            ),
            None
        )

        if raw_email is None:
            raise RuntimeError("O servidor não retornou o conteúdo do e-mail.")

        msg = email.message_from_bytes(raw_email)

        # Decodifica o assunto
        subject_parts = decode_header(msg.get("Subject", ""))
        subject = ""

        for value, encoding in subject_parts:
            if isinstance(value, bytes):
                subject += value.decode(encoding or "utf-8", errors="replace")
            else:
                subject += value

        # Extrai o corpo, priorizando texto simples
        corpo = ""

        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() != "text/plain":
                    continue

                if part.get_content_disposition() == "attachment":
                    continue

                payload = part.get_payload(decode=True)

                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    corpo += payload.decode(charset, errors="replace")
        else:
            payload = msg.get_payload(decode=True)

            if payload:
                charset = msg.get_content_charset() or "utf-8"
                corpo = payload.decode(charset, errors="replace")

        # Marca como lido somente depois da leitura bem-sucedida
    

        resultado = {
            "emails": [
                {
                    "subject": subject,
                    "from": str(msg.get("From", "")),
                    "date": str(msg.get("Date", "")),
                    "body": corpo
                }
            ]
        }

        print(f"Assunto: {subject}")
        print(f"Corpo: {corpo}")

        return resultado

    finally:
        if mail is not None:
            try:
                mail.logout()
            except (imaplib.IMAP4.error, OSError):
                pass
