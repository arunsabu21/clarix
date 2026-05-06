import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

export default function LoginTooltip({ user }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("login_tooltip_shown");
    if (!shown && user?.email && !user?.name) {
      setVisible(true);
      sessionStorage.setItem("login_tooltip_shown", "true");
    }
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [user]);

  if (!visible) return null;

  return (
    <>
      <div className="login-tooltip">
        <div className="login-tooltip__content">
          <span>
            Personalize your experience by setting your name in Settings{" "}
            <strong
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/settings/account")}
            >
              Settings
            </strong>{" "}
          </span>
          <button
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            className="login-tooltip__close"
          >
            <X size={13} />
          </button>
        </div>
        <div className="login-tooltip__arrow" />
      </div>
    </>
  );
}
