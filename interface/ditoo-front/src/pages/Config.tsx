// Config.tsx — Página de Configurações do Ditoo
import { useEffect, useState } from "react";
import {
  useTheme,
  ACCENT_COLORS,
  type AccentColor,
} from "../context/ThemeContext";
import "../assets/configPage.css";
import { api } from "../services/api";

type AppUser = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
};

// ─── Icons ─────────────────────────

const Icons = {
  Memory: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  ),
  User: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M12 3l8 4v5c0 5-3.5 9-8 10C7.5 21 4 17 4 12V7l8-4z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Key: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h8M18 10v4" strokeLinecap="round" />
    </svg>
  ),
  Folder: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Check: () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <polyline
        points="20 6 9 17 4 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" />
    </svg>
  ),
  Edit: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
        strokeLinecap="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Lock: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  ),
  Sun: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
};

// ─── Constantes (mockups) ────

const CONST_USERS = [
  { id: 1, name: "John Doe", email: "john.doe@empresa.com", role: "admin" },
];

const MODELS = [
  { value: "qwen2.5:7b", label: "Qwen 2.5 7B", tag: "Recomendado" },
  { value: "deepseek-r1:8b", label: "DeepSeek R1 8B", tag: "Preciso" },
  { value: "llama3.2:3b", label: "Llama 3.2 3B", tag: "Rápido" },
  { value: "qwen2.5:1.5b", label: "Qwen 2.5 1.5B", tag: "Muito Leve" },
];

// Cabeçalho
function SectionHeader({
  title,
  desc,
  warning,
}: {
  title: string;
  desc?: string;
  warning?: string;
}) {
  return (
    <div className="cfg-section-header">
      <h2 className="cfg-section-title">{title}</h2>
      {desc && <p className="cfg-section-desc">{desc}</p>}
      {warning && <span className="cfg-warning">{warning}</span>}
    </div>
  );
}

// Painel de configuração: labels à esquerda, conteúdo à direita
function SettingRow({
  label,
  hint,
  warning,
  children,
}: {
  label: string;
  hint?: string;
  warning?: string;
  children: React.ReactNode;
}) {
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
    <div
      className={`toggle ${on ? "on" : ""}`}
      onClick={onToggle}
      style={{ cursor: "pointer" }}
    >
      <div className="toggle-knob" />
    </div>
  );
}

// ─── Aba: Configurações de Usuário ──────────────────────────────────────────

