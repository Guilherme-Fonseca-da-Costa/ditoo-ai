import { uploadWithProgress } from "../utils/uploadTransport";

export const api = {
  login: async (email: string, pass: string) => {
    const res = await fetch("/loginUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password: pass }),
    });

    if (res.status === 401) return { error: "Usuário ou senha incorretos" };

    const data = await res.json();
    return data; 
  },

  register: async (
    username: string,
    email: string,
    pass: string,
    role: string,
  ) => {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, email, password: pass, role }),
    });
    return res.json();
  },

  getMe: async (): Promise<{ email: string; username: string; role: string } | null> => {
    try {
      const res = await fetch("/me", { credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  logout: async () => {
    await fetch("/logout", { method: "POST", credentials: "include" });
    try {
      sessionStorage.removeItem("ditoo-chat-active");
      sessionStorage.removeItem("ditoo-chat-draft");
    } catch { /* Storage can be disabled. */ }
  },

  getUsers: async () => {
    const res = await fetch("/getUsers", {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },

  upload: uploadWithProgress,

  changeModel: async (model: string) => {
    const res = await fetch("/changeModel", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ model }),
    });
    return res.json();
  },

  getHistory: async () => {
    const res = await fetch("/getHistory", {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },

  fetchMessages: async (conversationId: string | null) => {
    const res = await fetch(`/fetchMessages/${conversationId}`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },

  async getConfig() {
    const res = await fetch("/getConfig", { credentials: "include" });
    if (!res.ok) throw new Error("Erro ao buscar configuração");
    return res.json();
  },

  async updateConfig(patch: Record<string, unknown>) {
    const res = await fetch("/updateConfig", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Erro ao salvar configuração");
    return res.json();
  },

  async getUserMemories() {
    const res = await fetch("/getUserMemories", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erro ao buscar memórias");
    return res.json();
  },

  async deleteMemory(id: string) {
    const res = await fetch(`/deleteMemory/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erro ao remover memória");
    return res.json();
  },

  async getFolders() {
    const res = await fetch("/getFolders", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erro ao buscar pastas");
    return res.json();
  },

  createFolder: async (name: string, parentId: string, isPublic: string) => {
    const res = await fetch("/createFolder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, parentId, isPublic }),
    });
    if (!res.ok) throw new Error("Erro ao criar pasta");
    return res.json();
  },

  async deleteFolder(id: string) {
    const res = await fetch(`/deleteFolder/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erro ao remover pasta");
    return res.json();
  },

  async getFolderAccess(folderId: string) {
    const res = await fetch(`/getFolderAccess/${encodeURIComponent(folderId)}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(typeof error?.detail === "string" ? error.detail : "Erro ao carregar permiss\u00f5es da pasta.");
    }
    return res.json();
  },

  async revokeFolderAccess(folderId: string, userId: string) {
    const res = await fetch(`/revokeFolderAccess/${encodeURIComponent(folderId)}/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(typeof error?.detail === "string" ? error.detail : "Erro ao revogar acesso \u00e0 pasta.");
    }
    return res.json();
  },

  async grantFolderAccess(
    folderId: string,
    userId: string,
    accessLevel: string,
  ) {
    const res = await fetch("/grantFolderAccess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ folderId, userId, accessLevel }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(typeof error?.detail === "string" ? error.detail : "Erro ao conceder acesso \u00e0 pasta.");
    }
    return res.json();
  },

  async getEmails() {
    const res = await fetch("/getEmails", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Erro ao buscar emails");
    const data = await res.json();

  // Garante que o frontend sempre receba um array
  return Array.isArray(data.emails) ? data.emails : [];
  },
};