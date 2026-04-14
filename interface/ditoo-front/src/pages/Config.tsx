// Config.tsx — Página de Configurações do Ditoo
import { useState } from "react";
import { useTheme, ACCENT_COLORS, type AccentColor } from "../context/ThemeContext";
import "../assets/configPage.css";

// ─── Icons ─────────────────────────

const Icons = {
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4v5c0 5-3.5 9-8 10C7.5 21 4 17 4 12V7l8-4z" strokeLinejoin="round" />
    </svg>
  ),
  Key: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="12" r="4" /><path d="M12 12h8M18 10v4" strokeLinecap="round" />
    </svg>
  ),
  Folder: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trash: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" />
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Lock: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  ),
  Sun: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
};

// ─── Constantes (mockups) ────

const CONST_USERS = [
  { id: 1, name: "John Doe",  email: "john.doe@empresa.com",  role: "admin" }
];

const CONST_FOLDERS = [
  { id: 1, name: "Documentos Gerais", path: "Ditoo/documentos",       type: "normal" }
];

const MODELS = [
  { value: "deepseek-r1:8b",   label: "DeepSeek R1 8B",   tag: "Recomendado" },
  { value: "deepseek-r1:1.5b", label: "DeepSeek R1 1.5B", tag: "Leve"        },
  { value: "llama3.2:3b",      label: "Llama 3.2 3B",     tag: "Rápido"      },
  { value: "qwen2.5:7b",       label: "Qwen 2.5 7B",      tag: "Preciso"     },
];


// Cabeçalho
function SectionHeader({ title, desc, warning }: { title: string; desc?: string; warning?: string }) {
  return (
    <div className="cfg-section-header">
      <h2 className="cfg-section-title">{title}</h2>
      {desc && <p className="cfg-section-desc">{desc}</p>}
      {warning && <span className="cfg-warning">{warning}</span>}
    </div>
  );
}

// Painel de configuração: labels à esquerda, conteúdo à direita
function SettingRow({ label, hint, warning, children }: { label: string; hint?: string; warning?:string; children: React.ReactNode }) {
  return (
    <div className="cfg-row">
      <div className="cfg-row-label">
        <span className="cfg-row-name">{label}</span>
        {hint && <span className="cfg-row-hint">{hint}</span>}
        {warning && <span className="cfg-warning">{warning}</span>}
      </div>
      <div className="cfg-row-control">{children}</div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div className={`toggle ${on ? "on" : ""}`} onClick={onToggle} style={{ cursor: "pointer" }}>
      <div className="toggle-knob" />
    </div>
  );
}

// ─── Aba: Configurações de Usuário ──────────────────────────────────────────

