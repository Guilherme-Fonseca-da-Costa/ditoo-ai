import { useEffect, useRef, useState, type DragEvent } from "react";
import DitooLogo from "../components/DitooLogo";
import ReactMarkdown from 'react-markdown'
import {
  useTheme,
  ACCENT_COLORS,
  type AccentColor,
} from "../context/ThemeContext";
import Config from "../pages/Config";
import { api } from "../services/api";

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
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Chat: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Folder: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="13"
      height="13"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  ),
  User: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  Logout: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  PDF: () => (
    <svg
      width="50"
      height="50"
      viewBox="0 0 512 512"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      fill="#000000"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <title>pdf-document</title>{" "}
        <g
          id="Page-1"
          stroke="none"
          stroke-width="1"
          fill="none"
          fill-rule="evenodd"
        >
          {" "}
          <g
            id="add"
            fill="#787878"
            transform="translate(85.333333, 42.666667)"
          >
            {" "}
            <path
              d="M75.9466667,285.653333 C63.8764997,278.292415 49.6246897,275.351565 35.6266667,277.333333 L1.42108547e-14,277.333333 L1.42108547e-14,405.333333 L28.3733333,405.333333 L28.3733333,356.48 L40.5333333,356.48 C53.1304778,357.774244 65.7885986,354.68506 76.3733333,347.733333 C85.3576891,340.027178 90.3112817,328.626053 89.8133333,316.8 C90.4784904,304.790173 85.3164923,293.195531 75.9466667,285.653333 L75.9466667,285.653333 Z M53.12,332.373333 C47.7608867,334.732281 41.8687051,335.616108 36.0533333,334.933333 L27.7333333,334.933333 L27.7333333,298.666667 L36.0533333,298.666667 C42.094796,298.02451 48.1897668,299.213772 53.5466667,302.08 C58.5355805,305.554646 61.3626692,311.370371 61.0133333,317.44 C61.6596233,323.558965 58.5400493,329.460862 53.12,332.373333 L53.12,332.373333 Z M150.826667,277.333333 L115.413333,277.333333 L115.413333,405.333333 L149.333333,405.333333 C166.620091,407.02483 184.027709,403.691457 199.466667,395.733333 C216.454713,383.072462 225.530463,362.408923 223.36,341.333333 C224.631644,323.277677 218.198313,305.527884 205.653333,292.48 C190.157107,280.265923 170.395302,274.806436 150.826667,277.333333 L150.826667,277.333333 Z M178.986667,376.32 C170.098963,381.315719 159.922142,383.54422 149.76,382.72 L144.213333,382.72 L144.213333,299.946667 L149.333333,299.946667 C167.253333,299.946667 174.293333,301.653333 181.333333,308.053333 C189.877212,316.948755 194.28973,329.025119 193.493333,341.333333 C194.590843,354.653818 189.18793,367.684372 178.986667,376.32 L178.986667,376.32 Z M254.506667,405.333333 L283.306667,405.333333 L283.306667,351.786667 L341.333333,351.786667 L341.333333,329.173333 L283.306667,329.173333 L283.306667,299.946667 L341.333333,299.946667 L341.333333,277.333333 L254.506667,277.333333 L254.506667,405.333333 L254.506667,405.333333 Z M234.666667,7.10542736e-15 L9.52127266e-13,7.10542736e-15 L9.52127266e-13,234.666667 L42.6666667,234.666667 L42.6666667,192 L42.6666667,169.6 L42.6666667,42.6666667 L216.96,42.6666667 L298.666667,124.373333 L298.666667,169.6 L298.666667,192 L298.666667,234.666667 L341.333333,234.666667 L341.333333,106.666667 L234.666667,7.10542736e-15 L234.666667,7.10542736e-15 Z"
              id="document-pdf"
            >
              {" "}
            </path>{" "}
          </g>{" "}
        </g>{" "}
      </g>
    </svg>
  ),
  UploadBox: () => (
    <svg
      width="60"
      height="60"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <path
          d="M13.5 3H12H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H11M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V11.8125"
          stroke="#8a8a8a"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>{" "}
        <path
          d="M17 15V18M17 21V18M17 18H14M17 18H20"
          stroke="#8a8a8a"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>{" "}
      </g>
    </svg>
  ),
  Upload: () => (
    <svg
      width="16px"
      height="16px"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      fill="#000000"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></g>
      <g id="SVGRepo_iconCarrier">
        <path
          d="M736.68 435.86a173.773 173.773 0 0 1 172.042 172.038c0.578 44.907-18.093 87.822-48.461 119.698-32.761 34.387-76.991 51.744-123.581 52.343-68.202 0.876-68.284 106.718 0 105.841 152.654-1.964 275.918-125.229 277.883-277.883 1.964-152.664-128.188-275.956-277.883-277.879-68.284-0.878-68.202 104.965 0 105.842zM285.262 779.307A173.773 173.773 0 0 1 113.22 607.266c-0.577-44.909 18.09-87.823 48.461-119.705 32.759-34.386 76.988-51.737 123.58-52.337 68.2-0.877 68.284-106.721 0-105.842C132.605 331.344 9.341 454.607 7.379 607.266 5.417 759.929 135.565 883.225 285.262 885.148c68.284 0.876 68.2-104.965 0-105.841z"
          fill="#ffffff"
        ></path>
        <path
          d="M339.68 384.204a173.762 173.762 0 0 1 172.037-172.038c44.908-0.577 87.822 18.092 119.698 48.462 34.388 32.759 51.743 76.985 52.343 123.576 0.877 68.199 106.72 68.284 105.843 0-1.964-152.653-125.231-275.917-277.884-277.879-152.664-1.962-275.954 128.182-277.878 277.879-0.88 68.284 104.964 68.199 105.841 0z"
          fill="#ffffff"
        ></path>
        <path
          d="M545.039 473.078c16.542 16.542 16.542 43.356 0 59.896l-122.89 122.895c-16.542 16.538-43.357 16.538-59.896 0-16.542-16.546-16.542-43.362 0-59.899l122.892-122.892c16.537-16.542 43.355-16.542 59.894 0z"
          fill="#ffffff"
        ></path>
        <path
          d="M485.17 473.078c16.537-16.539 43.354-16.539 59.892 0l122.896 122.896c16.538 16.533 16.538 43.354 0 59.896-16.541 16.538-43.361 16.538-59.898 0L485.17 532.979c-16.547-16.543-16.547-43.359 0-59.901z"
          fill="#ffffff"
        ></path>
        <path
          d="M514.045 634.097c23.972 0 43.402 19.433 43.402 43.399v178.086c0 23.968-19.432 43.398-43.402 43.398-23.964 0-43.396-19.432-43.396-43.398V677.496c0.001-23.968 19.433-43.399 43.396-43.399z"
          fill="#ffffff"
        ></path>
      </g>
    </svg>
  ),
  ModelSwitch: () => (
    <svg
      width="16px"
      height="16px"
      viewBox="-4.8 -4.8 57.60 57.60"
      xmlns="http://www.w3.org/2000/svg"
      fill="#ffffff"
      stroke="#ffffff"
    >
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g
        id="SVGRepo_tracerCarrier"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke="#CCCCCC"
        stroke-width="0.192"
      ></g>
      <g id="SVGRepo_iconCarrier">
        {" "}
        <title>ai</title>{" "}
        <g id="Layer_2" data-name="Layer 2">
          {" "}
          <g id="invisible_box" data-name="invisible box">
            {" "}
          </g>{" "}
          <g id="Q3_icons" data-name="Q3 icons">
            {" "}
            <g>
              {" "}
              <path d="M45.6,18.7,41,14.9V7.5a1,1,0,0,0-.6-.9L30.5,2.1h-.4l-.6.2L24,5.9,18.5,2.2,17.9,2h-.4L7.6,6.6a1,1,0,0,0-.6.9v7.4L2.4,18.7a.8.8,0,0,0-.4.8v9H2a.8.8,0,0,0,.4.8L7,33.1v7.4a1,1,0,0,0,.6.9l9.9,4.5h.4l.6-.2L24,42.1l5.5,3.7.6.2h.4l9.9-4.5a1,1,0,0,0,.6-.9V33.1l4.6-3.8a.8.8,0,0,0,.4-.7V19.4h0A.8.8,0,0,0,45.6,18.7Zm-5.1,6.8H42v1.6l-3.5,2.8-.4.3-.4-.2a1.4,1.4,0,0,0-2,.7,1.5,1.5,0,0,0,.6,2l.7.3h0v5.4l-6.6,3.1-4.2-2.8-.7-.5V25.5H27a1.5,1.5,0,0,0,0-3H25.5V9.7l.7-.5,4.2-2.8L37,9.5v5.4h0l-.7.3a1.5,1.5,0,0,0-.6,2,1.4,1.4,0,0,0,1.3.9l.7-.2.4-.2.4.3L42,20.9v1.6H40.5a1.5,1.5,0,0,0,0,3ZM21,25.5h1.5V38.3l-.7.5-4.2,2.8L11,38.5V33.1h0l.7-.3a1.5,1.5,0,0,0,.6-2,1.4,1.4,0,0,0-2-.7l-.4.2-.4-.3L6,27.1V25.5H7.5a1.5,1.5,0,0,0,0-3H6V20.9l3.5-2.8.4-.3.4.2.7.2a1.4,1.4,0,0,0,1.3-.9,1.5,1.5,0,0,0-.6-2L11,15h0V9.5l6.6-3.1,4.2,2.8.7.5V22.5H21a1.5,1.5,0,0,0,0,3Z"></path>{" "}
              <path d="M13.9,9.9a1.8,1.8,0,0,0,0,2.2l2.6,2.5v2.8l-4,4v5.2l4,4v2.8l-2.6,2.5a1.8,1.8,0,0,0,0,2.2,1.5,1.5,0,0,0,1.1.4,1.5,1.5,0,0,0,1.1-.4l3.4-3.5V29.4l-4-4V22.6l4-4V13.4L16.1,9.9A1.8,1.8,0,0,0,13.9,9.9Z"></path>{" "}
              <path d="M31.5,14.6l2.6-2.5a1.8,1.8,0,0,0,0-2.2,1.8,1.8,0,0,0-2.2,0l-3.4,3.5v5.2l4,4v2.8l-4,4v5.2l3.4,3.5a1.7,1.7,0,0,0,2.2,0,1.8,1.8,0,0,0,0-2.2l-2.6-2.5V30.6l4-4V21.4l-4-4Z"></path>{" "}
            </g>{" "}
          </g>{" "}
        </g>{" "}
      </g>
    </svg>
  ),
  Send: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  FileSource: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
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
    const timer = setTimeout(
      () => {
        if (fillRef.current) fillRef.current.style.width = `${source.percent}%`;
      },
      100 + index * 150,
    );
    return () => clearTimeout(timer);
  }, [source.percent, index]);

  return (
    <div className="source-card">
      <div className="source-name" title={source.name}>
        {source.name}
      </div>
      <div className="source-path" title={source.path}>
        {source.path}
      </div>
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

// painel de configurações do usuário modelo de LLM, gerenciar pastas e usuários (se for admin)

function ConfigPanel({ onClose }: { onClose: () => void }) {
  console.log("renderizando ConfigPanel");
  return (
    <div className="config-overlay" onClick={onClose}>
      <div className="config-modal" onClick={(e) => e.stopPropagation()}>
        <Config />
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
          {(
            Object.entries(ACCENT_COLORS) as [AccentColor, { hex: string }][]
          ).map(([key, val]) => (
            <div
              key={key}
              className={`accent-dot ${accent === key ? "active" : ""}`}
              style={{ background: val.hex }}
              onClick={() => {
                setAccent(key);
                onClose();
              }}
              title={key}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// painel de upload

function UploadPanel({ onClose }: { onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);
  console.log(over)
  const inputRef = useRef<HTMLInputElement>(null);
  const prevent = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  async function handleSendFiles(files: File[]) {
    for (const file of files) {
      await api.upload(file);
      console.log("Enviando:", files);
    }
    console.log("Enviando:", files);
  }

  async function handleDrop(e: any) {
    prevent(e);
    setOver(false);
    const dropped = Array.from<File>(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  const removeFile = (index: any) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-panel" onClick={(e) => e.stopPropagation()}>
      <div className="appear-row">
        <div>
          <span>Upload</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (!e.target.files) return;
              const selected = Array.from<File>(e.target.files);
              setFiles((prev) => [...prev, ...selected]);
            }}
          />
          <div
            onDragOver={(e) => {
              prevent(e);
              setOver(true);
            }}
            onDragLeave={(e) => {
              prevent(e);
              setOver(false);
            }}
            onDrop={handleDrop}
            id="uploadArea"
            onClick={() => inputRef.current?.click()}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Icon.UploadBox />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            flexDirection: "column",
            overflow: "auto",
            height: 200,
          }}
        >
          {files.map((f, i) => (
            <div key={i}>
              <div onClick={() => removeFile(i)} className="added-archive">
                <Icon.PDF />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>{f.name}</span>
                  <span>{(f.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="send-btn noText-btn" style={{}} onClick={() => {handleSendFiles(files); onClose()} }>Enviar</button>
    </div>
  );
}

// painel de modelos

function ModelPanel({
  onClose,
  selected,
  onSelect,
}: {
  onClose: () => void;
  selected: string;
  onSelect: (model: string) => void;
}) {
  const models = ["deepseek-r1:8b", "qwen2.5:7b", "llama3.1:8b"];

  return (
    <div className="model-panel" onClick={(e) => e.stopPropagation()}>
      <div className="appear-row column">
        <span>Modelos</span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 4,
          }}
        >
          {models.map((m) => (
            <div
              key={m}
              className={`history-item ${selected === m ? "active" : ""}`}
              onClick={() => {
                api.changeModel(m);
                onSelect(m);
                onClose();
              }}
            >
              <Icon.ModelSwitch /> {m}
            </div>
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
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
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
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 900px)").matches,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport);
  const [rightOpen, setRightOpen] = useState(() => !isMobileViewport);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppear, setShowAppear] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [activeSources, setActiveSources] = useState<Source[]>([]);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:8b");

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
                setMessages((prev) => [
                  ...prev,
                  { id: newAiId, sender: "ai", text: data.text ?? "" },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === newAiId
                      ? { ...m, text: m.text + (data.text ?? "") }
                      : m,
                  ),
                );
              }
              if (data.winner && data.percent != null) {
                lastSources = (data.winner as string[]).map((name) => ({
                  name,
                  path: `Ditoo/documentos/`,
                  percent: data.percent[name] ?? 0,
                }));
              }
            }
          } catch {
            // linha não é JSON válido, ignorar
          }
        }
      }

      // atualiza fontes
      setMessages((prev) =>
        prev.map((m) =>
          m.id === newAiId ? { ...m, sources: lastSources } : m,
        ),
      );
      setActiveSources(lastSources);

      // Atualiza mensagens no histórico
      setHistory((prev) =>
        prev.map((h) =>
          h.id === newId
            ? {
                ...h,
                messages: [
                  ...updatedMessages,
                  {
                    id: newAiId,
                    sender: "ai" as const,
                    text: "",
                    sources: lastSources,
                  },
                ],
              }
            : h,
        ),
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
                    setMessages((prev) => [
                      ...prev,
                      { id: newAiId, sender: "ai", text: data.text ?? "" },
                    ]);
                  } else {
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === newAiId
                          ? { ...m, text: m.text + (data.text ?? "") }
                          : m,
                      ),
                    );
                  }
                  if (data.winner && data.percent != null) {
                    lastSources = (data.winner as string[]).map((name) => ({
                      name,
                      path: `Ditoo/documentos/`,
                      percent: data.percent[name] ?? 0,
                    }));
                  }
                }
              } catch {
                /* ignore */
              }
            }
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === newAiId ? { ...m, sources: lastSources } : m,
            ),
          );
          setActiveSources(lastSources);
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setAiMsgId(null);
        });
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
    <div
      className="app-shell"
      onClick={() => {
        showUserMenu && setShowUserMenu(false);
        showAppear && setShowAppear(false);
        showModel && setShowModel(false);
        showUpload && setShowUpload(false);
      }}
    >
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
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu((v) => !v);
            }}
          >
            <div className="avatar">F</div>
            <span className="greeting">
              olá, <b>Fulana!</b>
            </span>
            <Icon.ChevronDown />

            {showUserMenu && (
              <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-item">
                  <Icon.User /> Perfil
                </div>
                <hr className="dropdown-sep" />
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowAppear((v) => !v);
                    setShowUserMenu(false);
                  }}
                >
                  <Icon.Sun /> Aparência
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowConfig((v) => !v);
                    setShowUserMenu(false);
                  }}
                >
                  <Icon.Settings /> Configurações
                </div>
                <hr className="dropdown-sep" />
                <div className="dropdown-item danger">
                  <Icon.Logout /> Sair
                </div>
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
                <div
                  style={{
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
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
              {showAppear && (
                <AppearancePanel onClose={() => setShowAppear(false)} />
              )}
              <div
                className="history-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAppear((v) => !v);
                }}
              >
                <Icon.Sun /> Aparência
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfig((v) => !v);
                }}
                className="history-item"
              >
                <Icon.Settings /> Configurações
              </div>
              {showConfig && (
                <ConfigPanel onClose={() => setShowConfig(false)} />
              )}
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
                    <button
                      key={p}
                      className="prompt-chip"
                      onClick={() => handlePromptChip(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages
                .filter(
                  (msg) =>
                    !(
                      msg.sender === "ai" &&
                      msg.text === "" &&
                      loading &&
                      msg.id === aiMsgId
                    ),
                )
                .map((msg) => (
                  <div key={msg.id} className={`msg-wrap ${msg.sender}`}>
                    <div className="msg-sender">
                      {msg.sender === "user" ? "Você" : "Ditoo"}
                    </div>
                    <div className={`bubble ${msg.sender}`}>
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.sender === "ai" &&
                        msg.sources &&
                        msg.sources.length > 0 && (
                          <div
                            className="source-tag"
                            style={{ display: "block", marginTop: 8 }}
                          >
                            <Icon.FileSource /> {msg.sources.length} fonte
                            {msg.sources.length > 1 ? "s" : ""}
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
              {showUpload && (
                <UploadPanel onClose={() => setShowUpload(false)} />
              )}
              {showModel && (
                <ModelPanel
                  selected={selectedModel}
                  onSelect={(m) => setSelectedModel(m)}
                  onClose={() => setShowModel(false)}
                />
              )}
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
                <button
                  className="send-btn noText-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUpload((v) => !v);
                  }}
                  disabled={loading}
                >
                  <Icon.Upload /> <span>Upload</span>
                </button>
                <button
                  className="send-btn noText-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModel((v) => !v);
                  }}
                  disabled={loading}
                >
                  <Icon.ModelSwitch /> <span>{selectedModel}</span>
                </button>
                <button
                  className="send-btn noText-btn"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  <Icon.Send /> <span>Enviar</span>
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
