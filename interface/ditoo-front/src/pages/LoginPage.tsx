import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DitooLogo from "../components/DitooLogo";
import Alert from "../components/Alert";
import { api } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false)
  const navigate = useNavigate();
  
 function handleAlert() {
  setShowAlert(true)
  setTimeout(() => {setShowAlert(false)} ,(3300))
 }

  useEffect(() => {
    if (api.getToken()) {
      navigate("/chat");
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data =  await api.login(email, password)
    if (data?.error) {
      console.log(data?.error)
      console.log("Não autorizado")
      handleAlert()
    }
    if (api.getToken()) {
      navigate("/chat");
    }
  }

  return (
    <div className="login-page">
      {showAlert && <Alert text="Email ou Senha incorretos"></Alert>}
      <div className="login-card">
        <DitooLogo size={44} />
        <h1 className="login-title">ditoo</h1>
        <p className="login-subtitle">Faça login para continuar</p>

        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{ marginTop: 8 }}
          />
          <button onClick={handleSubmit} className="login-btn" type="submit">
            Entrar
          </button>
        </form>

        <div className="login-divider">ou</div>

        <a
          href="/api/auth/google"
          style={{ width: "100%", textDecoration: "none" }}
        >
          <button
            className="login-btn"
            type="button"
            style={{
              background: "var(--surface2)",
              color: "var(--text)",
              border: "0.5px solid var(--border)",
              marginTop: 0,
            }}
          >
            Entrar com Google
          </button>
        </a>
      </div>
    </div>
  );
}
