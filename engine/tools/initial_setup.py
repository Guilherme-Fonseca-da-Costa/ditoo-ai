"""One-time administrator setup, independent of models and documents."""
from contextlib import contextmanager
import hashlib
import json
import re
import secrets
import time
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, SecretStr, ValidationError
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError
from starlette.concurrency import run_in_threadpool

TOKEN_SECONDS = 900
ATTEMPT_SECONDS = 60
MAX_ATTEMPTS = 10
STATE_ID = "initial-admin"


class InitialAdminCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str
    email: str
    password: SecretStr
    password_confirmation: SecretStr


def validate_account(payload):
    name, email = payload.username.strip(), payload.email.strip().lower()
    password = payload.password.get_secret_value()
    try:
        password_bytes = password.encode("utf-8")
        confirmation_bytes = payload.password_confirmation.get_secret_value().encode("utf-8")
        name.encode("utf-8")
    except UnicodeError:
        raise HTTPException(422, "Informe nome e senhas com caracteres de texto válidos.") from None
    if not 2 <= len(name) <= 80 or any(ord(c) < 32 or ord(c) == 127 for c in name):
        raise HTTPException(422, "Informe um nome de 2 a 80 caracteres, sem caracteres de controle.")
    local, _, domain = email.partition("@")
    label = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    if (len(email) > 254 or len(local) > 64 or not local or local.startswith(".") or local.endswith(".") or
            ".." in local or not re.fullmatch(r"[a-z0-9.!#$%&'*+/=?^_`{|}~-]+", local) or
            not re.fullmatch(label + r"(?:\." + label + r")+", domain)):
        raise HTTPException(422, "Informe um endereço de e-mail válido, como nome@empresa.com.")
    if (len(password) < 12 or len(password_bytes) > 72 or
            any(ord(c) < 32 or ord(c) == 127 for c in password) or not any(c.islower() for c in password) or
            not any(c.isupper() for c in password) or not any(c.isdigit() for c in password)):
        raise HTTPException(422, "Use uma senha com pelo menos 12 caracteres, maiúscula, minúscula e número, e no máximo 72 bytes UTF-8.")
    if not secrets.compare_digest(password_bytes, confirmation_bytes):
        raise HTTPException(422, "A confirmação da senha não confere.")
    return name, email, password


