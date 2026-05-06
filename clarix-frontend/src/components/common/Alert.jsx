import { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const styles = {
  error: { color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
  warning: { color: "#a86b00", bg: "#f9dda4", border: "#a86b00" },
  success: { color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  info: {color: "#faf9f5", bg: "#141413", border: "#141413"},
};

function Message({ type = "error", text, onClose }) {
  const Icon = icons[type];
  const s = styles[type];

  useEffect(() => {
    if (!text) return;

    const timer = setTimeout(() => {
      onClose && onClose();
    }, 5000);

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
        <button className="msg-close" onClick={onClose}>
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default Message;