function UserSettings() {
  const { theme, accent, toggleTheme, setAccent } = useTheme();
  const [displayName, setDisplayName] = useState("John Doe");
  const [editingName, setEditingName] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [savedBadge, setSavedBadge] = useState(false);

  function saveName() {
    setEditingName(false);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  }

  return (
    <div className="cfg-content">
      {/* ── Perfil ── */}
      <SectionHeader
        title="Perfil"
        desc="Suas informações pessoais dentro do Ditoo."
      />
      <div className="cfg-card">
        <SettingRow
          label="Nome de exibição"
          hint="Como o Ditoo se refere a você"
        >
          {editingName ? (
            <div className="cfg-input-row">
              <input
                className="cfg-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                autoFocus
              />
              <button className="cfg-btn-primary" onClick={saveName}>
                Salvar
              </button>
              <button
                className="cfg-btn-ghost"
                onClick={() => setEditingName(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="cfg-input-row">
              <span className="cfg-value-text">{displayName}</span>
              <button
                className="cfg-btn-ghost"
                onClick={() => setEditingName(true)}
              >
                <Icons.Edit /> Editar
              </button>
              {savedBadge && (
                <span className="cfg-saved-badge">
                  <Icons.Check /> Salvo
                </span>
              )}
            </div>
          )}
        </SettingRow>
      </div>

      {/* ── Aparência ── */}
      <SectionHeader
        title="Aparência"
        desc="Deixe o visual do Ditoo mais a sua cara."
      />
      <div className="cfg-card">
        <SettingRow label="Tema" hint="Cor principal">
          <div className="cfg-theme-toggle">
            <button
              className={`cfg-theme-opt ${theme === "light" ? "active" : ""}`}
              onClick={() => theme === "dark" && toggleTheme()}
            >
              <Icons.Sun /> Claro
            </button>
            <button
              className={`cfg-theme-opt ${theme === "dark" ? "active" : ""}`}
              onClick={() => theme === "light" && toggleTheme()}
            >
              <Icons.Moon /> Escuro
            </button>
          </div>
        </SettingRow>
        <div className="cfg-divider" />
        <SettingRow
          label="Cor de destaque"
          hint="Botões, links e elementos ativos"
        >
          <div className="cfg-accents">
            {(
              Object.entries(ACCENT_COLORS) as [
                AccentColor,
                { hex: string; label: string },
              ][]
            ).map(([key, { hex, label }]) => (
              <button
                key={key}
                className={`cfg-accent-dot ${accent === key ? "active" : ""}`}
                style={{ background: hex }}
                title={label}
                onClick={() => setAccent(key)}
              >
                {accent === key && <Icons.Check />}
              </button>
            ))}
          </div>
        </SettingRow>
      </div>

      {/* ── Preferências ── */}
      <SectionHeader title="Preferências" />
      <div className="cfg-card">
        <SettingRow
          label="Sons de interface"
          hint="Silencie ou ative os sons da interface"
        >
          <Toggle on={sounds} onToggle={() => setSounds((v) => !v)} />
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
          <button className="cfg-btn-primary">
            <Icons.Lock /> Alterar senha
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Aba: Configurações de Sistema ──────────────────────────────────────────

function SystemSettings() {
  const [model, setModel] = useState("qwen2.5:7b");
  const [parallelReqs, setParallel] = useState(3);
  const [, setUsers] = useState(CONST_USERS);
  const [dataUsers, setDataUsers] = useState<AppUser[]>();
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  
  function removeUser(id: number) {
    setUsers((u) => u.filter((x) => x.id !== id));
  }

  function createUser() {
    if (!newUser.name || !newUser.email) return;
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as "admin" | "user",
      },
    ]);
    setNewUser({ name: "", email: "", password: "", role: "user" });

    api.register(newUser.name, newUser.email, newUser.password, newUser.role);
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await api.getUsers();
      console.log(users);
      setDataUsers(users);
    };
    fetchUsers();
  }, []);

  return (
    <>
      {api.getToken()?.role === "admin" ? (
        <div className="cfg-content">
          {/* ── Modelo de Linguagem ── */}
          <SectionHeader
            title="Modelo de Linguagem"
            desc="Selecione o LLM que será usado pelo Ditoo. A mudança é aplicada imediatamente para novas conversas."
          />
          <div className="cfg-card">
            <div className="cfg-model-list">
              {MODELS.map((m) => (
                <div
                  key={m.value}
                  className={`cfg-model-option ${model === m.value ? "active" : ""}`}
                  onClick={() => setModel(m.value)}
                >
                  <div className="cfg-model-radio">
                    {model === m.value && (
                      <div className="cfg-model-radio-dot" />
                    )}
                  </div>
                  <div className="cfg-model-info">
                    <span className="cfg-model-name">{m.label}</span>
                    <span className="cfg-model-tag">{m.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              console.log("Model changed:", model);
              api.changeModel(model);
            }}
            style={{ width: 115 }}
            className="cfg-btn-primary"
          >
            Aplicar modelo
          </button>
          {/* ── Performance ── */}
          <SectionHeader
            title="Performance"
            desc="Configure o comportamento do servidor de inferência."
          />
          <div className="cfg-card">
            <SettingRow
              label="Paralelismo de requisições"
              hint="Defina o máximo de requisições  (1 - 10) a serem processadas simultaneamente."
              warning="Atenção: Valores altos aumentam a carga no hardware."
            >
              <div className="cfg-number-control">
                <button
                  className="cfg-number-btn"
                  onClick={() => setParallel((v) => Math.max(1, v - 1))}
                  disabled={parallelReqs <= 1}
                >
                  −
                </button>
                <span className="cfg-number-value">{parallelReqs}</span>
                <button
                  className="cfg-number-btn"
                  onClick={() => setParallel((v) => Math.min(10, v + 1))}
                  disabled={parallelReqs >= 10}
                >
                  +
                </button>
              </div>
            </SettingRow>
          </div>

         
          {/* ── Usuários ── */}
          <SectionHeader
            title="Gerenciar Usuários"
            desc="Visualize, edite e remova usuários."
            warning="Apenas administradores acessam esta seção."
          />
          <div className="cfg-card">
            <div className="cfg-user-list">
              {dataUsers?.map((u) => (
                <div key={u.id} className="cfg-user-item">
                  <div className="avatar cfg-user-avatar">
                    {u.username
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="cfg-user-info">
                    <span className="cfg-user-name">{u.username}</span>
                    <span className="cfg-user-email font-mono">{u.email}</span>
                  </div>
                  <span
                    className={`cfg-user-badge ${u.role === "admin" ? "admin" : ""}`}
                  >
                    {u.role === "admin" ? "Admin" : "Usuário"}
                  </span>
                  <div className="cfg-user-actions">
                    <button className="cfg-icon-btn" title="Redefinir senha">
                      <Icons.Key />
                    </button>
                    <button className="cfg-icon-btn" title="Editar">
                      <Icons.Edit />
                    </button>
                    <button
                      className="cfg-icon-btn danger"
                      title="Excluir"
                      onClick={() => removeUser(u.id)}
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Criar usuário ── */}
          <div className="cfg-card">
            <p className="section-label" style={{ margin: 14 }}>
              Novo usuário
            </p>
            <div className="cfg-create-user-grid">
              <input
                className="cfg-input"
                placeholder="Nome completo"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, name: e.target.value }))
                }
              />
              <input
                className="cfg-input"
                placeholder="E-mail"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, email: e.target.value }))
                }
              />
              <input
                className="cfg-input"
                placeholder="Senha temporária"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, password: e.target.value }))
                }
              />
              <select
                className="cfg-select"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, role: e.target.value }))
                }
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="cfg-row-action">
              <button className="cfg-btn-primary" onClick={createUser}>
                <Icons.Plus /> Criar usuário
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert-admin-need">
          Este campo é reservado para o Administrador
        </div>
      )}
    </>
  );
}

