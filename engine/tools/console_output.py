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


def detectar_gpu_amd() -> bool:
    """Detecta se a máquina Windows possui GPU AMD Radeon dedicada sem GPU NVIDIA."""
    if os.name != "nt":
        return False
    try:
        saida = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_VideoController).Name"],
            text=True,
            timeout=5,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        ).lower()
        return ("amd" in saida or "radeon" in saida) and ("nvidia" not in saida)
    except Exception:
        return False


def parar_ollama_existente(ready, timeout=5):
    """Encerra instâncias prévias do Ollama no Windows para reaplicar variáveis de GPU (Vulkan)."""
    if os.name != "nt" or not ready():
        return
    flags = subprocess.CREATE_NO_WINDOW
    for proc_name in ("ollama app.exe", "ollama.exe"):
        subprocess.run(
            ["taskkill", "/F", "/IM", proc_name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=flags,
        )
    limite = time.monotonic() + timeout
    while ready() and time.monotonic() < limite:
        time.sleep(0.2)


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
