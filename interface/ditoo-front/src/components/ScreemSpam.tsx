import { useEffect } from "react";

interface Props {
  text: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export default function Alert({ text, type = "success", onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3300);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`alert alert-${type}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
          strokeWidth="2"
        />
        <path d="M12 8L12 13" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 16V15.9888" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h4>{text}</h4>
    </div>
  );
}