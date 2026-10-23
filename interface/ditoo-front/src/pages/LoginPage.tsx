import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
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
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [connectionError, setConnectionError] = useState("");
  const location = useLocation();

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
    let active = true;
    Promise.all([api.getMe(), api.getSetupStatus()]).then(([me, setup]) => {
      if (!active) return;
      if (me) navigate("/chat", { replace: true });
      else if (setup.required) navigate("/setup", { replace: true });
      else setChecking(false);
    }).catch(() => {
      if (active) setConnectionError("Não foi possível verificar o servidor. Tente novamente.");
    });
    return () => { active = false; };
  }, [navigate, retry]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checking || busy) return;
    setBusy(true);
    try {
      const data = await api.login(email, password);
      if (data?.error) pushAlert(data.error, "error");
      else navigate("/chat");
    } catch {
      pushAlert("Não foi possível entrar. Confira sua conexão e tente novamente.", "error");
    } finally {
      setBusy(false);
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
        {location.state?.setupComplete && <p role="status">Configuração inicial encerrada. Entre com a conta que foi criada.</p>}
        {checking && !connectionError && <p role="status">Verificando a instalação...</p>}
        {connectionError && <><p role="alert">{connectionError}</p><button type="button" className="login-btn" onClick={() => { setConnectionError(""); setRetry(value => value + 1); }}>Tentar novamente</button></>}

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
          <button type="submit" disabled={checking || busy} className="login-btn">
            {busy ? "Entrando..." : "Entrar"}
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
