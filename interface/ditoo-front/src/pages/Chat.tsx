import { useEffect, useRef, useState } from "react";
import DitooLogo from "../components/DitooLogo";
import { useTheme, ACCENT_COLORS, type AccentColor } from "../context/ThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Source {
  name: string;
  path: string;
  percent: number;
}

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  sources?: Source[];
}

interface HistoryItem {
  id: number;
  label: string;
  messages: Message[];
}

// ─── Constantes ────────────────────────────────────────────────────────────────

// sugestões de prompts
const SUGGESTED_PROMPTS = [
  "Qual é a política de férias da empresa?",
  "Resumir o relatório financeiro do Q3",
  "Procedimentos de onboarding",
  "Documentos sobre LGPD",
];

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Menu: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Chat: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Folder: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Sun: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Settings: () => (
    <svg width="13" height="13" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
  User: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  Logout: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Send: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  FileSource: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

// indicador de digitação da ia
function TypingIndicator() {
  return (
    <div className="msg-wrap ai">
      <div className="msg-sender">Ditoo</div>
      <div className="bubble ai typing-wrap">
        <div className="typing-dots">
          <span className="tdot" />
          <span className="tdot" />
          <span className="tdot" />
        </div>
      </div>
    </div>
  );
}
// componente para exibir as fontes citadas em uma resposta, com animação de preenchimento da barra de relevância
function SourceCard({ source, index }: { source: Source; index: number }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fillRef.current) fillRef.current.style.width = `${source.percent}%`;
    }, 100 + index * 150);
    return () => clearTimeout(timer);
  }, [source.percent, index]);

  return (
    <div className="source-card">
      <div className="source-name" title={source.name}>{source.name}</div>
      <div className="source-path" title={source.path}>{source.path}</div>
      <div className="relev-row">
        <span>relevância</span>
        <span className="relev-pct">{source.percent}%</span>
      </div>
      <div className="relev-bar">
        <div className="relev-fill" ref={fillRef} style={{ width: "0%" }} />
      </div>
    </div>
  );
}

