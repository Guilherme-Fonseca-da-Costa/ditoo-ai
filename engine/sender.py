from dotenv import load_dotenv
import smtplib
import os


load_dotenv()

def send_email(to_address: str, subject: str, body: str) -> None:
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    email_address = os.getenv("EMAIL_ADDRESS")
    app_password = os.getenv("GMAIL_APP_PASSWORD")

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(email_address, app_password)
        message = f"Subject: {subject}\n\n{body}"
        server.sendmail(
    email_address,
    to_address,
    message.encode("utf-8")
)