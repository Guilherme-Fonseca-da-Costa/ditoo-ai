import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import DitooLogo from '../components/DitooLogo';
import { api } from '../services/api';
import { SetupError } from '../utils/setupTransport';
import '../assets/setup.css';

export default function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    let active = true;
    api.getSetupStatus().then(status => {
      if (!active) return;
      if (!status.required) navigate('/login', { replace: true });
      else setChecking(false);
    }).catch(() => {
      if (active) setError('Não foi possível verificar o servidor. Tente novamente.');
    });
    return () => { active = false; };
  }, [navigate, retry]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current || checking) return;
    setError('');
    if (password !== confirmation) { setError('A confirmação da senha não confere.'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('A senha pode ter no máximo 72 bytes UTF-8.'); return; }
    pending.current = true;
    setBusy(true);
    try {
      await api.createInitialAdmin({ username: username.trim(), email: email.trim(), password, password_confirmation: confirmation }, token);
      setPassword(''); setConfirmation(''); setToken('');
      navigate('/login', { replace: true, state: { setupComplete: true } });
    } catch (err) {
      if (err instanceof SetupError && err.status === 409) {
        setPassword(''); setConfirmation(''); setToken('');
        navigate('/login', { replace: true, state: { setupComplete: true } });
      } else setError(err instanceof Error ? err.message : 'Falha na configuração. Tente novamente.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return <main className="login-page setup-page">
    <section className="login-card setup-card" aria-labelledby="setup-title">
      <DitooLogo size={44} />
      <h1 id="setup-title" className="login-title">Primeiro acesso</h1>
      <p className="login-subtitle">Defina a conta administradora desta instalação.</p>
      <p className="setup-help">Use o código temporário exibido no console do servidor. Ele vale por 15 minutos. Não há usuário ou senha padrão.</p>
      {error && <p role="alert" className="setup-error">{error}</p>}
      {checking ? <>
        {!error && <p role="status">Verificando a instalação...</p>}
        {error && <button type="button" className="login-btn" onClick={() => { setError(''); setRetry(value => value + 1); }}>Tentar novamente</button>}
      </> : <form onSubmit={submit} className="setup-form" aria-busy={busy}>
        <label htmlFor="setup-token">Código do servidor</label>
        <input id="setup-token" className="login-input" type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" maxLength={128} required disabled={busy} />
        <label htmlFor="setup-name">Nome</label>
        <input id="setup-name" className="login-input" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="name" minLength={2} maxLength={80} required disabled={busy} />
        <label htmlFor="setup-email">E-mail para entrar</label>
        <input id="setup-email" className="login-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" maxLength={254} required disabled={busy} />
        <label htmlFor="setup-password">Senha</label>
        <input id="setup-password" className="login-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" minLength={12} maxLength={72} aria-describedby="setup-password-help" required disabled={busy} />
        <p id="setup-password-help" className="setup-help">Pelo menos 12 caracteres, incluindo maiúscula, minúscula e número. Máximo de 72 bytes UTF-8.</p>
        <label htmlFor="setup-confirm">Confirme a senha</label>
        <input id="setup-confirm" className="login-input" type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="new-password" minLength={12} maxLength={72} required disabled={busy} />
        <button type="submit" className="login-btn" disabled={busy}>{busy ? 'Criando administrador...' : 'Criar administrador'}</button>
      </form>}
      <p className="setup-help">Código perdido ou expirado? No servidor, execute <code>python -m tools.initial_setup --renew</code> na pasta engine. Se usar o executável, execute <code>ditoo-server.exe --renew-setup-code</code>. Depois da criação, este fluxo será encerrado.</p>
    </section>
  </main>;
}
