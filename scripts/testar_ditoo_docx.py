"""Bateria oficial da Etapa 3 (DOCX), pela API e autenticação do chat.

Requer testar_ditoo.py na mesma pasta. Inicie o backend e indexe o arquivo
POP-ENG-2026-V3.1_Engenharia_DevSecOps_Vertice.docx antes de executar.
"""
from testar_ditoo import main


PERGUNTAS_DOCX = [
    "Segundo a norma NRM-DEV-701 do documento POP-ENG-2026-V3.1, quem é o Head de Engenharia responsável pelo GitLab Enterprise, quantos revisores são exigidos em um Merge Request e qual é a cobertura mínima de testes unitários exigida para sistemas Tier-1 e Tier-2/3?",
    "Quais são os dias e horários permitidos para a Janela Padrão de Deploy em produção (GMUD), com qual antecedência o chamado deve ser aberto e quais são os gatilhos exatos para o rollback automático no modo Canary Release?",
    "Na política de Banco de Dados (NRM-DBA-904), quem é a DBA responsável e quais são o RPO, o RTO e a política de retenção de backup para os bancos de dados das classes Tier-1 e Tier-2?",
    "Quais são os limites de Rate Limiting (em requisições por minuto) aplicados pelo Kong API Gateway para clientes externos e internos, qual o tamanho máximo de payload síncrono e o que acontece quando um cliente ultrapassa a quota?",
    "Nossa equipe precisa subir uma entrega regulatória urgente em produção, mas o SonarQube bloqueou a esteira porque encontrou duas vulnerabilidades no código: uma de severidade Alta (CVSS 7.8) sem patch do fabricante e outra Crítica (CVSS 9.2). Podemos solicitar o Waiver de Risco Aceito (SEC-WAV-04) para liberar esse deploy hoje? Explique a regra aplicável.",
    "Hoje é sexta-feira, 15h00, e um desenvolvedor quer subir duas atualizações em produção: (1) uma melhoria visual na tela de relatórios do ERP e (2) uma correção emergencial (Hotfix) para um incidente de Severidade P1 que derrubou o faturamento. Quais dessas duas atualizações podem subir agora e qual é o procedimento obrigatório?",
    "Um analista de testes copiou um dump do banco PostgreSQL de Produção com CPFs e salários reais direto para o ambiente de Homologação sem rodar o script DataMask-Vértice v2.4, e ainda desativou manualmente a verificação do SonarQube no pipeline para acelerar o teste. Quais são as duas penalidades exatas que ocorrerão segundo o manual POP-ENG-2026-V3.1?",
    "De acordo com a norma NRM-AIA-990 presente no documento POP-ENG-2026-V3.1, qual é a chave de API corporativa e o limite mensal de gastos em dólares (USD) para envio de documentos confidenciais da Vértice para os modelos GPT-4o da OpenAI e Claude 3.5 Sonnet na AWS Bedrock?",
    "Qual é o procedimento descrito na Seção 5 do POP-ENG-2026-V3.1 para configurar integrações via protocolo SOAP/XML legado e GraphQL Público sem autenticação para parceiros de transporte?",
    "Como o período de 20 de novembro a 05 de janeiro tem menos movimento administrativo, confirmo que pela norma NRM-OPS-812 a janela de deploy em produção fica liberada todos os dias úteis das 14h00 às 18h00 para adiantar entregas do ano seguinte, correto?",
]


if __name__ == "__main__":
    raise SystemExit(main(questions=PERGUNTAS_DOCX, dataset="docx"))
