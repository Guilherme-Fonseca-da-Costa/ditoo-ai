import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import DitooLogo from "../components/DitooLogo";
import Alert from "../components/Alert";
import { api } from "../services/api";


interface AlertItem {
  id: number;
  text: string;
  type?: "success" | "error" | "info";
}


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const navigate = useNavigate();
  
function pushAlert(text: string, type: AlertItem["type"] = "success") {
  const id = Date.now() + Math.random()
  setAlerts((prev) => [...prev, { id, text, type }]);
}

function removeAlert(id: number) {
  setAlerts((prev) => prev.filter((a) => a.id !== id));
}

  useEffect(() => {
  api.getMe().then((me) => {
    if (me) {
      navigate("/chat");
    }
  });
}, []);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data =  await api.login(email, password)
    if (data?.error) {
      console.log(data?.error)
      console.log("Não autorizado")
      pushAlert("Email ou senha incorretos", "error")
    }else {
      navigate("/chat");
    }
  }

  return (
    <div className="login-page">
      {alerts.map((a) => (
          <Alert
            key={a.id}
            text={a.text}
            type={a.type}
            onClose={() => removeAlert(a.id)}
          />
        ))}
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
          <button onClick={handleSubmit} className="login-btn">
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
