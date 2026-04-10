import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "../../styles/Chat.css";

const MODELS = [
  { id: "gemini", label: "Gemini 2.0 Flash", badge: "Fast" },
  { id: "groq", label: "Llama 3.3 70B", badge: "Powerful" },
];

function ModelSwitcher({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = MODELS.find((m) => m.id === selected) || MODELS[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="model-switcher" ref={ref}>
      <button className="model-trigger" onClick={() => setOpen(!open)}>
        <span className="model-label">{current.label}</span>
        <ChevronDown
          size={13}
          className={`model-chevron ${open ? "open" : ""}`}
        />
      </button>

      {open && (
        <div className="model-dropdown">
          {MODELS.map((m) => (
            <button
              key={m.id}
              className={`model-option ${selected === m.id ? "active" : ""}`}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              <span className="model-option-label">{m.label}</span>
              <span className="model-badge">{m.badge}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ModelSwitcher;
