import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import DitooLogo from "./DitooLogo";
import Alert from "./Alert";
import { api } from "../services/api";
import "../assets/EmailsPage.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailStatus = "pending" | "sent";

interface EmailItem {
  id: string;
  from: string;
  fromName?: string | null;
  subject: string;
  body: string;
  receivedAt: string; // ISO 8601
  reply: string; // resposta sugerida pelo Ditoo (ou já editada pelo usuário)
  status: EmailStatus;
  sentAt?: string | null;
}

interface AlertItem {
  id: number;
  text: string;
  type?: "success" | "error" | "info";
}

type Busy = "save" | "send" | "delete" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function senderLabel(email: EmailItem): string {
  return email.fromName?.trim() || email.from;
}

function previewOf(body: string): string {
  return body.replace(/\s+/g, " ").trim();
}

function ArrowLeft() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmailsPage() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  function pushAlert(text: string, type: AlertItem["type"] = "success") {
    const id = Date.now() + Math.random();
    setAlerts((prev) => [...prev, { id, text, type }]);
  }

  function removeAlert(id: number) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  // Redireciona pro login se não houver sessão válida
  useEffect(() => {
    api.getMe().then((me) => {
      if (!me) navigate("/login");
    });
  }, []);

  const loadEmails = useCallback(async () => {
    console.log("Loading emails...");
    setLoading(true);
    setLoadError(false);
    try {
      const data: EmailItem[] = await api.getEmails();
      setEmails(data);
      setSelectedId((current) =>
        current && data.some((e) => e.id === current)
          ? current
          : (data[0]?.id ?? null),
      );
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const selected = useMemo(
    () => emails.find((e) => e.id === selectedId) ?? null,
    [emails, selectedId],
  );

  // Ao trocar de e-mail, sai do modo de edição e descarta confirmações pendentes
  useEffect(() => {
    setEditing(false);
    setConfirmingDelete(false);
    setDraft(selected?.reply ?? "");
  }, [selectedId]);

  const pendingCount = emails.filter((e) => e.status === "pending").length;

  // ─── Ações ──────────────────────────────────────────────────────────────────

  function selectEmail(id: string) {
    setSelectedId(id);
    setMobileDetailOpen(true);
  }

  function startEdit() {
    if (!selected) return;
    setDraft(selected.reply);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(selected?.reply ?? "");
  }

  async function saveEdit() {
    if (!selected) return;
    setBusy("save");
    try {
      await api.updateEmailReply(selected.id, draft);
      setEmails((prev) =>
        prev.map((e) => (e.id === selected.id ? { ...e, reply: draft } : e)),
      );
      setEditing(false);
      pushAlert("Resposta salva.");
    } catch {
      pushAlert("Não foi possível salvar a resposta. Tente novamente.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    if (!selected || !selected.reply.trim()) return;
    setBusy("send");
    try {
      const res = await api.sendEmail(selected.id, selected.reply);
      const sentAt: string = res?.sentAt ?? new Date().toISOString();
      setEmails((prev) =>
        prev.map((e) =>
          e.id === selected.id ? { ...e, status: "sent", sentAt } : e,
        ),
      );
      pushAlert(`Resposta enviada para ${senderLabel(selected)}.`);
    } catch {
      pushAlert("Não foi possível enviar a resposta. Tente novamente.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setBusy("delete");
    try {
      await api.deleteEmail(selected.id);
      const index = emails.findIndex((e) => e.id === selected.id);
      const remaining = emails.filter((e) => e.id !== selected.id);
      setEmails(remaining);
      const next = remaining[index] ?? remaining[index - 1] ?? null;
      setSelectedId(next?.id ?? null);
      if (!next) setMobileDetailOpen(false);
      pushAlert("E-mail excluído.");
    } catch {
      pushAlert("Não foi possível excluir o e-mail. Tente novamente.", "error");
    } finally {
      setBusy(null);
      setConfirmingDelete(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className={`emails-shell${mobileDetailOpen ? " emails-shell--detail" : ""}`}
    >
      <header className="header">
        <div className="header-left">
          <button className="emails-back" onClick={() => navigate("/chat")}>
            <ArrowLeft /> Voltar ao chat
          </button>
        </div>
        <div className="logo-area">
          <DitooLogo size={30} />
          <span className="logo-text">ditoo</span>
        </div>
        <div className="header-right" />
      </header>

      <div className="emails-body">
        {/* ── Lista ── */}
        <aside className="emails-list-pane" aria-label="E-mails recebidos">
          <div className="emails-list-head">
            <h1>E-mails recebidos</h1>
            {!loading && !loadError && emails.length > 0 && (
              <span className="emails-count">
                {pendingCount === 0
                  ? "Todos enviados"
                  : `${pendingCount} aguardando envio`}
              </span>
            )}
          </div>

          {loading && <p className="emails-notice">Carregando e-mails…</p>}

          {!loading && loadError && (
            <div className="emails-notice">
              <p>
                Não foi possível carregar os e-mails. Verifique se o servidor
                está rodando.
              </p>
              <button className="emails-btn" onClick={loadEmails}>
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !loadError && emails.length === 0 && (
            <p className="emails-notice">
              Nenhum e-mail recebido ainda. Quando o Ditoo receber um e-mail,
              ele aparece aqui junto com uma resposta sugerida.
            </p>
          )}

          {!loading && !loadError && emails.length > 0 && (
            <ul className="emails-list">
              {emails.map((email) => (
                <li key={email.id}>
                  <button
                    className="emails-item"
                    aria-current={email.id === selectedId}
                    onClick={() => selectEmail(email.id)}
                  >
                    <span className="emails-item-top">
                      <span className="emails-item-from">
                        {senderLabel(email)}
                      </span>
                      <span className="emails-item-date">
                        {formatDate(email.receivedAt)}
                      </span>
                    </span>
                    <span className="emails-item-subject">
                      {email.subject || "(sem assunto)"}
                    </span>
                    <span className="emails-item-preview">
                      {previewOf(email.body)}
                    </span>
                    <span className="emails-item-status">
                      <span
                        className={`emails-dot${email.status === "sent" ? " emails-dot--sent" : ""}`}
                        aria-hidden="true"
                      />
                      {email.status === "sent"
                        ? "Resposta enviada"
                        : "Resposta pronta para enviar"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── Detalhe ── */}
        <section className="emails-detail-pane">
          <button
            className="emails-back emails-back--mobile"
            onClick={() => setMobileDetailOpen(false)}
          >
            <ArrowLeft /> Voltar para a lista
          </button>

          {selected ? (
            <>
              <div className="emails-scroll">
                <div className="emails-content">
                  <article className="emails-card">
                    <h3>E-mail recebido</h3>
                    <h2>{selected.subject || "(sem assunto)"}</h2>
                    <p className="emails-meta">
                      <span>
                        De: {senderLabel(selected)}
                        {selected.fromName?.trim() && ` <${selected.from}>`}
                      </span>
                      <span>Recebido em {formatDate(selected.receivedAt)}</span>
                    </p>
                    <div className="emails-text">{selected.body}</div>
                  </article>

                  <article className="emails-card emails-card--reply">
                    <h3>Resposta do Ditoo</h3>
                    {editing ? (
                      <>
                        <label
                          className="emails-sr-only"
                          htmlFor="emails-reply-draft"
                        >
                          Editar resposta
                        </label>
                        <textarea
                          id="emails-reply-draft"
                          className="emails-textarea"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          disabled={busy === "save"}
                          autoFocus
                        />
                      </>
                    ) : (
                      <div className="emails-text">
                        {selected.reply || "O Ditoo ainda não sugeriu uma resposta."}
                      </div>
                    )}
                    {selected.status === "sent" && (
                      <p className="emails-sent-note">
                        Enviada em {formatDate(selected.sentAt)}
                      </p>
                    )}
                  </article>
                </div>
              </div>

              <div className="emails-actions">
                {confirmingDelete ? (
                  <>
                    <span className="emails-confirm-text">
                      Excluir este e-mail e a resposta sugerida?
                    </span>
                    <button
                      className="emails-btn"
                      onClick={() => setConfirmingDelete(false)}
                      disabled={busy === "delete"}
                    >
                      Cancelar
                    </button>
                    <button
                      className="emails-btn emails-btn--danger"
                      onClick={handleDelete}
                      disabled={busy === "delete"}
                    >
                      {busy === "delete" ? "Excluindo…" : "Excluir"}
                    </button>
                  </>
                ) : editing ? (
                  <>
                    <button
                      className="emails-btn"
                      onClick={cancelEdit}
                      disabled={busy === "save"}
                    >
                      Cancelar
                    </button>
                    <button
                      className="send-btn"
                      onClick={saveEdit}
                      disabled={busy === "save" || !draft.trim()}
                    >
                      {busy === "save" ? "Salvando…" : "Salvar"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="emails-btn emails-btn--danger-ghost"
                      onClick={() => setConfirmingDelete(true)}
                      disabled={busy !== null}
                    >
                      Excluir
                    </button>
                    {selected.status !== "sent" && (
                      <>
                        <button
                          className="emails-btn"
                          onClick={startEdit}
                          disabled={busy !== null}
                        >
                          Editar
                        </button>
                        <button
                          className="send-btn"
                          onClick={handleSend}
                          disabled={busy !== null || !selected.reply.trim()}
                        >
                          {busy === "send" ? "Enviando…" : "Enviar"}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            !loading &&
            !loadError &&
            emails.length > 0 && (
              <p className="emails-notice">
                Selecione um e-mail na lista para ver a resposta sugerida.
              </p>
            )
          )}
        </section>
      </div>

      <div className="alert-stack">
        {alerts.map((a) => (
          <Alert
            key={a.id}
            text={a.text}
            type={a.type}
            onClose={() => removeAlert(a.id)}
          />
        ))}
      </div>
    </div>
  );
}