// painel de aparência
function AppearancePanel({ onClose }: { onClose: () => void }) {
  const { theme, toggleTheme, accent, setAccent } = useTheme();
  return (
    <div className="appear-panel" onClick={(e) => e.stopPropagation()}>
      <div className="appear-row">
        <span>Modo claro</span>
        <div
          className={`toggle ${theme === "light" ? "on" : ""}`}
          onClick={toggleTheme}
          role="switch"
          aria-checked={theme === "light"}
        >
          <div className="toggle-knob" />
        </div>
      </div>
      <div className="appear-row column">
        <span>Cor de destaque</span>
        <div className="accents">
          {(Object.entries(ACCENT_COLORS) as [AccentColor, { hex: string }][]).map(([key, val]) => (
            <div
              key={key}
              className={`accent-dot ${accent === key ? "active" : ""}`}
              style={{ background: val.hex }}
              onClick={() => { setAccent(key); onClose(); }}
              title={key}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// histórico de conversas, agrupado por tópico/pergunta
function HistoryEntry({
  item,
  isActive,
  onClick,
}: {
  item: HistoryItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const userMessages = item.messages.filter((m) => m.sender === "user");

  return (
    <div className="history-group">
      <div
        className={`history-item ${isActive ? "active" : ""}`}
        onClick={onClick}
      >
        {/* Botão de expandir — só aparece se houver mais de 1 pergunta */}
        {userMessages.length > 1 && (
          <span
            className={`history-chevron ${expanded ? "open" : ""}`}
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            <Icon.ChevronRight />
          </span>
        )}
        <Icon.Chat />
        <span className="history-label">{item.label}</span>
      </div>

      {/* Perguntas expandidas */}
      {expanded && userMessages.length > 1 && (
        <div className="history-messages">
          {userMessages.map((m) => (
            <div key={m.id} className="history-message-item">
              {m.text.length > 40 ? m.text.slice(0, 40) + "…" : m.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Chat() {
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport);
  const [rightOpen, setRightOpen] = useState(() => !isMobileViewport);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppear, setShowAppear] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);

  // histórico de conversas
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);

  // impede que a bolha da IA seja criada antes de chegar o primeiro texto, evitando bolhas vazias
  const [aiMsgId, setAiMsgId] = useState<number | null>(null);

  // referência para rolar a conversa para o final quando chegar mensagem nova
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ─── enviar mensagem ──────────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), sender: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setAiMsgId(null);

    // envia para o histórico
    const newId = Date.now();
    const newEntry: HistoryItem = {
      id: newId,
      label: text.slice(0, 30) + (text.length > 30 ? "…" : ""),
      messages: updatedMessages,
    };
    setHistory((prev) => [newEntry, ...prev]);
    setActiveHistoryId(newId);

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: text }),
      });

      if (!response.body) throw new Error("Sem corpo na resposta");

      const newAiId = Date.now() + 1;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastSources: Source[] = [];
      let firstContent = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "content") {
              if (firstContent) {
                firstContent = false;
                setAiMsgId(newAiId);
                setMessages((prev) => [...prev, { id: newAiId, sender: "ai", text: data.text ?? "" }]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === newAiId
                      ? { ...m, text: m.text + (data.text ?? "") }
                      : m
                  )
                );
              }
              if (data.winner && data.percent != null) {
                lastSources = [{ name: data.winner, path: `Ditoo/documentos/`, percent: data.percent }];
              }
            }

            if (data.type === "id" && data.fontes) {
              lastSources = [{ name: data.fontes, path: `Ditoo/documentos/`, percent: data.percent ?? 0 }];
            }
          } catch {
            // linha não é JSON válido, ignorar
          }
        }
      }

      // atualiza fontes 
      setMessages((prev) =>
        prev.map((m) => (m.id === newAiId ? { ...m, sources: lastSources } : m))
      );
      setActiveSources(lastSources);

      // Atualiza mensagens no histórico
      setHistory((prev) =>
        prev.map((h) =>
          h.id === newId
            ? { ...h, messages: [...updatedMessages, { id: newAiId, sender: "ai" as const, text: "", sources: lastSources }] }
            : h
        )
      );

      audioRef.current?.play().catch(() => {});
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "ai",
          text: "Ocorreu um erro ao conectar com o servidor. Verifique se o backend está rodando.",
        },
      ]);
    } finally {
      setLoading(false);
      setAiMsgId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
  
  function handlePromptChip(text: string) {
    setInput(text);
    inputRef.current?.focus();
    setTimeout(() => {
      setInput("");
      const userMsg: Message = { id: Date.now(), sender: "user", text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);
      setAiMsgId(null);

      const newId = Date.now();
      const newEntry: HistoryItem = {
        id: newId,
        label: text.slice(0, 30) + (text.length > 30 ? "…" : ""),
        messages: updatedMessages,
      };
      setHistory((prev) => [newEntry, ...prev]);
      setActiveHistoryId(newId);

      fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: text }),
      })
        .then(async (response) => {
          if (!response.body) return;
          const newAiId = Date.now() + 1;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let lastSources: Source[] = [];
          let firstContent = true;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value, { stream: true }).split("\n");
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const data = JSON.parse(line);
                if (data.type === "content") {
                  if (firstContent) {
                    firstContent = false;
                    setAiMsgId(newAiId);
                    setMessages((prev) => [...prev, { id: newAiId, sender: "ai", text: data.text ?? "" }]);
                  } else {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === newAiId ? { ...m, text: m.text + (data.text ?? "") } : m
                      )
                    );
                  }
                  if (data.winner) lastSources = [{ name: data.winner, path: "Ditoo/documentos/", percent: data.percent ?? 0 }];
                }
              } catch { /* ignore */ }
            }
          }
          setMessages((prev) => prev.map((m) => (m.id === newAiId ? { ...m, sources: lastSources } : m)));
          setActiveSources(lastSources);
        })
        .catch(() => {})
        .finally(() => { setLoading(false); setAiMsgId(null); });
    }, 0);
  }

  function handleNewChat() {
    setMessages([]);
    setActiveSources([]);
    setActiveHistoryId(null);
    setAiMsgId(null);
    inputRef.current?.focus();
  }

  function toggleSidebar() {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (isMobileViewport && next) setRightOpen(false);
      return next;
    });
  }

  function toggleRightPanel() {
    setRightOpen((prev) => {
      const next = !prev;
      if (isMobileViewport && next) setSidebarOpen(false);
      return next;
    });
  }

  const isAnyMobileMenuOpen = isMobileViewport && (sidebarOpen || rightOpen);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app-shell" onClick={() => { showUserMenu && setShowUserMenu(false); showAppear && setShowAppear(false); }}>

      {/* ── Header ── */}
      <header className="header">

        {/* painel lateral esquerdo: área do usuário */}
        <div className="header-left">
          <div>
            <button className="icon-btn" onClick={toggleSidebar} title="Menu">
              <Icon.Menu />
            </button>
          </div>
          <div
            className="user-area"
            onClick={(e) => { e.stopPropagation(); setShowUserMenu((v) => !v); }}
          >
            <div className="avatar">F</div>
            <span className="greeting">olá, <b>Fulana!</b></span>
            <Icon.ChevronDown />

            {showUserMenu && (
              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-item"><Icon.User /> Perfil</div>
                <hr className="dropdown-sep" />
                <div className="dropdown-item" onClick={() => { setShowAppear((v) => !v); setShowUserMenu(false); }}>
                  <Icon.Sun /> Aparência
                </div>
                <div className="dropdown-item"><Icon.Settings /> Configurações</div>
                <hr className="dropdown-sep" />
                <div className="dropdown-item danger"><Icon.Logout /> Sair</div>
              </div>
            )}
          </div>
        </div>

        {/* centro: logo */}
        <div className="logo-area">
          <DitooLogo size={30} />
          <span className="logo-text">ditoo</span>
        </div>

        {/* painel lateral direito: arquivos referenciados */}
        <div className="header-right">
          <div
            className={`files-toggle ${rightOpen ? "active" : ""}`}
            onClick={toggleRightPanel}
          >
            <Icon.Folder />
            Arquivos e caminhos
          </div>
        </div>
      </header>

      {/* ── área principal ── */}
      <div className="main-area">
        {isAnyMobileMenuOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => {
              setSidebarOpen(false);
              setRightOpen(false);
            }}
          />
        )}

        {/* ── painel lateral esquerdo ── */}
        <aside className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-inner">

            <button className="new-chat-btn" onClick={handleNewChat}>
              <Icon.Plus /> Nova conversa
            </button>

            <div className="section-label">Recentes</div>
            <div style={{ flex: 1, overflow: "hidden", overflowY: "auto" }}>
              {history.length === 0 && (
                <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--muted)" }}>
                  Nenhuma conversa ainda
                </div>
              )}
              {history.map((item) => (
                <HistoryEntry
                  key={item.id}
                  item={item}
                  isActive={activeHistoryId === item.id && messages.length > 0}
                  onClick={() => setActiveHistoryId(item.id)}
                />
              ))}
            </div>

            <div className="sidebar-bottom">
              {showAppear && <AppearancePanel onClose={() => setShowAppear(false)} />}
              <div className="history-item" onClick={(e) => { e.stopPropagation(); setShowAppear((v) => !v); }}>
                <Icon.Sun /> Aparência
              </div>
              <div className="history-item"><Icon.Settings /> Configurações</div>
            </div>
          </div>
        </aside>

        {/* ── Chat ── */}
        <main className="chat-area">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div style={{ textAlign: "center" }}>
                  <DitooLogo size={44} />
                  <div className="empty-title">Como posso ajudar, Fulana?</div>
                </div>
                <div className="prompts-grid">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button key={p} className="prompt-chip" onClick={() => handlePromptChip(p)}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages
                .filter((msg) => !(msg.sender === "ai" && msg.text === "" && loading && msg.id === aiMsgId))
                .map((msg) => (
                  <div key={msg.id} className={`msg-wrap ${msg.sender}`}>
                    <div className="msg-sender">
                      {msg.sender === "user" ? "Você" : "Ditoo"}
                    </div>
                    <div className={`bubble ${msg.sender}`}>
                      {msg.text}
                      {msg.sender === "ai" && msg.sources && msg.sources.length > 0 && (
                        <div className="source-tag" style={{ display: "block", marginTop: 8 }}>
                          <Icon.FileSource />
                          {" "}{msg.sources.length} fonte{msg.sources.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))
            )}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!(isMobileViewport && (sidebarOpen || rightOpen)) && (
            <div className="input-area">
              <div className="input-wrap">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  placeholder="Como posso te ajudar hoje?"
                  value={input}
                  rows={1}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  onKeyDown={handleKeyDown}
                />
                <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
                  <Icon.Send /> Enviar
                </button>
              </div>
            </div>
          )}
        </main>

        {/* ── painel lateral direito ── */}
        <aside className={`right-panel ${rightOpen ? "" : "closed"}`}>
          <div className="rp-inner">
            <div className="rp-title">Arquivos e caminhos</div>

            {activeSources.length === 0 ? (
              <div className="empty-rp">
                <Icon.Folder />
                <div className="empty-rp-text">
                  Faça uma pergunta para ver os arquivos referenciados
                </div>
              </div>
            ) : (
              activeSources.map((src, i) => (
                <SourceCard key={src.name + i} source={src} index={i} />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