function UserSettings() {
  const { theme, accent, toggleTheme, setAccent } = useTheme();
  const [displayName, setDisplayName]   = useState("John Doe");
  const [editingName, setEditingName]   = useState(false);
  const [sounds, setSounds]             = useState(true);
  const [savedBadge, setSavedBadge]     = useState(false);

  function saveName() {
    setEditingName(false);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }

  return (
    <div className="cfg-content">

      {/* ── Perfil ── */}
      <SectionHeader title="Perfil" desc="Suas informações pessoais dentro do Ditoo." />
      <div className="cfg-card">
        <SettingRow label="Nome de exibição" hint="Como o Ditoo se refere a você">
          {editingName ? (
            <div className="cfg-input-row">
              <input className="cfg-input" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                autoFocus />
              <button className="cfg-btn-primary" onClick={saveName}>Salvar</button>
              <button className="cfg-btn-ghost" onClick={() => setEditingName(false)}>Cancelar</button>
            </div>
          ) : (
            <div className="cfg-input-row">
              <span className="cfg-value-text">{displayName}</span>
              <button className="cfg-btn-ghost" onClick={() => setEditingName(true)}>
                <Icons.Edit /> Editar
              </button>
              {savedBadge && <span className="cfg-saved-badge"><Icons.Check /> Salvo</span>}
            </div>
          )}
        </SettingRow>
      </div>

      {/* ── Aparência ── */}
      <SectionHeader title="Aparência" desc="Deixe o visual do Ditoo mais a sua cara." />
      <div className="cfg-card">
        <SettingRow label="Tema" hint="Cor principal">
          <div className="cfg-theme-toggle">
            <button className={`cfg-theme-opt ${theme === "light" ? "active" : ""}`}
              onClick={() => theme === "dark" && toggleTheme()}>
              <Icons.Sun /> Claro
            </button>
            <button className={`cfg-theme-opt ${theme === "dark" ? "active" : ""}`}
              onClick={() => theme === "light" && toggleTheme()}>
              <Icons.Moon /> Escuro
            </button>
          </div>
        </SettingRow>
        <div className="cfg-divider" />
        <SettingRow label="Cor de destaque" hint="Botões, links e elementos ativos">
          <div className="cfg-accents">
            {(Object.entries(ACCENT_COLORS) as [AccentColor, { hex: string; label: string }][]).map(
              ([key, { hex, label }]) => (
                <button key={key} className={`cfg-accent-dot ${accent === key ? "active" : ""}`}
                  style={{ background: hex }} title={label} onClick={() => setAccent(key)}>
                  {accent === key && <Icons.Check />}
                </button>
              )
            )}
          </div>
        </SettingRow>
      </div>

      {/* ── Preferências ── */}
      <SectionHeader title="Preferências" />
      <div className="cfg-card">
        <SettingRow label="Sons de interface" hint="Silencie ou ative os sons da interface">
          <Toggle on={sounds} onToggle={() => setSounds(v => !v)} />
        </SettingRow>
      </div>

      {/* ── Segurança ── */}
      <SectionHeader title="Segurança" desc="Altere sua senha de acesso." />
      <div className="cfg-card">
        <SettingRow label="Nova senha" hint="Mínimo 8 caracteres">
          <input type="password" className="cfg-input" placeholder="••••••••" />
        </SettingRow>
        <div className="cfg-divider" />
        <SettingRow label="Confirmar nova senha">
          <input type="password" className="cfg-input" placeholder="••••••••" />
        </SettingRow>
        <div className="cfg-row-action">
          <button className="cfg-btn-primary"><Icons.Lock /> Alterar senha</button>
        </div>
      </div>

    </div>
  );
}

// ─── Aba: Configurações de Sistema ──────────────────────────────────────────

