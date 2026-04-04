import { useState } from "react";
import { api } from "../services/api.ts";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  // Essa função é responsável por lidar com o processo de login. Ela chama o método `login` do objeto `api`, que faz uma requisição ao backend para autenticar o usuário. Se a requisição for bem-sucedida, o usuário será autenticado; caso contrário, um erro será registrado no console.
  const handleLogin = async () => {
    try {
      console.log("DEBUG: Tentando fazer login com:", { user, pass });
      await api.login(user, pass);
    } catch (error) {
      console.error("DEBUG: Erro ao fazer login:", error);
    }
  };

  return (
    <>
      <div id="loginBlock">
      <h1 style={{fontSize: "2.2em", color: "#bbbbbb", marginBottom: -20, userSelect: "none"}}>Ditoo.ai</h1>
        <h1 style={{ color: "#929292", userSelect: "none" }}>Login</h1>
        <div id="inputLoginBlock">
          <input
            className="loginInput"
            onChange={(e) => setUser(e.target.value)}
            type="email"
            name="email"
            id="email"
            placeholder="Email"
          />
          <input
            className="loginInput"
            onChange={(e) => setPass(e.target.value)}
            type="password"
            name="password"
            id="password"
            placeholder="Password"
          />
        </div>

        <button
          onClick={() => {
            handleLogin();
          }}
          style={{
            marginBottom: 20,
            borderRadius: 25,
            padding: "10px 20px",
            fontFamily: "Google-sans",
            fontWeight: "bold",
            border: "none",
            backgroundColor: "#6e6e6e",
            color: "white",
            cursor: "pointer",
          }}
          id="loginButton"
        >
          Entrar
        </button>
      </div>
    </>
  );
}
