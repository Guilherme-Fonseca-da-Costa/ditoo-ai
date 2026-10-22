"""Read the server clock in Sao Paulo; never ask the LLM to invent now."""
from datetime import datetime, timedelta, timezone
import re
import unicodedata
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

try:
    SAO_PAULO = ZoneInfo("America/Sao_Paulo")
except ZoneInfoNotFoundError:
    # Windows installations without IANA timezone data: Brasilia currently uses UTC-3.
    SAO_PAULO = timezone(timedelta(hours=-3), "America/Sao_Paulo")

DIAS = ("segunda-feira", "ter\u00e7a-feira", "quarta-feira", "quinta-feira", "sexta-feira", "s\u00e1bado", "domingo")
MESES = ("janeiro", "fevereiro", "mar\u00e7o", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro")


def agora_local(agora=None):
    if agora is None:
        return datetime.now(SAO_PAULO)
    if agora.tzinfo is None:
        raise ValueError("O horario de teste deve conter fuso")
    return agora.astimezone(SAO_PAULO)


def data_extenso(agora):
    return f"{DIAS[agora.weekday()]}, {agora.day} de {MESES[agora.month - 1]} de {agora.year}"


def contexto_relogio(agora=None):
    agora = agora_local(agora)
    return (f"Referencia temporal real desta requisicao: {data_extenso(agora)}, "
            f"{agora:%d/%m/%Y %H:%M:%S}, fuso America/Sao_Paulo (horario de Brasilia). "
            "Use esta referencia para hoje, ontem, amanha e agora. "
            "Datas de documentos e respostas anteriores nao representam a data atual. "
            "Nao altere datas historicas dos documentos para a data de hoje.")


def responder_relogio(pergunta, agora=None):
    texto = "".join(c for c in unicodedata.normalize("NFKD", pergunta.casefold()) if not unicodedata.combining(c))
    texto = re.sub(r"[?!.,;:]", " ", texto)
    texto = " ".join(texto.split())
    texto = re.sub(r"^(?:oi|ola|bom dia|boa tarde|boa noite)\s+", "", texto)
    texto = re.sub(r"^(?:voce sabe|pode me dizer|me diga|me fala|me fale|diga)\s+", "", texto)
    texto = re.sub(r"\s+(?:por favor|por gentileza)$", "", texto)
    padroes = (
        r"que horas (?:sao|e)(?: agora| ai| neste momento| em sao paulo| no brasil| em brasilia)?",
        r"qual (?:e )?(?:a )?(?:hora|horario)(?: atual| de agora| agora| em sao paulo| em brasilia)?",
        r"qual (?:e )?(?:a )?data(?: de hoje| atual)?",
        r"(?:me informe a )?data (?:de hoje|atual)",
        r"(?:qual (?:e )?(?:o )?|que )dia(?: da semana| do mes)? (?:(?:e|de) )?hoje",
        r"hoje e (?:que|qual) dia(?: da semana)?",
        r"(?:em )?que dia(?: da semana| do mes)? estamos(?: hoje)?",
        r"que horas sao e qual (?:e )?(?:a )?data(?: de hoje)?",
        r"(?:qual (?:e )?(?:a )?)?data e (?:a )?hora(?: atual| atuais| de hoje| agora)?",
        r"(?:qual (?:e )?(?:o )?)?dia e (?:a )?hora(?: atual| de hoje| agora)?",
        r"(?:que|qual) dia (?:foi ontem|e amanha|sera amanha|vai ser amanha)",
        r"qual (?:e |era |sera )?(?:a )?data (?:de ontem|de amanha)",
    )
    if not any(re.fullmatch(pattern, texto) for pattern in padroes):
        return None
    agora = agora_local(agora)
    if "amanha" in texto:
        return f"Amanh\u00e3 ser\u00e1 {data_extenso(agora + timedelta(days=1))}."
    if "ontem" in texto:
        return f"Ontem foi {data_extenso(agora - timedelta(days=1))}."
    if re.search(r"\b(hora|horas|horario)\b", texto):
        return f"Agora s\u00e3o {agora:%H:%M}, no hor\u00e1rio de Bras\u00edlia. Hoje \u00e9 {data_extenso(agora)}."
    return f"Hoje \u00e9 {data_extenso(agora)}."
