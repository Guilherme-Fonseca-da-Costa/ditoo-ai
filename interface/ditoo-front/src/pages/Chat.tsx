import React, { useEffect, useState } from "react";
import downloadIcon from "../assets/download.png";
import loadingGif from "../assets/Rolling@1x-1.0s-200px-200px.gif";
import pdfIcon from "../assets/pdf.png";
import paperPlane from "../assets/paper-plane.png";
import docsImg from "../assets/docs.png";
import ditoo from "../assets/ditto.png";

const App = () => {
  const [pergunta, setPergunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [font, setFontes] = useState("Sem fonte");
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      sender: "User",
      message: pergunta,
      font: font,
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
            { id: data.id, sender: "Ditoo", message: "", font: data.fontes },
          ]);
        } else if (data.type === "content") {
          //console.log(textPlus);
          //console.log(data.id);
          //console.log(data.fontes);

          setFontes(data.winner);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id
                ? {
                    ...msg,
                    message: msg.message + data.text,
                    font: data.winner,
                  }
                : msg,
            ),
          );
        }
      }
    }
    setLoading(false);
  }

  return (
    <div id="chatPage">
      <div id="logoBlock">
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
            <div style={{ display: "flex", marginBottom: 3 }}>
              <img width={25} height={25} src={docsImg} alt="" />
              <h3
                style={{
                  fontFamily: "Fira",
                  color: "white",
                  fontSize: 15,
                  fontWeight: "bold",
                  margin: "0 0 0 10px",
                }}
              >
                documento.pdf
              </h3>
            </div>

            <div style={{ width: "100%" }}>
              <h4
                style={{
                  fontFamily: "Fira",
                  fontWeight: "normal",
                  color: "gray",
                  fontSize: 15,
                  margin: 0,
                }}
              >
                C:/src/documento.pdf
              </h4>
              <div id="relevBar">
                <div id="relevBarIn"></div>
              </div>
              <h4
                style={{
                  margin: "7px 0px 0px 0px",
                  fontSize: 11,
                  color: "gray",
                  fontFamily: "Fira",
                }}
              >
                Relevância: 70%
              </h4>
            </div>
          </div>
        </div>
      </div>
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
                </div>
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
