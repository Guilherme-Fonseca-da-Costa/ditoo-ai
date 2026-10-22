export async function readNDJSONStream(response: Response, onEvent: (data: Record<string, any>) => void) {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(typeof error?.detail === "string" ? error.detail : "N\u00e3o foi poss\u00edvel iniciar a resposta.");
  }
  if (!response.body) throw new Error("O servidor retornou uma resposta vazia.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  function parse(line: string) {
    if (!line.trim()) return;
    let event;
    try { event = JSON.parse(line); } catch { throw new Error("O servidor enviou uma resposta inv\u00e1lida."); }
    onEvent(event);
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(parse);
    }
    buffer += decoder.decode();
    parse(buffer);
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
