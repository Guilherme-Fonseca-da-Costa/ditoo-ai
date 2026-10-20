import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "^/(ask|loginUser|register|logout|me|getUsers|upload|changeModel|getHistory|fetchMessages|getConfig|updateConfig|getUserMemories|deleteMemory|getFolders|createFolder|deleteFolder|grantFolderAccess|revokeFolderAccess|getFolderAccess|insertUserMemory|removeUserMemory|getEmails|reindexAll)(/.*)?$":
        {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
    },
  },
});