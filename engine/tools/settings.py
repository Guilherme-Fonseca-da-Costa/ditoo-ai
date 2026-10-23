"""Resolve application configuration independently of the launch directory."""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.engine import make_url


def application_directory():
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


def load_environment():
    load_dotenv(application_directory() / ".env")


def database_url(value=None, base=None):
    base = application_directory() if base is None else Path(base)
    url = make_url(value if value is not None else os.getenv("DATABASE_URL", "sqlite:///ditoo.db"))
    if url.get_backend_name() == "sqlite" and url.database not in (None, "", ":memory:"):
        path = Path(url.database)
        if not path.is_absolute():
            path = base / path
        url = url.set(database=str(path.resolve()))
    return url
