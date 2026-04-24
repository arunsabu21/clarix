import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Message from "../components/common/Alert";
import {
  Check,
  CheckCircle,
  Zap,
  Crown,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import api from "../services/api";
import "../styles/Pricing.css";

export default function PricingPage() {
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [statusLoading, setStatusLoading] = useState(true);

  const [cancelAtEnd, setCancelAtEnd] = useState(false);
  const [periodEnd, setPeriodEnd] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/billing/status/");
        setCurrentPlan(response.data.plan);
        setCancelAtEnd(response.data.cancel_at_period_end);
        setPeriodEnd(response.data.current_period_end);
      } catch {
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Portal handler:
  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await api.get("/billing/portal/");
      window.location.href = response.data.portal_url;
    } catch (err) {
      setError("Failed to open subscription portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setError("");

    if (planId === currentPlan) {
      navigate("/chat");
      return;
    }

    if (planId === "free") {
      navigate("/chat");
      return;
    }

    if (planId === "max") {
      window.location.href = "mailto:hello@clarix.ai";
      return;
    }

    try {
      setLoadingPlan(planId);
      const billing = yearly ? "yearly" : "monthly";
      const res = await api.get(
        `/billing/checkout/?plan=${planId}&billing=${billing}`,
      );
      window.location.href = res.data.checkout_url;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        "Something went wrong. Please check your internet connectivity and try again.";
      setError(msg);
    } finally {
      setLoadingPlan(null);
    }
  };

  const proPrice = yearly ? "$9" : "$12";
  const maxPrice = yearly ? "$29" : "$39";
  const billingLabel = yearly
    ? "USD / month · billed yearly"
    : "USD / month · billed monthly";

  return (
    <div id="priceLayout">
      <div className="price-page-base">
        {/* ── HEADER ── */}
        <header className="pricing-page-header">
          <div className="pricing-page-back-action">
            <button
              className="back-button"
              type="button"
              aria-label="Back"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Billing toggle */}
          <div className="billing-toggle-wrapper">
            <div className="billing-toggle">
              <button
                className={`toggle-option ${!yearly ? "active" : ""}`}
                onClick={() => setYearly(false)}
              >
                Monthly
              </button>
              <button
                className={`toggle-option ${yearly ? "active" : ""}`}
                onClick={() => setYearly(true)}
              >
                Yearly
                <span className="toggle-save-badge">Save 25%</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── ERROR ── */}
        {error && (
          <Message type="error" text={error} onClose={() => setError("")} />
        )}

        {cancelAtEnd && periodEnd && (
          <div className="pricing-cancel-banner">
            Your subscription is cancelled. You'll Keep pro access until{""}
            <strong>
              {new Date(periodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
            .{""}
            <button
              className="pricing-link-btn"
              onClick={handleManageSubscription}
            >
              Reactivate
            </button>
          </div>
        )}

        <div className="pricing-content-main">
          <h1 className="pricing-title">Plans that grow with you</h1>
          <div style={{ marginTop: "24px" }} />

          {/* ── CARDS ── */}
          <div className="pricing-cards-base">
            {/* FREE */}
            <div className="price-card">
              <div className="price-card-inner">
                <div className="price-card-inner-content">
                  <div className="price-card-inner-inner">
                    <div className="price-card-align">
                      <div className="price-card-logo-container">
                        <Zap size={64} strokeWidth={1} />
                      </div>
                      <div className="ripple-container" />
                    </div>
                    <div className="price-card-content-block">
                      <div className="price-block">
                        <h3 className="price-card-title">Free</h3>
                        <p className="price-card-title-sub">Introduce Clarix</p>
                        <div className="price-container">
                          <span className="price">$0</span>
                        </div>
                      </div>
                      <div className="flex-grow" />
                      <button
                        type="button"
                        className="price-card-action-btn"
                        onClick={() => handleSubscribe("free")}
                      >
                        {currentPlan === "free"
                          ? "Current Plan"
                          : "Use Clarix for free"}
                      </button>
                    </div>
                    <div className="price-card-details">
                      <ul>
                        <li>
                          <Check size={16} /> 6 AI messages per hour
                        </li>
                        <li>
                          <Check size={16} /> Gemini 2.0 Flash access
                        </li>
                        <li>
                          <Check size={16} /> Basic chat history
                        </li>
                        <li>
                          <Check size={16} /> Web & desktop access
                        </li>
                        <li>
                          <Check size={16} /> Community support
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRO */}
            <div className="price-card price-card--featured">
              <div className="price-card-inner">
                <div className="price-card-inner-content">
                  <div className="price-card-inner-inner">
                    <div className="price-card-align">
                      <div className="price-card-logo-container">
                        <Sparkles size={64} strokeWidth={1} />
                      </div>
                      <div className="ripple-container" />
                    </div>
                    <div className="price-card-content-block">
                      <div className="price-block">
                        <h3 className="price-card-title">Pro</h3>
                        <p className="price-card-title-sub">
                          Research, code, and organize
                        </p>
                        <div className="price-container">
                          <span className="price">{proPrice}</span>
                          <span className="price-billing-info">
                            <span>{billingLabel}</span>
                            {yearly && (
                              <span className="price-original">was $12/mo</span>
                            )}
                          </span>
                        </div>
                        <div className="trial-badge">7-day free trial</div>
                      </div>
                      <div className="flex-grow" />
                      {currentPlan === "pro" && (
                        <button
                          type="button"
                          className="price-card-action-btn-manage"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading ? (
                            <>
                              <Loader2 size={15} className="spin" /> Loading...
                            </>
                          ) : (
                            "Manage subscription"
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        className="price-card-action-btn-sec"
                        onClick={() => handleSubscribe("pro")}
                        disabled={
                          loadingPlan === "pro" || currentPlan === "pro"
                        }
                      >
                        {currentPlan === "pro" ? (
                          <>
                          Current plan <CheckCircle size={15} />
                          </>
                        ) : loadingPlan === "pro" ? (
                          <>
                            <Loader2 size={15} className="spin" />{" "}
                            Redirecting...
                          </>
                        ) : (
                          <>
                            Get pro plan <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </div>
                    <div className="price-card-details">
                      <ul>
                        <li>
                          <Check size={16} /> Unlimited AI messages
                        </li>
                        <li>
                          <Check size={16} /> Gemini 2.0 Flash + Groq Llama
                        </li>
                        <li>
                          <Check size={16} /> Image uploads & vision
                        </li>
                        <li>
                          <Check size={16} /> Full chat history & export
                        </li>
                        <li>
                          <Check size={16} /> Priority response speed
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAX */}
            <div className="price-card">
              <div className="price-card-inner">
                <div className="price-card-inner-content">
                  <div className="price-card-inner-inner">
                    <div className="price-card-align">
                      <div className="price-card-logo-container">
                        <Crown size={64} strokeWidth={1} />
                      </div>
                      <div className="ripple-container" />
                    </div>
                    <div className="price-card-content-block">
                      <div className="price-block">
                        <h3 className="price-card-title">Max</h3>
                        <p className="price-card-title-sub">
                          Higher limits, priority access
                        </p>
                        <div className="price-container">
                          <span className="price">{maxPrice}</span>
                          <span className="price-billing-info">
                            <span>{billingLabel}</span>
                            {yearly && (
                              <span className="price-original">was $39/mo</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow" />
                      <button
                        type="button"
                        className="price-card-action-btn-sec"
                        onClick={() => handleSubscribe("max")}
                        disabled={loadingPlan === "max"}
                      >
                        Contact sales
                      </button>
                    </div>
                    <div className="price-card-details">
                      <ul>
                        <li>
                          <Check size={16} /> Everything in Pro
                        </li>
                        <li>
                          <Check size={16} /> Team workspace (up to 10)
                        </li>
                        <li>
                          <Check size={16} /> Admin dashboard
                        </li>
                        <li>
                          <Check size={16} /> Custom rate limits
                        </li>
                        <li>
                          <Check size={16} /> SSO & SAML auth
                        </li>
                        <li>
                          <Check size={16} /> Dedicated support + SLA
                        </li>
                        <li>
                          <Check size={16} /> On-premise option
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="pricing-page-user-info">
            <div className="user-info-block">
              <p>
                Start building with Clarix today —{" "}
                <button
                  className="pricing-link-btn"
                  onClick={() => handleSubscribe("free")}
                >
                  Get started free →
                </button>
              </p>
              <small className="pricing-footer-note">
                No credit card required · Cancel anytime · Secure payments via
                Stripe
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
