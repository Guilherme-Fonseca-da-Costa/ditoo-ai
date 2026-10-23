# Ditoo — executar pelo ZIP

## Preparação

- Use Windows de 64 bits e extraia o ZIP completo em uma pasta com permissão de escrita.
- Instale e deixe o **Ollama** em execução. Não é necessário instalar Python ou Node.js.
- No PowerShell ou Prompt de Comando, baixe os dois modelos:

```powershell
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:7b
```

Mantenha internet disponível na primeira inicialização: o modelo de embeddings usado na busca de documentos também é baixado automaticamente.

## Iniciar e acessar

1. Abra `server\ditoo-server` dentro da pasta extraída e execute `ditoo-server.exe`.
2. Abra **http://localhost:8000** no navegador.
3. No primeiro acesso, abra **http://localhost:8000/setup**, copie o código temporário exibido no console e cadastre o administrador. O código vale por 15 minutos; a senha exige pelo menos 12 caracteres, maiúscula, minúscula e número.
4. Entre com o e-mail e a senha cadastrados. Não há credenciais padrão.

Nas próximas vezes, basta manter o Ollama disponível e executar o servidor. Deixe o console aberto enquanto usa o Ditoo.

## Cuidados básicos

- Não execute duas instâncias do servidor na mesma máquina.
- Os dados são gravados junto do executável. Preserve `.env`, `ditoo.db`, `documentos` e `vetores_db` ao trocar de versão;
- Se o código de primeiro acesso expirar, encerre o servidor e execute `ditoo-server.exe --renew-setup-code` no terminal dessa pasta; depois inicie o servidor novamente.
- Para acessar de outro computador da mesma rede, use `http://IP-DO-SERVIDOR:8000` e mantenha o servidor ligado.

# Ditoo — executar pelo repositório

## Requisitos

Windows de 64 bits, **Git**, **Python 3.12**, **Node.js 22.12 ou superior** e **Ollama** instalado e em execução. Os comandos abaixo usam o **Prompt de Comando (CMD)**.

## 1. Clonar e instalar

```bat
git clone https://github.com/Guilherme-Fonseca-da-Costa/ditoo-ai.git
cd ditoo-ai
python -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r engine\requirements.txt pandas
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:7b
```

Mantenha internet disponível na primeira inicialização para o download automático do modelo de embeddings usado na busca de documentos.

## 2. Preparar a interface e iniciar

A partir da raiz do repositório:

```bat
cd interface\ditoo-front
npm ci
npm run build
xcopy dist\* ..\..\engine\dist\ /E /I /Y
cd ..\..\engine
..\.venv\Scripts\python.exe engine.py
```

Aguarde a inicialização e abra **http://localhost:8000**. A cópia do frontend para `engine\dist` é necessária para que o backend sirva a interface.

## 3. Primeiro acesso

Abra **http://localhost:8000/setup**, use o código temporário exibido no console e cadastre o administrador. O código vale por 15 minutos. Use uma senha com pelo menos 12 caracteres, maiúscula, minúscula e número. Depois entre com o e-mail e a senha cadastrados; não há credenciais padrão.

## Próximas execuções

Com o Ollama disponível, abra o terminal na raiz do repositório e execute:

```bat
cd engine
..\.venv\Scripts\python.exe engine.py
```

Mantenha o terminal aberto e use apenas uma instância do servidor. Recompile e copie a interface quando alterar o frontend. Preserve os dados de `engine` (`.env`, `ditoo.db`, `documentos` e `vetores_db`) e não os publique no Git.

Para editar a interface com atualização automática, mantenha o backend aberto e execute `npm run dev` em outro terminal, dentro de `interface\ditoo-front`. Acesse o endereço mostrado pelo Vite, normalmente **http://localhost:5173**.

  
## Créditos e Licenças

* Este software é open-source, porém os ícones utilizados na interface foram obtidos através do [Flaticon](https://www.flaticon.com/) e pertencem aos seus respectivos autores. O uso destes assets está vinculado estritamente ao funcionamento desta aplicação, não sendo permitida a sua redistribuição ou venda isolada a partir deste repositório.

<a href="https://www.flaticon.com/free-icons/send" title="send icons">Send icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/catalog" title="catalog icons">Catalog icons created by Iconir - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/log-out" title="log out icons">Log out icons created by SumberRejeki - Flaticon</a>
