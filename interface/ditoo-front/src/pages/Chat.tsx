import React, { useEffect, useRef, useState } from "react";
import downloadIcon from "../assets/download.png";
import loadingGif from "../assets/Rolling@1x-1.0s-200px-200px.gif";
import pdfIcon from "../assets/pdf.png";
import paperPlane from "../assets/paper-plane.png";
import docsImg from "../assets/docs.png";
import ditoo from "../assets/ditto.png";
import notificationSound from "../assets/soundEffect/sunovia-level-up-289723.mp3";

const App = () => {
  const [pergunta, setPergunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [font, setFontes] = useState("Sem fonte");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showAltFont, setShowAltFont] = useState(false);
  const [fontState, setFontState] = useState("fontExNot");
  const audioRef = useRef<HTMLAudioElement>(new Audio(notificationSound));
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      sender: "User",
      message: pergunta,
      font: font,
      percent: "",
    },
  ]);
  async function enviar() {
    if (!pergunta) return;

    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        id: 1,
        sender: "User",
        message: pergunta,
        font: "",
        percent: "",
      },
    ]);
    setPergunta("");
    const response = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: pergunta }),
    });

    //console.log(response);
    if (!response.body) {
      console.error("Erro: Resposta sem corpo (body) disponível.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textPlus = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line) continue;
        const data = JSON.parse(line);
        textPlus += chunk;

        if (data.type === "id") {
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              sender: "Ditoo",
              message: "",
              font: data.fontes,
              percent: data.percent,
            },
          ]);
        } else if (data.type === "content") {
          //console.log(textPlus);
          //console.log(data.id);
          //console.log(data.fontes);

          setFontes(data.winner);
          console.log("Porcentagem de concordância: " + data.percent + "%");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id
                ? {
                    ...msg,
                    message: msg.message + data.text,
                    font: data.winner,
                    percent: data.percent,
                  }
                : msg,
            ),
          );
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.sender === "Ditoo") {
        audioRef.current?.play();
      }
    }
  }, [loading]);

  return (
    <div id="chatPage">
      <div id="logoBlock"></div>
      <div id="chat">
        <div id="chatMessages">
          {messages.map((messages) => {
            if (!messages.message && messages.sender === "User") return null;
            return (
              <>
                <div
                  key={messages.id}
                  className={
                    messages.sender === "Ditoo" ? "responseAi" : "responseUser"
                  }
                  style={{
                    marginTop: "20px",
                    whiteSpace: "pre-wrap",
                    padding: "15px",
                  }}
                >
                  {messages.message}
                  <div ref={bottomRef} />
                </div>
                {messages.font && (
                  <div id="fonts-container">
                    <div
                      className="fonts-container-itens"
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        onMouseEnter={() => setFontState("fontExpanded")}
                        onClick={() => setFontState("fontExNot")}
                        style={{
                          display: "flex",
                          marginBottom: 3,
                          cursor: "pointer",
                          visibility: "visible",
                        }}
                      >
                        <img
                          width={25}
                          height={25}
                          src={docsImg}
                          alt=""
                          style={{
                            margin: "4px 0 1px 10px",
                          }}
                        />
                        <h3
                          style={{
                            userSelect: "none",
                            fontFamily: "Fira",
                            color: "white",
                            fontSize: 15,
                            fontWeight: "bold",
                            margin: "6px 0 0 10px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "120px",
                          }}
                        >
                          {messages.font}
                        </h3>
                      </div>
                      <div
                        className={fontState}
                        style={{
                          position: "relative",
                          width: "100%",
                          transition: "all 0.2s",
                        }}
                      >
                        <h4
                          onMouseEnter={() => setShowAltFont(true)}
                          onMouseLeave={() => setShowAltFont(false)} 
                          style={{
                            fontFamily: "Fira",
                            fontWeight: "normal",
                            color: "gray",
                            fontSize: 15,
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Ditoo/documentos/{messages.font}
                        </h4>
                        {showAltFont && (
                          <h4 key={messages.font} onMouseLeave={() => setShowAltFont(false)} onMouseEnter={() => setShowAltFont(true)} className="altFont">Ditoo/documentos/{messages.font}</h4>
                        )}
                        <div id="relevBar">
                          <div style={{ width: `${messages.percent}%` }} id="relevBarIn"></div>
                        </div>
                        <h4
                          style={{
                            margin: "7px 0px 0px 0px",
                            fontSize: 11,
                            color: "gray",
                            fontFamily: "Fira",
                          }}
                        >
                          Relevância: {messages.percent}%
                        </h4>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })}
        </div>

        <form id="chatForm">
          <input
            id="chatInput"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="O que deseja saber?"
            style={{ width: "80%", padding: "10px", borderRadius: 18 }}
          />

          <button id="chatSendButton" onClick={enviar} disabled={loading}>
            {loading ? (
              <img width={28} src={loadingGif} alt="" />
            ) : (
              <img width={28} src={paperPlane} alt="" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