function SystemSettings() {
  const [model, setModel]           = useState("deepseek-r1:8b");
  const [parallelReqs, setParallel] = useState(3);
  const [folders, setFolders]       = useState(CONST_FOLDERS);
  const [users, setUsers]           = useState(CONST_USERS);
  const [newUser, setNewUser]       = useState({ name: "", email: "", password: "", role: "user" });

  function removeFolder(id: number) { setFolders(f => f.filter(x => x.id !== id)); }
  function removeUser(id: number)   { setUsers(u => u.filter(x => x.id !== id));   }

  function createUser() {
    if (!newUser.name || !newUser.email) return;
    setUsers(prev => [...prev, { id: Date.now(), name: newUser.name, email: newUser.email, role: newUser.role as "admin" | "user" }]);
    setNewUser({ name: "", email: "", password: "", role: "user" });
  }

  return (
    <div className="cfg-content">

      {/* ── Modelo de Linguagem ── */}
      <SectionHeader title="Modelo de Linguagem"
        desc="Selecione o LLM que será usado pelo Ditoo. A mudança é aplicada imediatamente para novas conversas." />
      <div className="cfg-card">
        <div className="cfg-model-list">
          {MODELS.map(m => (
            <div key={m.value} className={`cfg-model-option ${model === m.value ? "active" : ""}`}
              onClick={() => setModel(m.value)}>
              <div className="cfg-model-radio">
                {model === m.value && <div className="cfg-model-radio-dot" />}
              </div>
              <div className="cfg-model-info">
                <span className="cfg-model-name">{m.label}</span>
                <span className="cfg-model-tag">{m.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Performance ── */}
      <SectionHeader title="Performance"
        desc="Configure o comportamento do servidor de inferência." />
      <div className="cfg-card">
        <SettingRow label="Paralelismo de requisições"
          hint="Defina o máximo de requisições  (1 - 10) a serem processadas simultaneamente." warning="Atenção: Valores altos aumentam a carga no hardware.">
          <div className="cfg-number-control">
            <button className="cfg-number-btn" onClick={() => setParallel(v => Math.max(1, v - 1))}
              disabled={parallelReqs <= 1}>−</button>
            <span className="cfg-number-value">{parallelReqs}</span>
            <button className="cfg-number-btn" onClick={() => setParallel(v => Math.min(10, v + 1))}
              disabled={parallelReqs >= 10}>+</button>
          </div>
        </SettingRow>
      </div>

      {/* ── Pastas ── */}
      <SectionHeader title="Pastas de Documentos"
        desc="Gerencie onde o Ditoo busca e indexa seus arquivos." />
      <div className="cfg-card">
        {folders.length === 0
          ? <p className="cfg-empty-msg">Nenhuma pasta configurada.</p>
          : (
            <div className="cfg-folder-list">
              {folders.map(f => (
                <div key={f.id} className="cfg-folder-item">
                  <div className="cfg-folder-icon"><Icons.Folder /></div>
                  <div className="cfg-folder-info">
                    <span className="cfg-folder-name">{f.name}</span>
                    <span className="cfg-folder-path font-mono">{f.path}</span>
                  </div>
                  <span className={`cfg-folder-badge ${f.type === "secret" ? "secret" : ""}`}>
                    {f.type === "secret" ? "Secreta" : "Normal"}
                  </span>
                  <div className="cfg-folder-actions">
                    <button className="cfg-icon-btn" title="Editar"><Icons.Edit /></button>
                    <button className="cfg-icon-btn danger" title="Remover" onClick={() => removeFolder(f.id)}>
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        <div className="cfg-divider" />
        
        <button className="cfg-btn-outline" style={{ margin: 14 }}><Icons.Plus /> Adicionar pasta</button>
      </div>

      {/* ── Usuários ── */}
      <SectionHeader title="Gerenciar Usuários"
        desc="Visualize, edite e remova usuários." warning="Apenas administradores acessam esta seção."/>
      <div className="cfg-card">
        <div className="cfg-user-list">
          {users.map(u => (
            <div key={u.id} className="cfg-user-item">
              <div className="avatar cfg-user-avatar">
                {u.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
              </div>
              <div className="cfg-user-info">
                <span className="cfg-user-name">{u.name}</span>
                <span className="cfg-user-email font-mono">{u.email}</span>
              </div>
              <span className={`cfg-user-badge ${u.role === "admin" ? "admin" : ""}`}>
                {u.role === "admin" ? "Admin" : "Usuário"}
              </span>
              <div className="cfg-user-actions">
                <button className="cfg-icon-btn" title="Redefinir senha"><Icons.Key /></button>
                <button className="cfg-icon-btn" title="Editar"><Icons.Edit /></button>
                <button className="cfg-icon-btn danger" title="Excluir" onClick={() => removeUser(u.id)}>
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Criar usuário ── */}
      <div className="cfg-card">
        <p className="section-label" style={{ margin: 14 }}>Novo usuário</p>
        <div className="cfg-create-user-grid">
          <input className="cfg-input" placeholder="Nome completo"
            value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} />
          <input className="cfg-input" placeholder="E-mail" type="email"
            value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} />
          <input className="cfg-input" placeholder="Senha temporária" type="password"
            value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} />
          <select className="cfg-select" value={newUser.role}
            onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}>
            <option value="user">Usuário Comum</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div className="cfg-row-action">
          <button className="cfg-btn-primary" onClick={createUser}><Icons.Plus /> Criar usuário</button>
        </div>
      </div>

    </div>
  );
}

type Tab = "user" | "system";

export default function Config() {
  const [tab, setTab] = useState<Tab>("user");
  const isAdmin = true; // Simulação de permissão de admin, vou substituir por lógica real

  return (
    <div className="cfg-shell">

      {/* ── Navegação lateral ── */}
      <nav className="cfg-nav">
        <p className="section-label" style={{ padding: "0 8px", marginBottom: 10 }}>
          Configurações
        </p>

        <button className={`cfg-nav-item ${tab === "user" ? "active" : ""}`}
          onClick={() => setTab("user")}>
          <Icons.User /> Usuário
        </button>

        <button className={`cfg-nav-item ${tab === "system" ? "active" : ""} ${!isAdmin ? "disabled" : ""}`}
          onClick={() => isAdmin && setTab("system")} disabled={!isAdmin}>
          <Icons.Shield /> Sistema
          {isAdmin && <span className="cfg-nav-lock"></span>}
        </button>
      </nav>

      <div className="cfg-body">
        {tab === "user"   && <UserSettings />}
        {tab === "system" && <SystemSettings />}
      </div>

    </div>
  );
}
