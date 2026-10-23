"""Keep operator prompts readable without muting HTTP access logs or failures."""
from pathlib import Path
import logging
import os
import subprocess
import time


def configure_console_output():
    # Apply BEFORE importing ML libraries: tqdm/HF read these during import.
    os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
    os.environ["TQDM_DISABLE"] = "1"
    os.environ["HF_HUB_VERBOSITY"] = "warning"
    os.environ["TRANSFORMERS_VERBOSITY"] = "warning"
    for name in ("huggingface_hub", "transformers", "sentence_transformers", "torch", "httpx", "httpcore"):
        logging.getLogger(name).setLevel(logging.WARNING)
    # No root logger changes: uvicorn.access, uvicorn.error and application logs remain intact.


def disable_model_progress():
    # Public APIs also handle modules that were imported by another dependency.
    from huggingface_hub.utils import disable_progress_bars
    from transformers.utils.logging import disable_progress_bar
    disable_progress_bars()
    disable_progress_bar()


def start_ollama(ready, log_directory, *, timeout=30, popen=None, sleep=None, clock=None):
    """Only a new Ditoo-owned subprocess is redirected; existing servers are untouched."""
    popen = subprocess.Popen if popen is None else popen
    sleep = time.sleep if sleep is None else sleep
    clock = time.monotonic if clock is None else clock
    directory = Path(log_directory)
    log = directory / "ollama.log"
    try:
        directory.mkdir(parents=True, exist_ok=True)
        with log.open("ab") as output:
            process = popen(["ollama", "serve"], stdin=subprocess.DEVNULL,
                            stdout=output, stderr=subprocess.STDOUT,
                            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
    except OSError as exc:
        raise RuntimeError(f"Não foi possível iniciar o Ollama e gravar seu log em {log}: {exc}") from exc
    deadline = clock() + timeout
    while True:
        code = process.poll()
        if code is not None:
            raise RuntimeError(f"Ollama encerrou durante a inicialização (código {code}). Consulte {log}.")
        if ready():
            print(f"Ollama iniciado. Log do serviço: {log}", flush=True)
            return process
        if clock() >= deadline:
            raise RuntimeError(f"Ollama não ficou disponível em {timeout} segundos. Consulte {log}; verifique o processo antes de tentar novamente.")
        sleep(0.2)