function MemorySettings() {
  const [maxHistory, setMaxHistory] = useState(15);
  const [memories, setMemories] = useState<
    { memory_key: string; memory_value: string; category: string }[]
  >([]);
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [savedBadge, setSavedBadge] = useState(false);

 useEffect(() => {
  async function loadData() {
    try {
      const [mems] = await Promise.all([
        
        api.getUserMemories(),
      ]);
      
      setMemories(mems);
    } catch (err) {
      console.error("Erro ao carregar dados de memória:", err);
    } finally {
      setLoadingMemories(false);
    }
  }
  loadData();
}, []);



  async function saveMaxHistory(value: number) {
    setMaxHistory(value);
    try {
      await api.updateConfig({ maxHistoryMessages: value });
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
    } catch (err) {
      console.error("Erro ao salvar configuração:", err);
    }
  }

  async function removeMemory(id: string) {
    setMemories((prev) => prev.filter((m) => m.memory_key !== id));
    try {
      await api.deleteMemory(id);
    } catch (err) {
      console.error("Erro ao remover memória:", err);
    }
  }

  return (
    <div className="cfg-content">
      {/* ── Histórico de conversas ── */}
      <SectionHeader
        title="Histórico de conversas"
        desc="Quantas mensagens recentes o Ditoo considera ao responder dentro de uma conversa."
      />
      <div className="cfg-card">
        <SettingRow
          label="Mensagens de contexto"
          hint="Quanto maior, mais o Ditoo lembra da conversa atual — mas aumenta o custo de cada resposta."
        >
          <div className="cfg-number-control">
            <button
              className="cfg-number-btn"
              onClick={() => saveMaxHistory(Math.max(5, maxHistory - 5))}
              disabled={maxHistory <= 5}
            >
              −
            </button>
            <span className="cfg-number-value">{maxHistory}</span>
            <button
              className="cfg-number-btn"
              onClick={() => saveMaxHistory(Math.min(100, maxHistory + 5))}
              disabled={maxHistory >= 100}
            >
              +
            </button>
          </div>
        </SettingRow>
        {savedBadge && (
          <span className="cfg-saved-badge" style={{ margin: "0 14px 12px" }}>
            <Icons.Check /> Salvo
          </span>
        )}
      </div>

      {/* ── Memórias permanentes ── */}
      <SectionHeader
        title="O que o Ditoo lembra de você"
        desc="Fatos que você pediu para o Ditoo guardar permanentemente. Eles valem em qualquer conversa, mesmo além do limite de mensagens acima."
      />
      <div className="cfg-card">
        {loadingMemories ? (
          <p className="cfg-empty-msg">Carregando memórias...</p>
        ) : memories.length === 0 ? (
          <p className="cfg-empty-msg">
            Nenhuma memória permanente ainda. Peça ao Ditoo para "lembrar de
            algo" durante uma conversa.
          </p>
        ) : (
          <div className="cfg-memory-list">
            {memories.map((m) => (
              <div key={m.memory_key} className="cfg-memory-item">
                <div className="cfg-memory-icon">
                  <Icons.Memory />
                </div>
                <div className="cfg-memory-info">
                  <span className="cfg-memory-content">{m.memory_value}</span>
                  <span className="cfg-memory-category font-mono">
                    {m.category}
                  </span>
                </div>
                <button
                  className="cfg-icon-btn danger"
                  title="Esquecer"
                  onClick={() => removeMemory(m.memory_key)}
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type Folder = {
  id: string;
  name: string;
  parent_id: string | null;
  isPublic: boolean
  path: string;
};

// ─── Gerenciamento de acesso por pasta (FolderAccess) ───────────────────────

type FolderAccessEntry = {
  userId: string;
  username: string | null;
  accessLevel: string;
};

type AppUserLite = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
};

function FolderAccessPanel({ folder }: { folder: Folder }) {
  const [users, setUsers] = useState<AppUserLite[]>([]);
  const [accessList, setAccessList] = useState<FolderAccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("read");
  const [granting, setGranting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [allUsers] = await Promise.all([
        api.getUsers(),
        
      ]);
      setUsers(allUsers);

    } catch (err) {
      console.error("Erro ao carregar acessos da pasta:", err);
      setError("Não foi possível carregar os acessos desta pasta.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder.id]);

  // Usuários que ainda não têm acesso concedido a esta pasta
  const availableUsers = users.filter(
    (u) => !accessList.some((a) => a.userId === u.id)
  );

  async function handleGrant() {
    if (!selectedUserId) return;
    setGranting(true);
    setError(null);
    try {
      await api.grantFolderAccess(folder.id, selectedUserId, selectedLevel);
      setSelectedUserId("");
      setSelectedLevel("read");
      await loadData();
    } catch (err) {
      console.error("Erro ao conceder acesso:", err);
      setError("Não foi possível conceder o acesso.");
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(userId: string) {
    setRevokingId(userId);
    setError(null);
    try {
      
      setAccessList((prev) => prev.filter((a) => a.userId !== userId));
    } catch (err) {
      console.error("Erro ao revogar acesso:", err);
      setError("Não foi possível revogar o acesso.");
    } finally {
      setRevokingId(null);
    }
  }

  if (loading) {
    return <p className="cfg-empty-msg">Carregando permissões...</p>;
  }

  return (
    <div className="cfg-folder-access-panel">
      {error && <span className="cfg-warning">{error}</span>}

      {accessList.length === 0 ? (
        <p className="cfg-empty-msg">
          Nenhum usuário com acesso concedido a esta pasta ainda.
        </p>
      ) : (
        <div className="cfg-user-list">
          {accessList.map((a) => (
            <div key={a.userId} className="cfg-user-item">
              <div className="avatar cfg-user-avatar">
                {(a.username ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="cfg-user-info">
                <span className="cfg-user-name">
                  {a.username ?? "Usuário removido"}
                </span>
                <span className="cfg-user-email font-mono">
                  {a.accessLevel}
                </span>
              </div>
              <div className="cfg-user-actions">
                <button
                  className="cfg-icon-btn danger"
                  title="Revogar acesso"
                  onClick={() => handleRevoke(a.userId)}
                  disabled={revokingId === a.userId}
                >
                  <Icons.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cfg-divider" />

      <div className="cfg-create-user-grid">
        <select
          className="cfg-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Selecione um usuário</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.username} ({u.email})
            </option>
          ))}
        </select>
        <select
          className="cfg-select"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="read">Leitura</option>
          <option value="write">Leitura / Escrita</option>
        </select>
      </div>
      <div className="cfg-row-action">
        <button
          className="cfg-btn-primary"
          onClick={handleGrant}
          disabled={!selectedUserId || granting}
        >
          <Icons.Plus /> {granting ? "Concedendo..." : "Conceder acesso"}
        </button>
      </div>
    </div>
  );
}

function FoldersSettings() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(
    null
  );
  const [newFolder, setNewFolder] = useState({
    name: "",
    parentId: "",
    isPublic: "",
  });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFolders() {
      try {
        const data = await api.getFolders();
        setFolders(data);
      } catch (err) {
        console.error("Erro ao carregar pastas:", err);
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, []);

  async function createFolder() {
    if (!newFolder.name.trim()) return;
    setCreating(true);
    try {
      const created = await api.createFolder(
        newFolder.name,
        newFolder.parentId,
        newFolder.isPublic || ""
      );
      setFolders((prev) => [...prev, created]);
      setNewFolder({ name: "", parentId: "", isPublic: "" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Erro ao criar pasta:", err);
    } finally {
      setCreating(false);
    }
  }

  async function removeFolder(id: string) {
    setDeletingId(id);
    try {
      await api.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      if (expandedFolderId === id) setExpandedFolderId(null);
    } catch (err) {
      console.error("Erro ao remover pasta:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="cfg-content">
      <SectionHeader
        title="Pastas de Documentos"
        desc="Gerencie onde o Ditoo busca e indexa seus arquivos."
      />

      <div className="cfg-card">
        {loadingFolders ? (
          <p className="cfg-empty-msg">Carregando pastas...</p>
        ) : folders.length === 0 ? (
          <p className="cfg-empty-msg">Nenhuma pasta configurada.</p>
        ) : (
          <div className="cfg-folder-list">
            {folders.map((f) => (
              <div key={f.id}>
                <div className="cfg-folder-item">
                  <div className="cfg-folder-icon">
                    <Icons.Folder />
                  </div>
                  <div className="cfg-folder-info">
                    <span className="cfg-folder-name">{f.name}</span>
                    <span className="cfg-folder-path font-mono">
                      {f.path}
                    </span>
                  </div>
                  <span
                    className={`cfg-folder-badge ${f.isPublic === false ? "secret" : ""}`}
                  >
                    {f.isPublic === false ? "Secreta" : "Pública"}
                  </span>
                  <div className="cfg-folder-actions">
                    {f.isPublic === false && (
                      <button
                        className="cfg-icon-btn"
                        title="Gerenciar permissões"
                        onClick={() =>
                          setExpandedFolderId((prev) =>
                            prev === f.id ? null : f.id
                          )
                        }
                      >
                        <Icons.Key />
                      </button>
                    )}
                    <button className="cfg-icon-btn" title="Editar">
                      <Icons.Edit />
                    </button>
                    <button
                      className="cfg-icon-btn danger"
                      title="Remover"
                      onClick={() => removeFolder(f.id)}
                      disabled={deletingId === f.id}
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>

                {f.isPublic === false && expandedFolderId === f.id && (
                  <FolderAccessPanel folder={f} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="cfg-divider" />

        {/* ── Formulário de nova pasta ── */}
        {showAddForm ? (
          <>
            <div className="cfg-create-user-grid">
              <input
                className="cfg-input"
                placeholder="Nome da pasta"
                value={newFolder.name}
                onChange={(e) =>
                  setNewFolder((f) => ({ ...f, name: e.target.value }))
                }
              />
              <select
                className="cfg-select"
                value={newFolder.parentId}
                onChange={(e) =>
                  setNewFolder((f) => ({ ...f, parentId: e.target.value }))
                }
              >
                <option value="">Pasta raiz (sem pai)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <select
                className="cfg-select"
                value={String(newFolder.isPublic)}
                onChange={(e) =>{console.log({ isPublic: e.target.value })
                  setNewFolder((f) => ({ ...f, isPublic: e.target.value }))
                }}
              >
                <option value="true">Pública</option>
                <option value="false">Secreta</option>
              </select>
            </div>
            <div className="cfg-row-action">
              <button
                className="cfg-btn-ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewFolder({ name: "", parentId: "", isPublic: "" });
                }}
              >
                Cancelar
              </button>
              <button
                className="cfg-btn-primary"
                onClick={createFolder}
                disabled={creating}
              >
                <Icons.Plus /> {creating ? "Salvando..." : "Salvar pasta"}
              </button>
            </div>
          </>
        ) : (
          <button
            className="cfg-btn-outline"
            style={{ margin: 14 }}
            onClick={() => setShowAddForm(true)}
          >
            <Icons.Plus /> Adicionar pasta
          </button>
        )}
      </div>
    </div>
  );
}



type Tab = "user" | "system" | "memory" | "folders";

export default function Config() {
  const [tab, setTab] = useState<Tab>("user");
  const [showApplyButton, setShowApplyButton] = useState(false);
  useEffect(() => {setShowApplyButton(true)});

  return (
    <div className="cfg-shell">
      {/* ── Navegação lateral ── */}
      <nav className="cfg-nav">
        <p
          className="section-label"
          style={{ padding: "0 8px", marginBottom: 10 }}
        >
          Configurações
        </p>

        <button
          className={`cfg-nav-item ${tab === "user" ? "active" : ""}`}
          onClick={() => setTab("user")}
        >
          <Icons.User /> Usuário
        </button>

        <button
          className={`cfg-nav-item ${tab === "system" ? "active" : ""} ${api.getToken()?.role !== "admin" ? "disabled" : ""}`}
          onClick={() => api.getToken()?.role === "admin" && setTab("system")}
          disabled={api.getToken()?.role !== "admin"}
        >
          <Icons.Shield /> Sistema
          {api.getToken()?.role === "admin" && (
            <span className="cfg-nav-lock"></span>
          )}
        </button>
        <button
          className={`cfg-nav-item ${tab === "memory" ? "active" : ""} ${api.getToken()?.role !== "admin" ? "disabled" : ""}`}
          onClick={() => api.getToken()?.role === "admin" && setTab("memory")}
          disabled={api.getToken()?.role !== "admin"}
        >
          <Icons.Memory /> Memória
          {api.getToken()?.role === "admin" && (
            <span className="cfg-nav-lock"></span>
          )}
        </button>
        <button
          className={`cfg-nav-item ${tab === "folders" ? "active" : ""}`}
          onClick={() => setTab("folders")}
          
        >
          <Icons.Folder /> Pastas
            <span className="cfg-nav-lock"></span>
        </button>
      </nav>

      <div className="cfg-body">
        {tab === "user" && <UserSettings />}
        {tab === "system" && <SystemSettings />}
        {tab === "memory" && <MemorySettings />}
        {tab === "folders" && <FoldersSettings />}
      </div>
       {showApplyButton && (
        <button
          onClick={() => {
            setShowApplyButton(false);
            console.log("Alterações aplicadas!");
          }}
          style={{ width: 132, position: "relative", top: 500, right: 665, marginLeft: "-132px", height: 40 }}
          className="cfg-btn-primary"
        >
          Aplicar alterações
        </button>
      )}
    </div>
  );
}