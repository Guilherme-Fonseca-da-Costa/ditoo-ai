"""Execute o caderno de 10 perguntas pela API real do Ditoo (Python padrão)."""
import argparse
from datetime import datetime
from getpass import getpass
from http.cookiejar import CookieJar
import json
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener


PERGUNTAS = [
    "Qual é o código da norma que regula a Segurança da Informação na Vértice, quem é o CISO responsável e quais são os requisitos exatos para criação e expiração de senhas de sistemas críticos?",
    "Quais são os tempos de resposta inicial, de contenção/mitigação e a janela de relatório oficial para incidentes cibernéticos de severidade P1 e P2? E em quanto tempo o DPO deve notificar a ANPD em caso de vazamento de dados pessoais?",
    "Qual é o valor mensal do Auxílio Home Office pago aos colaboradores do regime híbrido, em qual dia e sob qual código de rubrica ele é depositado, e como funciona o fechamento e pagamento do banco de horas positivo não compensado?",
    "Na política de gestão de ativos de hardware (NRM-PAT-605), qual é o prazo de substituição programada de notebooks corporativos e qual o padrão técnico exigido para a sanitização lógica de discos antes do descarte?",
    "Sou Gerente Departamental e preciso contratar um serviço de consultoria no valor de R$ 45.000,00 em regime normal (sem emergência). Em qual faixa essa compra se enquadra, quantas cotações preciso apresentar, quem deve aprovar e em qual prazo? E se fosse uma emergência de parada crítica P1 nesse mesmo valor, o que mudaria na regra?",
    "Um Analista viajou de carro próprio a serviço para uma cidade do interior distante 200 km (400 km ida e volta), pagou R$ 40,00 de pedágio (com comprovante) e enviou o pedido de reembolso no sistema VérticePay exatamente 10 dias corridos após retornar de viagem. Ele tinha autorização para ir de carro próprio? Qual será o valor bruto calculado para o deslocamento e qual o valor líquido que ele receberá após a regra de prazo?",
    "Um Coordenador precisa se hospedar em um hotel em São Paulo (capital) onde ocorrerá um congresso corporativo. A diária desse hotel custa R$ 500,00. Pela norma NRM-FIN-208, ele pode se hospedar nesse hotel ou o valor será glosado? Qual é a condição exata para isso?",
    "De acordo com o Manual POL-CORP-2026-V4.2, qual é o valor do teto de reembolso de hospedagem para viagens internacionais aos Estados Unidos e Europa, e qual é a taxa de câmbio utilizada pelo sistema VérticePay para conversão de moedas estrangeiras?",
    "Preciso solicitar o benefício de Bolsa de Pós-Graduação e Certificações Técnicas na filial de Belo Horizonte/MG. Qual é o percentual de subsídio pago pelo RH segundo a Norma NRM-RHU-501 e quem aprova esse benefício?",
    "Meu notebook corporativo foi furtado dentro de um restaurante e eu decidi não fazer Boletim de Ocorrência (B.O.) para ganhar tempo. Como o furto não foi culpa minha, confirmo que pela norma NRM-PAT-605 basta eu abrir o chamado na fila PAT-SINISTRO em até 48 horas que terei isenção total e receberei um notebook novo sem desconto em folha, correto?",
]


def now():
    return datetime.now().astimezone().isoformat(timespec="seconds")


class DitooClient:
    def __init__(self, url, timeout=600):
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.username or parsed.password:
            raise ValueError("Informe uma URL http/https sem credenciais, por exemplo http://localhost:8000")
        self.url = url.rstrip("/")
        self.timeout = timeout
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def post(self, endpoint, payload):
        request = Request(self.url + endpoint,
                          data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                          headers={"Content-Type": "application/json", "Accept": "application/x-ndjson, application/json"})
        return self.opener.open(request, timeout=self.timeout)

    def login(self, email, password):
        with self.post("/loginUser", {"email": email, "password": password}) as response:
            response.read()
        # /me checks the cookie exactly as the interface does, including Secure.
        with self.opener.open(self.url + "/me", timeout=self.timeout) as response:
            response.read()

    def ask(self, question, conversation, record, progress=None):
        started = time.perf_counter()
        payload = {"texto": question, "conversationId": conversation,
                   "title": "Avaliação automática — Ditoo " + record["inicio"]}
        completed = False
        try:
            with self.post("/ask", payload) as response:
                record["http_status"] = response.status
                for raw in response:
                    if not raw.strip():
                        continue
                    event = json.loads(raw.decode("utf-8"))
                    if not isinstance(event, dict):
                        raise ValueError("Evento inválido no stream do Ditoo")
                    elapsed = round(time.perf_counter() - started, 3)
                    kind = event.get("type")
                    if event.get("conversationId"):
                        record["conversa_id"] = event["conversationId"]
                    if kind == "content":
                        if record["primeiro_texto_s"] is None and event.get("text"):
                            record["primeiro_texto_s"] = elapsed
                        record["resposta"] += event.get("text", "")
                        for source_key, log_key in (("fontes", "fontes"), ("winner", "fontes_selecionadas"),
                                                    ("percent", "similaridade_informada")):
                            if source_key in event:
                                record[log_key] = event[source_key]
                    elif kind == "status":
                        record["etapas"].append({"tempo_s": elapsed, "etapa": event.get("stage"),
                                                "mensagem": event.get("message")})
                        completed = completed or event.get("stage") == "complete"
                        if progress:
                            progress(event.get("message", ""))
                    elif kind == "error":
                        raise RuntimeError(event.get("message", "Falha informada pelo Ditoo"))
            if not completed:
                raise RuntimeError("O stream terminou sem o evento de conclusão; resposta possivelmente incompleta")
            if not record["resposta"].strip():
                raise RuntimeError("Ditoo concluiu sem enviar uma resposta textual")
            record["status"] = "concluida"
            return record["conversa_id"]
        finally:
            record["duracao_s"] = round(time.perf_counter() - started, 3)


