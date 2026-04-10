import { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const styles = {
  error: { color: "#fff", bg: "#c0392b", border: "#c0392b" },
  warning: { color: "#fff", bg: "#b45309", border: "#b45309" },
  success: { color: "#fff", bg: "#166534", border: "#166534" },
  info: {color: "#fff", bg: "#282c3f", border: "#282c3f"},
};

function Message({ type = "error", text, onClose }) {
  const Icon = icons[type];
  const s = styles[type];

  useEffect(() => {
    if (!text) return;

    const timer = setTimeout(() => {
      onClose && onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [text, onClose]);

  if (!text) return null;

  return (
    <div className="msg-container">
      <div
        className="msg-wrap"
        style={{
          "--msg-color": s.color,
          "--msg-bg": s.bg,
          "--msg-border": s.border,
        }}
      >
        <Icon size={16} strokeWidth={3} />
        <span>{text}</span>
      </div>
    </div>
  );
}

export default Message;