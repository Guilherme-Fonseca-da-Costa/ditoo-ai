"""Bateria oficial da Etapa 2 (XLSX), pela mesma API e autenticação do chat.

Requer testar_ditoo.py na mesma pasta. Inicie o backend e indexe a planilha
Base_Auditoria_Contratos_SLAs_Vertice_2026.xlsx antes de executar.
"""
from testar_ditoo import main


PERGUNTAS_XLSX = [
    "Qual é o fornecedor, o sistema/serviço contratado, o gestor responsável, o valor mensal, o valor anual e o índice de reajuste do contrato CTR-2026-001?",
    "Na aba de contratos de TI ativos, qual é o custo total mensal e o custo total anual somando todos os 12 contratos da empresa? E qual contrato possui reajuste por Taxa Fixa (Sem Reajuste)?",
    "Qual é a situação orçamentária do centro de custo CC-3015-OPS no 1º trimestre de 2026 (orçamento previsto, valor realizado, saldo disponível, percentual consumido e status da alçada)?",
    "No registro de incidentes do 1º trimestre (Aba Registro_Incidentes_SLA), quantos incidentes foram registrados ao todo, quantos violaram o SLA e qual foi o valor total acumulado de multas (glosas) aplicadas aos fornecedores?",
    "Quais contratos ativos estão alocados sob responsabilidade do centro de custo CC-4020-SEC (Segurança da Informação), quem é o gestor deles e qual é a soma mensal desses contratos? Além disso, qual é o saldo orçamentário disponível desse centro de custo na Aba 2?",
    "Analise o incidente INC-2026-0315 ocorrido em 18/03/2026. Qual contrato e qual fornecedor foram responsáveis por essa falha, por que o SLA foi considerado violado e qual foi a multa aplicada?",
    "A Filial Campinas/SP (centro de custo CC-3015-OPS) precisa contratar com urgência um serviço de manutenção corretiva de R$ 6.000,00 para um módulo não crítico (Severidade P3). Olhando para a situação desse centro de custo na planilha de orçamento, essa compra pode ser aprovada hoje? Por quê?",
    "Qual é o valor mensal pago na planilha de contratos pelo licenciamento do banco de dados Oracle Exadata (contrato CTR-2026-015) e da plataforma Microsoft Azure Cloud na Filial do Rio de Janeiro/RJ?",
    "De acordo com a aba Registro_Incidentes_SLA, qual foi o valor da multa (glosa) paga pela empresa LogiSoft Sistemas S.A. no incidente INC-2026-0104 ocorrido em 14/01/2026 no sistema WMS Enterprise?",
    "Olhando a coluna de 'Projeção de Reajuste Orçamentário para 2027 (Swap Cambial USD)' na aba Orcamento_Centros_Custo, qual é o percentual de aumento previsto para o departamento de Recursos Humanos (CC-2050-RHU)?",
]


if __name__ == "__main__":
    raise SystemExit(main(questions=PERGUNTAS_XLSX, dataset="xlsx"))
