import ReactMarkdown from "react-markdown";
import { markdownBlocks } from "../utils/markdownTables";

export default function MessageMarkdown({ text }: { text: string }) {
  return <>{markdownBlocks(text).map((block, index) => block.type === "text" ? (
    <ReactMarkdown key={index}>{block.text}</ReactMarkdown>
  ) : (
    <div key={index} className="message-table-scroll" tabIndex={0} role="region" aria-label="Tabela de resultados">
      <table className="message-table">
        <thead><tr>{block.headers.map((header, col) => (
          <th key={col} scope="col" style={{ textAlign: block.align[col] }}><ReactMarkdown>{header}</ReactMarkdown></th>
        ))}</tr></thead>
        <tbody>{block.rows.map((row, line) => <tr key={line}>{row.map((cell, col) => (
          <td key={col} style={{ textAlign: block.align[col] }}><ReactMarkdown>{cell}</ReactMarkdown></td>
        ))}</tr>)}</tbody>
      </table>
    </div>
  ))}</>;
}
