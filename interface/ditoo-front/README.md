# ditoo-front — Interface Redesenhada

## Estrutura de arquivos

```
src/
├── assets/
│   └── index.css           ← todos os tokens de design e estilos globais
├── context/
│   └── ThemeContext.tsx     ← tema (claro/escuro) e cor de destaque
├── components/
│   └── SheepLogo.tsx        ← logo SVG da ovelha
├── pages/
│   ├── Chat.tsx             ← interface principal do chat
│   ├── LoginPage.tsx        ← página de login
│   └── NotFound.tsx         ← página 404
└── main.tsx                 ← entry point com ThemeProvider + rotas
```

## Setup

1. Copie esses arquivos para o seu projeto substituindo os anteriores.
2. Instale as dependências novas (caso ainda não tenha):
   ```bash
   npm install
   ```
3. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```

> O `vite.config.ts` já tem o proxy `/ask → http://127.0.0.1:8000` configurado.
> Não é necessário alterar a URL no código — o fetch usa `/ask` relativamente.

## Personalização de tema

O sistema de temas funciona via CSS custom properties em `:root` / `[data-theme]`.
Para mudar as cores base, edite as variáveis no topo de `src/assets/index.css`.

Para adicionar uma nova cor de destaque, adicione uma entrada em `ACCENT_COLORS`
em `src/context/ThemeContext.tsx`.

## Próximos passos sugeridos

- [ ] Conectar login com autenticação real (OAuth Google ou JWT)
- [ ] Adicionar rota `/config` com página de configurações de sistema
- [ ] Buscar nome do usuário logado via API e passar ao Chat
- [ ] Persistir histórico de conversas no backend
- [ ] Adicionar suporte a múltiplas fontes por resposta (o backend já envia)
