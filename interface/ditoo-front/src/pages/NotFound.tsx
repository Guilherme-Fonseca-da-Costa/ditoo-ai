import { useNavigate } from "react-router";
import DitooLogo from "../components/DitooLogo";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found-page">
      <DitooLogo size={52} />
      <div className="not-found-code">404</div>
      <div className="not-found-text">Página não encontrada</div>
      <button className="not-found-btn" onClick={() => navigate("/chat")}>
        Voltar ao início
      </button>
    </div>
  );
}
