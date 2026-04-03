import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthGlobal } from "../context/AuthContext";
import ClarixLogo from "../components/ClarixLogo";
import Message from "../components/Alert";
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
      navigate("/");
    }
  };

  return (
    <>
      <Message
        type="error"
        text={globalError}
        onClose={() => setGlobalError("")}
      />

      <div className="login">
        <div className="login-content">
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
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleRequestOTP()}
                  className={`input ${fieldError ? "input--error" : ""}`}
                  autoFocus
                />

                {fieldError && (
                  <div className="login-error-message">
                    <span className="login-error-icon">!</span>
                    {fieldError}
                  </div>
                )}
              </div>

              <button className="btn-primary" onClick={handleRequestOTP}>
                {loading ? <span className="spinner" /> : "Continue with email"}
              </button>

              <p className="login-legal">
                By continuing, you agree to our <a href="#">Terms</a> and{" "}
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

              <button className="btn-primary" onClick={() => handleVerifyOTP()}>
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
    </>
  );
}

export default Login;
