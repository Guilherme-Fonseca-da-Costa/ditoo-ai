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
  register: async (username: string, email: string, pass: string, role: string) => {
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
        role: role
      }),
    });
    return console.log(res);
  },
  getToken: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = jwtDecode<{ sub: string }>(token);
    localStorage.setItem("username", payload.sub);
    return token;
  },
  isLoggedIn: () => {
    !!localStorage.getItem(TOKEN_KEY);
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/upload", {
      method: "POST",
      body: formData,
      headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
    });
  },
  changeModel: async (model: string) => {
    console.log(model);
    const res = await fetch("/changeModel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model }),
    });
    console.log(res.json());
    return res.json();
  },
};
