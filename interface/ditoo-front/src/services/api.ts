import { jwtDecode } from "jwt-decode";
// Esse arquivo é responsável por lidar com as chamadas à API do backend. Ele exporta um objeto `api` que contém métodos para interagir com os endpoints do backend, como o método `login` para autenticação.
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY ?? "ditoo_token";

export const api = {
  login: async (email: string, pass: string) => {
    const res = await fetch("/loginUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: pass,
      }),
    });
    const data = await res.json();
    console.log(data);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (res.status === 401) return { error: "Usuário ou senha incorretos" };
    return console.log(data);
  },
  register: async (
    username: string,
    email: string,
    pass: string,
    role: string,
  ) => {
    const res = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: pass,
        role: role,
      }),
    });
    return console.log(res);
  },
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = jwtDecode<{ sub: string; user: string; role: string }>(
      token,
    );
    localStorage.setItem("username", payload.user);
    return payload;
  },
  getUsers: async () => {
    const res = await fetch("/getUsers", {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    const data = await res.json();
    console.log(data);
    return data;
  },
  isLoggedIn: () => {
    !!localStorage.getItem(TOKEN_KEY);
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });

    if (!response.ok) {
      throw new Error(`Falha no upload: ${response.status}`);
    }

    return await response.json();
  },
  changeModel: async (model: string) => {
    console.log(model);
    const res = await fetch("/changeModel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model }),
    });
    return res.json();
  },
  getHistory: async () => {
    const res = await fetch("/getHistory", {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    return res.json();
  },
  fetchMessages: async (conversationId: string | null) => {
    const res = await fetch(`/fetchMessages/${conversationId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    return res.json();
  },
  async getConfig() {
    const res = await fetch("/getConfig", {
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    if (!res.ok) throw new Error("Erro ao buscar configuração");
    return res.json();
  },

  async updateConfig(patch: Record<string, unknown>) {
    const res = await fetch("/updateConfig", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Erro ao salvar configuração");
    return res.json();
  },

  async getUserMemories() {
    const res = await fetch("/getUserMemories", {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    if (!res.ok) throw new Error("Erro ao buscar memórias");
    return res.json();
  },

  async deleteMemory(id: string) {
    const res = await fetch(`/deleteMemory/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    if (!res.ok) throw new Error("Erro ao remover memória");
    return res.json();
  },
  async getFolders() {
    const res = await fetch("/getFolders", {
      method: "GET",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    if (!res.ok) throw new Error("Erro ao buscar pastas");
    return res.json();
  },

  createFolder: async (name: string, parentId: string, isPublic: string) => {
    const res = await fetch("/createFolder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({ name, parentId, isPublic }),
    });
    if (!res.ok) throw new Error("Erro ao criar pasta");
    return res.json();
  },

  async deleteFolder(id: string) {
    const res = await fetch(`/deleteFolder/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
    if (!res.ok) throw new Error("Erro ao remover pasta");
    return res.json();
  },
  async grantFolderAccess(
    folderId: string,
    userId: string,
    accessLevel: string,
  ) {
    const res = await fetch("/grantFolderAccess", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      },
      body: JSON.stringify({ folderId, userId, accessLevel }),
    });
    if (!res.ok) throw new Error("Erro ao conceder acesso à pasta");
    return res.json();
  },
};
