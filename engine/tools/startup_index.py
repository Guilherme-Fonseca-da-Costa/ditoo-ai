"""Escolha de indexação no console, inclusive no subprocesso do Uvicorn."""
from contextlib import contextmanager, ExitStack
import os
import sys


def entrada_e_console(entrada):
    if entrada is None or not entrada.isatty():
        return False
    if os.name != "nt":
        return True
    # No Windows, NUL também retorna isatty() == True. GetConsoleMode
    # distingue o console real de NUL, inclusive sob multiprocessing.
    import ctypes
    from ctypes import wintypes
    import msvcrt
    try:
        modo = wintypes.DWORD()
        get_mode = ctypes.WinDLL("kernel32", use_last_error=True).GetConsoleMode
        get_mode.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
        return bool(get_mode(msvcrt.get_osfhandle(entrada.fileno()), ctypes.byref(modo)))
    except (AttributeError, OSError, ValueError):
        return False


@contextmanager
def console_interativo():
    if entrada_e_console(sys.stdin):
        yield sys.stdin, sys.stdout
        return

    # Recuperar entrada só faz sentido quando o prompt pode aparecer no
    # console do usuário. Serviços com saídas redirecionadas não aguardam.
    if os.name == "nt" and not (entrada_e_console(sys.stdout) or entrada_e_console(sys.stderr)):
        yield None, None
        return

    # multiprocessing pode substituir stdin por devnull. O console anexado
    # continua disponível; não criamos uma janela nem lemos pipes de serviços.
    with ExitStack() as stack:
        try:
            entrada = stack.enter_context(open("CONIN$" if os.name == "nt" else "/dev/tty", "r"))
            saida = stack.enter_context(open("CONOUT$", "w")) if os.name == "nt" else sys.stdout
            if not entrada_e_console(entrada):
                entrada = saida = None
        except OSError:
            entrada = saida = None
        yield entrada, saida


def perguntar_reindexacao():
    with console_interativo() as (entrada, saida):
        if entrada is None:
            return False
        while True:
            try:
                print("Deseja reindexar todos os arquivos? [s/N]: ", end="", file=saida, flush=True)
                resposta = entrada.readline().strip().casefold()
            except (EOFError, OSError):
                return False
            if resposta in ("s", "sim", "y", "yes"):
                return True
            if resposta in ("", "n", "não", "nao", "no"):
                return False
            print("Resposta inválida. Digite sim (s) ou não (n).", file=saida, flush=True)


def inicializar_indice(collection, carregar_documentos):
    if perguntar_reindexacao():
        carregar_documentos()
    elif collection.count() == 0:
        print("Índice vazio ou inexistente. Executando indexação inicial...", flush=True)
        carregar_documentos()
    else:
        print("Usando o índice existente; reindexação completa ignorada.", flush=True)
