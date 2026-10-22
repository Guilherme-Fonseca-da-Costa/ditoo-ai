export type MarkdownBlock =
  | { type: "text"; text: string }
  | { type: "table"; headers: string[]; rows: string[][]; align: ("left" | "center" | "right")[] };

function cells(line: string): string[] {
  const parts: string[] = [];
  let value = "";
  let code = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\" && line[i + 1] === "|") {
      value += "|";
      i++;
    } else if (char === "`") {
      code = !code;
      value += char;
    } else if (char === "|" && !code) {
      parts.push(value.trim());
      value = "";
    } else value += char;
  }
  parts.push(value.trim());
  if (line.trim().startsWith("|")) parts.shift();
  if (line.trim().endsWith("|") && !line.trim().endsWith("\\|")) parts.pop();
  return parts;
}

export function markdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let prose: string[] = [];
  let fence: string | undefined;
  const flush = () => {
    if (prose.length) blocks.push({ type: "text", text: prose.join("\n") });
    prose = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const marker = lines[i].trim().match(/^(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      prose.push(lines[i]);
      continue;
    }
    const header = cells(lines[i]);
    const separator = i + 1 < lines.length ? cells(lines[i + 1]) : [];
    if (fence || !lines[i].includes("|") || header.length < 2 ||
        separator.length !== header.length || !separator.every(c => /^:?-{3,}:?$/.test(c))) {
      prose.push(lines[i]);
      continue;
    }
    flush();
    const align = separator.map(c => c.endsWith(":") ? (c.startsWith(":") ? "center" : "right") : "left") as ("left" | "center" | "right")[];
    const rows: string[][] = [];
    i++;
    while (i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].trim()) {
      const row = cells(lines[++i]);
      rows.push(header.map((_, j) => row[j] ?? ""));
    }
    blocks.push({ type: "table", headers: header, rows, align });
  }
  flush();
  return blocks;
}
