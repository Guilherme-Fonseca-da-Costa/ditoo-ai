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
    register: async (user: string, pass: string) => {
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: user, password: pass }),
        });
        return res.json();
    }
}