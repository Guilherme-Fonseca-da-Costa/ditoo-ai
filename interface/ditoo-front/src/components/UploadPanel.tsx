import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { Upload, FileText, X, Loader2, Check, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import type { UploadProgress } from "../utils/uploadTransport";
import "../assets/upload-panel.css";

type Folder = { id: string; name: string; can_write?: boolean };
type Props = { onClose: () => void; onUploadSuccess: (message: string, type?: "success" | "error" | "info") => void };

export default function UploadPanel({ onClose, onUploadSuccess }: Props) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const inputId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderError, setFolderError] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [over, setOver] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [current, setCurrent] = useState({ index: 0, count: 0, name: "" });
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let alive = true;
    api.getFolders().then(data => {
      if (!alive) return;
      const writable: Folder[] = data.filter((folder: Folder) => folder.can_write !== false);
      setFolders(writable);
      setSelectedFolder(writable.find(folder => folder.name === "root")?.id ?? writable[0]?.id ?? "");
      if (!writable.length) {
        setFolderError(true);
        setUploadError("Voc\u00ea n\u00e3o tem permiss\u00e3o de escrita em nenhuma pasta. Solicite acesso ao administrador.");
      }
    }).catch(() => {
      if (alive) { setFolderError(true); setUploadError("Não foi possível carregar as pastas. Feche e reabra este painel."); }
    }).finally(() => { if (alive) setLoadingFolders(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy.current) onCloseRef.current();
      if (event.key === "Tab") {
        const elements = dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), [tabindex='0']");
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, []);

  function addFiles(selected: File[]) {
    if (busy.current) return;
    const supported = selected.filter(file => /\.(pdf|txt|csv|xlsx)$/i.test(file.name));
    setUploadError(supported.length !== selected.length ? "Alguns arquivos foram ignorados. Envie PDF, TXT, CSV ou XLSX." : "");
    setFiles(previous => [...previous, ...supported.filter(file => !previous.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified))]);
    setFinished(false); setProgress(null);
  }

  function drop(event: DragEvent) {
    event.preventDefault(); event.stopPropagation(); setOver(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  async function handleSendFiles() {
    if (busy.current || !files.length) return;
    busy.current = true; setSending(true); setFinished(false); setUploadError("");
    let warnings = false;
    try {
      for (const [index, file] of files.entries()) {
        setCurrent({ index: index + 1, count: files.length, name: file.name });
        setProgress({ phase: "uploading", percent: 0 });
        const result = await api.upload(file, selectedFolder, setProgress);
        setFiles(previous => previous.filter(item => item !== file));
        warnings ||= !result.indexed;
        onUploadSuccess(result.message, result.indexed ? "success" : "info");
      }
      setFinished(true);
      if (warnings) setUploadError("Envio concluído. Alguns arquivos foram recebidos, mas não puderam ser indexados.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar o arquivo. Tente novamente.");
    } finally { busy.current = false; setSending(false); }
  }

  return createPortal(
    <div className="upload-overlay" onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget && !busy.current) onClose(); }}>
      <div ref={dialog} className="document-upload" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className="document-upload-header">
          <div><h2 id={titleId}>Adicionar documentos</h2><p>Envie arquivos para consultar no Ditoo.</p></div>
          <button type="button" className="upload-icon-button" aria-label="Fechar envio de documentos" disabled={sending} onClick={onClose}><X size={20} /></button>
        </header>
        <div className="document-upload-body">
          <label className="upload-folder-label">Pasta de destino
            <select value={selectedFolder} disabled={sending || loadingFolders} onChange={event => setSelectedFolder(event.target.value)}>
              <option value="">{loadingFolders ? "Carregando pastas..." : "Pasta padrão"}</option>
              {folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
          </label>
          <input ref={inputRef} id={inputId} type="file" className="upload-file-input" accept=".pdf,.txt,.csv,.xlsx" multiple disabled={sending}
            onChange={event => { event.stopPropagation(); addFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
          <button type="button" className={`upload-dropzone ${over ? "is-over" : ""}`} disabled={sending}
            onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={drop}>
            <Upload size={28} /><strong>Escolher arquivos</strong><span>Selecione os arquivos ou arraste para cá.</span><small>PDF, TXT, CSV e XLSX</small>
          </button>
          {files.length > 0 && <ul className="upload-file-list" aria-label="Arquivos selecionados">{files.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}>
            <FileText size={20} aria-hidden="true" /><div><strong title={file.name}>{file.name}</strong><span>{file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`}</span></div>
            <button type="button" className="upload-icon-button" disabled={sending} aria-label={`Remover ${file.name}`} onClick={() => setFiles(previous => previous.filter((_, i) => i !== index))}><X size={16} /></button>
          </li>)}</ul>}
          {progress && <section className="upload-status" aria-label="Progresso do envio">
            <p className="upload-status-title" role="status">{finished ? <Check size={18} /> : <Loader2 size={18} className={sending ? "upload-spinner" : ""} />}{finished ? "Envio concluído" : `Arquivo ${current.index} de ${current.count}`}</p>
            <p className="upload-current-name">{current.name}</p>
            <div className="upload-progress-label"><span>Envio</span><span>{progress.phase === "uploading" ? (progress.percent === undefined ? "Enviando..." : `${progress.percent}%`) : "100%"}</span></div>
            <progress aria-label="Progresso do upload" max={100} value={progress.phase === "uploading" ? progress.percent : 100} />
            <div className="upload-progress-label"><span>Indexação</span><span>{progress.phase === "uploading" ? "Aguardando" : progress.phase === "complete" ? (progress.percent === 100 ? "Concluída" : "Não concluída") : progress.total ? `${progress.completed} de ${progress.total} trechos` : "Lendo documento..."}</span></div>
            <progress aria-label="Progresso da indexação" max={100} value={progress.phase === "uploading" ? 0 : progress.percent} />
          </section>}
          {uploadError && <p className="upload-error" role="alert"><AlertCircle size={18} />{uploadError}</p>}
        </div>
        <footer className="document-upload-footer">
          <span>{files.length ? `${files.length} arquivo(s) selecionado(s)` : "Nenhum arquivo selecionado"}</span>
          <div><button type="button" className="upload-secondary" disabled={sending} onClick={onClose}>{finished ? "Fechar" : "Cancelar"}</button>
            {!finished && <button type="button" className="upload-primary" disabled={sending || loadingFolders || folderError || !files.length} onClick={handleSendFiles}>{sending ? "Processando..." : "Enviar arquivos"}</button>}</div>
        </footer>
      </div>
    </div>, document.body);
}
