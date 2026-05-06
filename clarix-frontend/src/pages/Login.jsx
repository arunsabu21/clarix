import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthGlobal } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import ClarixLogo from "../components/common/ClarixLogo";
import Message from "../components/common/Alert";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuthGlobal();
  const {
    loading,
    globalError,
    setGlobalError,
    requestOtpHandler,
    verifyOtpHandler,
  } = useAuth();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [fieldError, setFieldError] = useState("");

  const otpRefs = useRef([]);

  const clearErrors = () => {
    setFieldError("");
    setGlobalError("");
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getOtpCode = () => otp.join("");

  useEffect(() => {
    if (step !== "otp") return;
    const code = getOtpCode();
    if (code.length === 6) {
      handleVerifyOTP(code);
    }
  }, [otp, step]);

  useEffect(() => {
    const phrases = [
      "How do I scale my backend?",
      "Explain this code to me...",
      "Write tests for my API",
      "Help me brainstorm features",
      "Review my pull request",
      "Summarize this document",
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout;

    const el = document.getElementById("rp-typewriter");
    if (!el) return;

    const type = () => {
      const current = phrases[phraseIndex];
      if (!deleting) {
        el.textContent = current.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          deleting = true;
          timeout = setTimeout(type, 1800);
          return;
        }
      } else {
        el.textContent = current.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      timeout = setTimeout(type, deleting ? 40 : 70);
    };

    timeout = setTimeout(type, 600);
    return () => clearTimeout(timeout);
  }, []);

  const handleRequestOTP = async () => {
    clearErrors();
    if (!isValidEmail(email)) {
      return setFieldError("Enter a valid email address");
    }
    const success = await requestOtpHandler(email);
    if (success) setStep("otp");
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(paste)) return;
    const newOtp = paste.split("");
    setOtp(newOtp);
    otpRefs.current[5]?.focus();
  };

  const handleVerifyOTP = async (externalCode) => {
    clearErrors();
    const code = externalCode || getOtpCode();
    if (code.length !== 6) {
      return setFieldError("Enter the full 6-digit code");
    }
    const data = await verifyOtpHandler(email, code);
    if (data) {
      sessionStorage.setItem("just_logged_in", "true");
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setUser(data.user);
      navigate("/chat");
    }
  };

  return (
    <>
      <Navbar />
      {/* ✅ only one Message component */}
      <Message
        type="warning"
        text={globalError}
        onClose={() => setGlobalError("")}
      />

      <div id="authLayout">
        <div className="auth-base">
          <div className="auth-base-base auth-base-base-width">
            <main className="auth-main">

              {/* ── Left: Form ── */}
              <div className="auth-main01">
                <div className="auth-main02">
                  <div>
                    <h2 className="auth-title auth-title-min500 auth-title-min350">
                      Think it. Ask it.
                      <br />
                      Done.
                    </h2>
                    <h3 className="auth-sub-title auth-sub-title-min768 auth-sub-title-gap">
                      Clarix is always one step ahead
                    </h3>

                    <div className="auth-box auth-box-min640">
                      <div className="auth-box-inner">
                        <div className="auth-box-inner01">

                          <div className="login-brand">
                            <ClarixLogo dark={false} size="md" />
                            <p className="brand-sub">
                              {step === "email" ? (
                                "Sign in to your account"
                              ) : (
                                <strong>{email}</strong>
                              )}
                            </p>
                          </div>

                          {/* EMAIL STEP */}
                          {step === "email" && (
                            <div className="login-step">
                              <div className="field">
                                <input
                                  id="email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={email}
                                  onChange={(e) => {
                                    setEmail(e.target.value);
                                    setFieldError("");
                                  }}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleRequestOTP()
                                  }
                                  className={`auth-input ${
                                    fieldError ? "input--error" : ""
                                  }`}
                                  autoFocus
                                />
                                {fieldError && (
                                  <div className="login-error-message">
                                    <span className="login-error-icon">!</span>
                                    {fieldError}
                                  </div>
                                )}
                              </div>

                              <button
                                className="auth-action-btn"
                                onClick={handleRequestOTP}
                              >
                                {loading ? <span className="spinner" /> : "Continue with email"}
                              </button>

                              <p className="login-legal">
                                By continuing, you agree to our{" "}
                                <a href="#">Terms</a> and{" "}
                                <a href="#">Privacy Policy</a>.
                              </p>
                            </div>
                          )}

                          {/* OTP STEP */}
                          {step === "otp" && (
                            <div className="login-step">
                              <div className="otp-row" onPaste={handlePaste}>
                                {otp.map((digit, i) => (
                                  <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    id={`otp-${i}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => {
                                      handleOtpChange(e.target.value, i);
                                      setFieldError("");
                                    }}
                                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                                    className={`otp-cell ${
                                      fieldError ? "otp-cell--error" : ""
                                    }`}
                                    autoFocus={i === 0}
                                  />
                                ))}
                              </div>

                              {fieldError && (
                                <div className="login-error-message">
                                  <span className="login-error-icon">!</span>
                                  {fieldError}
                                </div>
                              )}

                              <button
                                className="auth-action-btn"
                                onClick={() => handleVerifyOTP()}
                              >
                                {loading ? <span className="spinner" /> : "Sign in"}
                              </button>

                              <button
                                className="btn-ghost"
                                onClick={() => {
                                  setStep("email");
                                  setOtp(["", "", "", "", "", ""]);
                                  clearErrors();
                                }}
                              >
                                ← Back
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right: Decorative Panel ── */}
              <div className="auth-right-block auth-right-block-min1024">
                <div className="auth-right-box">
                  <div className="auth-right-box01">
                    <div className="auth-box-box">
                      <div className="auth-box-outer">

                        <div className="rp-header">
                          <div className="rp-badge">AI-Powered</div>
                          <h2 className="rp-title">Think without limits</h2>
                          <p className="rp-sub">
                            Your ideas deserve an intelligent partner
                          </p>
                        </div>

                        <div className="rp-typewriter-section">
                          <p className="rp-typewriter-label">Ask anything like</p>
                          <div className="rp-typewriter-box">
                            <span className="rp-typewriter-text" id="rp-typewriter"></span>
                            <span className="rp-cursor">|</span>
                          </div>
                        </div>

                        <div className="rp-tags">
                          {[
                            "Code Review", "Brainstorm", "Debug",
                            "Summarize", "Write Docs", "Explain",
                            "Plan", "Refactor",
                          ].map((tag, i) => (
                            <span key={i} className={`rp-tag rp-tag-${i + 1}`}>
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="rp-stats">
                          <div className="rp-stat">
                            <span className="rp-stat-num">2x</span>
                            <span className="rp-stat-label">Faster thinking</span>
                          </div>
                          <div className="rp-stat-divider"></div>
                          <div className="rp-stat">
                            <span className="rp-stat-num">∞</span>
                            <span className="rp-stat-label">Conversations</span>
                          </div>
                          <div className="rp-stat-divider"></div>
                          <div className="rp-stat">
                            <span className="rp-stat-num">1</span>
                            <span className="rp-stat-label">Click to start</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;