class InitialSetup:
    def __init__(self, sessions, user_model, state_model, passwords, now=time.time):
        self.sessions, self.User, self.State = sessions, user_model, state_model
        self.passwords, self.now = passwords, now

    @contextmanager
    def locked(self):
        """Serialize check/create in the database, including different workers."""
        db = self.sessions()
        try:
            dialect = db.get_bind().dialect.name
            if dialect == "sqlite":
                db.execute(text("BEGIN IMMEDIATE"))
            elif dialect in ("postgresql", "mysql", "mariadb"):
                seed = self.sessions()
                try:
                    if seed.get(self.State, STATE_ID) is None:
                        seed.add(self.State(id=STATE_ID, completed=False, failures=0, window_started_at=0))
                        seed.commit()
                except IntegrityError:
                    seed.rollback()
                finally:
                    seed.close()
            else:
                raise HTTPException(503, "Configuração inicial requer SQLite, PostgreSQL ou MySQL com bloqueio transacional.")
            state = db.query(self.State).filter_by(id=STATE_ID).with_for_update().first()
            if state is None:
                state = self.State(id=STATE_ID, completed=False, failures=0, window_started_at=0)
                db.add(state)
                db.flush()
            yield db, state
            db.commit()
        except OperationalError:
            db.rollback()
            raise HTTPException(503, "Não foi possível obter o bloqueio da configuração. Aguarde e tente novamente.") from None
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "A instalação mudou durante o cadastro. Atualize a página e confira as contas existentes.") from None
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    @staticmethod
    def invalidate(state):
        state.completed, state.token_hash, state.expires_at, state.failures = True, None, 0, 0

    def prepare(self, renew=False, output=print):
        token, active = None, False
        with self.locked() as (db, state):
            if db.query(self.User.id).first() is not None:
                self.invalidate(state)
            elif not state.completed:
                active = True
                if renew or not state.token_hash or (state.expires_at or 0) <= self.now():
                    token = secrets.token_urlsafe(32)
                    state.token_hash = hashlib.sha256(token.encode()).hexdigest()
                    state.expires_at = int(self.now()) + TOKEN_SECONDS
                    state.failures, state.window_started_at = 0, int(self.now())
        # Only the winner prints its token, after commit. It is never returned by HTTP.
        if token:
            output("\nDitoo: configure o primeiro administrador em /setup.")
            output(f"Código temporário (15 minutos): {token}")
            output("Guarde este código como uma senha. Ele não é publicado pela API.\n")
        elif active:
            output("Ditoo: primeiro acesso pendente. Use o código do console do processo que iniciou a configuração.")
        if active:
            output("Para renovar um código perdido/expirado, na pasta engine: python -m tools.initial_setup --renew")
            output("Se usar o executável: ditoo-server.exe --renew-setup-code")
        return active

    def status(self):
        with self.sessions() as db:
            if db.query(self.User.id).first() is not None:
                return {"required": False}
            state = db.get(self.State, STATE_ID)
            return {"required": not (state and state.completed)}

    def complete(self, payload, supplied):
        failure = None
        with self.locked() as (db, state):
            if state.completed or db.query(self.User.id).first() is not None:
                raise HTTPException(409, "A configuração inicial já foi encerrada. Entre com uma conta existente.")
            now = int(self.now())
            if not state.token_hash or (state.expires_at or 0) <= now:
                raise HTTPException(403, "Código indisponível ou expirado. Renove-o no console do servidor.")
            if now - (state.window_started_at or 0) >= ATTEMPT_SECONDS:
                state.window_started_at, state.failures = now, 0
            if (state.failures or 0) >= MAX_ATTEMPTS:
                failure = HTTPException(429, "Muitas tentativas. Aguarde um minuto ou renove o código no servidor.", headers={"Retry-After": "60"})
            elif not isinstance(supplied, str) or len(supplied) > 128 or not secrets.compare_digest(hashlib.sha256(supplied.encode()).hexdigest(), state.token_hash):
                state.failures = (state.failures or 0) + 1
                failure = HTTPException(403, "Código de instalação inválido. Confira o console do servidor.")
            else:
                name, email, password = validate_account(payload)
                db.add(self.User(username=name, email=email, password=self.passwords.hash(password), role="admin"))
                self.invalidate(state)
        if failure:  # Commit failed-attempt counters too, shared by all processes.
            raise failure
        return {"message": "Administrador criado. Entre com o e-mail e a senha que você definiu."}


def setup_router(service):
    router = APIRouter(prefix="/setup", tags=["Configuração inicial"])

    @router.get("/status")
    def status(response: Response):
        response.headers["Cache-Control"] = "no-store"
        return service.status()

    @router.post("/admin", status_code=201)
    async def create_admin(request: Request, response: Response):
        response.headers["Cache-Control"] = "no-store"
        # Avoid framework validation errors echoing passwords or the submitted body.
        body = bytearray()
        async for chunk in request.stream():
            body.extend(chunk)
            if len(body) > 16384:
                raise HTTPException(413, "Formulário de instalação excede o tamanho permitido.")
        try:
            payload = InitialAdminCreate.model_validate(json.loads(body))
        except (ValidationError, ValueError, TypeError, UnicodeError):
            raise HTTPException(422, "Informe nome, e-mail, senha e confirmação, sem campos adicionais.") from None
        return await run_in_threadpool(service.complete, payload, request.headers.get("X-Bootstrap-Token", ""))

    return router


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Renova o código somente se a instalação ainda não tiver contas.")
    parser.add_argument("--renew", action="store_true", required=True)
    parser.parse_args()
    from database.db import SessionLocal, User, InitialSetupState
    from passlib.context import CryptContext
    service = InitialSetup(SessionLocal, User, InitialSetupState, CryptContext(schemes=["bcrypt"], deprecated="auto"))
    try:
        active = service.prepare(renew=True)
    except HTTPException as exc:
        print(f"Não foi possível renovar o código: {exc.detail}")
        raise SystemExit(1) from None
    if not active:
        print("Configuração inicial encerrada. Nenhuma conta foi alterada e nenhum código foi emitido.")


if __name__ == "__main__":
    main()
