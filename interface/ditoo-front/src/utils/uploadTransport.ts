export type UploadProgress = {
  phase: "uploading" | "indexing" | "complete";
  percent?: number;
  completed?: number;
  total?: number;
};
export type UploadResult = { message: string; filename: string; folder_id: string; indexed: boolean };

export function uploadWithProgress(file: File, folderId?: string | null, onProgress?: (value: UploadProgress) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file, file.name);
    if (folderId) form.append("folder_id", folderId);
    form.append("progress", "true");
    let offset = 0;
    let pending = "";
    let result: UploadResult | undefined;
    let settled = false;
    const fail = (message: string) => { if (!settled) { settled = true; reject(new Error(message)); } };
    function read(final = false) {
      pending += xhr.responseText.slice(offset);
      offset = xhr.responseText.length;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      if (final && pending.trim()) { lines.push(pending); pending = ""; }
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "indexing") {
            const total = typeof event.total === "number" ? event.total : undefined;
            const completed = typeof event.completed === "number" ? event.completed : 0;
            onProgress?.({ phase: "indexing", total, completed,
              percent: total && total > 0 ? Math.min(100, Math.round(completed / total * 100)) : undefined });
          } else if (event.type === "result") result = event.result;
        } catch { fail("O servidor enviou uma resposta de progresso inv\u00e1lida. Tente novamente."); }
      }
    }
    xhr.open("POST", "/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = event => onProgress?.({ phase: "uploading",
      percent: event.lengthComputable ? Math.min(100, Math.round(event.loaded / event.total * 100)) : undefined });
    xhr.upload.onload = () => onProgress?.({ phase: "indexing" });
    xhr.onprogress = () => { if (xhr.status >= 200 && xhr.status < 300) read(); };
    xhr.onerror = () => fail("N\u00e3o foi poss\u00edvel conectar ao servidor. Verifique a conex\u00e3o ou a VPN.");
    xhr.onabort = () => fail("Envio cancelado. Selecione o arquivo e tente novamente.");
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let message = `Falha no upload (${xhr.status}).`;
        try { const error = JSON.parse(xhr.responseText); if (typeof error.detail === "string") message = error.detail; } catch { /* Non-JSON proxy errors. */ }
        fail(xhr.status === 401 ? "Sua sess\u00e3o expirou. Entre novamente e tente enviar o arquivo." : message);
        return;
      }
      read(true);
      if (!settled && result && typeof result.indexed === "boolean") {
        settled = true;
        onProgress?.({ phase: "complete", percent: result.indexed ? 100 : undefined });
        resolve(result);
      } else if (!settled) fail("O envio terminou sem confirma\u00e7\u00e3o do servidor. Verifique os arquivos antes de tentar novamente.");
    };
    onProgress?.({ phase: "uploading", percent: 0 });
    xhr.send(form);
  });
}
