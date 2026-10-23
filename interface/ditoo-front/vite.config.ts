import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ["**/documentos/**", "**/vetores_db/**", "**/ditoo.db*", "**/*.upload"],
    },
    proxy: {
      "^/setup/(status|admin)$": { target: "http://localhost:8000", changeOrigin: true },
      "^/(ask|loginUser|register|logout|me|getUsers|upload|changeModel|getHistory|fetchMessages|getConfig|updateConfig|getUserMemories|deleteMemory|getFolders|createFolder|deleteFolder|grantFolderAccess|revokeFolderAccess|getFolderAccess|insertUserMemory|removeUserMemory|reindexAll)(/.*)?$":
        {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
    },
  },
});
