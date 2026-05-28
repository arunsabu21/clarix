import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Message from "../components/common/Alert";
import api from "../services/api";

import "../styles/PaymentSuccess.css";

export default function UpgradeSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("pro");
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await api.get("/billing/status/");

        if (!isMounted) return;
        setPlan(response?.data ?? null);
      } catch (error) {
        console.error("Failed to fetch billing status:", error);
        setError("Something went wrong. Try again later.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    const timer = setTimeout(verifySession, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sessionId]);

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);

      const response = await api.get("/billing/portal/");
      const portalUrl = response?.data?.portal_url;

      if (!portalUrl) {
        setError("Failed to open billing portal");
      }
      window.location.assign(portalUrl);
    } catch (error) {
      console.error("Portal error:", error);
      setError("Something went wrong. Try again later.");
    } finally {
      setPortalLoading(false);
    }
  };

  const planName = plan === "max" ? "Max" : "Pro";

  const PRO_FEATURES = [
    "Unlimited AI messages",
    "Gemini 2.0 Flash + Groq LIama",
    "Image uploads & vision",
    "Full chat history & export",
    "Priority response speed",
    "API access",
  ];

  return (
    <>
      <Message type="warning" text={error} onClose={() => setError("")} />
      <div id="paymentLayout">
        <div className="payment-success-card">
          {loading ? (
            <div className="success-loading">
              <Loader2 size={32} className="spin" color="#0d0d0d" />
              <span>Activating your plan...</span>
            </div>
          ) : (
            <>
              <div className="success-icon-wrapper">
                <CheckCircle2 size={40} color="#16a34a" strokeWidth={1.5} />
              </div>

              <h1 className="success-title">Welcome to Clarix {planName}</h1>
              <p className="success-subtitle">
                Your subscription is now active. You have full access to all{" "}
                {planName} features.
              </p>

              <div className="success-plan-badge">
                <Sparkles size={13} />
                Clarix {planName} - Active
              </div>

              <div className="success-trial-note">
                <strong>7-day free trail started.</strong> You won't be charged
                until your trail ends. Cancel anytime before then.
              </div>

              <div className="success-features">
                <div className="success-features-title">What's unlocked</div>
                {PRO_FEATURES.map((f, i) => (
                  <div key={i} className="success-feature-item">
                    <CheckCircle2 size={15} />
                    {f}
                  </div>
                ))}
              </div>

              <button className="success-btn" onClick={() => navigate("/chat")}>
                Start chatting <ArrowRight size={16} />
              </button>

              <button
                className="success-manage-btn"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? "Loading..." : "Manage subscription"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
