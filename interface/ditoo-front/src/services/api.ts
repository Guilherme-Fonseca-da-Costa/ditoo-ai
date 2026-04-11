// Esse arquivo é responsável por lidar com as chamadas à API do backend. Ele exporta um objeto `api` que contém métodos para interagir com os endpoints do backend, como o método `login` para autenticação.
export const api = {
  login: async (user: string, pass: string) => {
    const res = await fetch("/login", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    console.log(res);
    return res.json();
  },
  getUsers: async () => {
    const res = await fetch("/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/upload", { method: "POST", body: formData });
  },
  changeModel: async (model: string) => {
    console.log(model)
    const res = await fetch("/changeModel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({model: model}),
    });
    console.log(res.json)
    return res.json
    
  },
};
