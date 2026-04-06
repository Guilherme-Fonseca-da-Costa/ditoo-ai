# ditoo-front

## Estrutura de arquivos

```
src/
├── assets/
│   └── index.css           ← todos os tokens de design e estilos globais
├── context/
│   └── ThemeContext.tsx     ← tema (claro/escuro) e cor de destaque
├── components/
│   └── Logo.tsx        ← logo SVG
├── pages/
│   ├── Chat.tsx             ← interface principal do chat
│   ├── LoginPage.tsx        ← página de login
│   └── NotFound.tsx         ← página 404
└── main.tsx                 ← entry point com ThemeProvider + rotas
```

## Setup

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Rode em desenvolvimento:
   ```bash
   npm run build
   npm run dev
   ```