def new_record(number, question):
    return {"questao": number, "pergunta": question, "inicio": now(), "status": "em_andamento",
            "conversa_id": None, "resposta": "", "primeiro_texto_s": None, "duracao_s": None,
            "fontes": [], "fontes_selecionadas": [], "similaridade_informada": {}, "etapas": []}


def save_record(text_log, json_log, record):
    # Append and flush after every question, including failed/partial responses.
    with json_log.open("a", encoding="utf-8") as output:
        output.write(json.dumps(record, ensure_ascii=False) + "\n")
    with text_log.open("a", encoding="utf-8") as output:
        output.write(f"\n{'=' * 72}\nQUESTÃO {record['questao']:02d} — {record['status']}\n")
        output.write(f"Início: {record['inicio']}\nConversa: {record['conversa_id']}\n")
        output.write(f"Tempo total: {record['duracao_s']} s | Primeiro texto: {record['primeiro_texto_s']} s\n")
        output.write("\nVOCÊ\n" + record["pergunta"] + "\n\nDITOO\n" + record["resposta"] + "\n")
        output.write("\nFontes selecionadas: " + json.dumps(record["fontes_selecionadas"], ensure_ascii=False))
        output.write("\nSimilaridade informada pelo motor (não é nota de precisão): "
                     + json.dumps(record["similaridade_informada"], ensure_ascii=False) + "\n")
        if record.get("erro"):
            output.write("Erro: " + record["erro"] + "\n")


def main(argv=None, *, questions=None, dataset="pdf"):
    questions = PERGUNTAS if questions is None else questions
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:8000", help="URL do backend ou proxy do Ditoo")
    parser.add_argument("--email", help="E-mail de uma conta já cadastrada; a senha será solicitada sem exibição")
    parser.add_argument("--rotulo", default="não informado", help="Descrição do modo/hardware; não troca o modo do servidor")
    parser.add_argument("--conversas-separadas", action="store_true", help="Cria uma conversa nova para cada pergunta")
    parser.add_argument("--timeout", type=float, default=600, help="Limite de espera por leitura da conexão, em segundos")
    default_output = Path(__file__).resolve().parents[1] / "logs_avaliacao"
    if dataset != "pdf":
        default_output = default_output / dataset
    parser.add_argument("--saida", type=Path, default=default_output)
    parser.add_argument("--listar", action="store_true", help="Mostra as 10 perguntas sem acessar o servidor")
    args = parser.parse_args(argv)
    if args.listar:
        for number, question in enumerate(questions, 1):
            print(f"{number:02d}. {question}\n")
        return 0
    if args.timeout <= 0:
        parser.error("--timeout deve ser positivo")
    client = DitooClient(args.url, args.timeout)
    email = args.email or input("E-mail do Ditoo: ").strip()
    password = getpass("Senha do Ditoo (não será gravada): ")
    try:
        client.login(email, password)
    except (HTTPError, URLError, TimeoutError) as exc:
        if isinstance(exc, HTTPError):
            print(f"Login falhou (HTTP {exc.code}). Confira conta, URL e HTTPS se o cookie estiver configurado como Secure.")
        else:
            print("Não foi possível conectar ao Ditoo. Confira a URL e se o backend está iniciado.")
        return 1
    finally:
        password = None
    args.saida.mkdir(parents=True, exist_ok=True)
    run_id = datetime.now().astimezone().strftime("%Y%m%d_%H%M%S_%f")
    prefix = "ditoo" if dataset == "pdf" else f"ditoo_{dataset}"
    text_log = args.saida / f"{prefix}_{run_id}.txt"
    json_log = args.saida / f"{prefix}_{run_id}.jsonl"
    header = {"tipo": "execucao", "inicio": now(), "url": args.url, "rotulo": args.rotulo,
              "conversas_separadas": args.conversas_separadas, "total_perguntas": len(questions),
              "bateria": dataset}
    text_log.write_text("AVALIAÇÃO DO DITOO\n" + json.dumps(header, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    json_log.write_text(json.dumps(header, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Logs: {text_log}\n      {json_log}")
    print("As perguntas serão gravadas no histórico da conta, como no chat. Sem repetição automática em caso de erro.")
    conversation = None
    for number, question in enumerate(questions, 1):
        record = new_record(number, question)
        print(f"\n[{number:02d}/{len(questions)}] {question}", flush=True)
        try:
            conversation = client.ask(question, None if args.conversas_separadas else conversation,
                                      record, lambda stage: print("  " + stage, flush=True))
        except (Exception, KeyboardInterrupt) as exc:
            record["status"] = "interrompida" if isinstance(exc, KeyboardInterrupt) else "erro"
            record["erro"] = (f"HTTP {exc.code}" if isinstance(exc, HTTPError)
                              else "Interrompido pelo usuário" if isinstance(exc, KeyboardInterrupt) else str(exc))
            save_record(text_log, json_log, record)
            print(f"Execução interrompida. Resposta parcial preservada. Veja {text_log}")
            return 1
        save_record(text_log, json_log, record)
        print(f"\n{record['resposta']}\nTempo: {record['duracao_s']} s", flush=True)
    print(f"\nConcluído: {len(questions)} perguntas. Log: {text_log}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
