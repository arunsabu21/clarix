import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { applyTheme } from "../utils/theme";
import {
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Download,
  Shield,
  CreditCard,
  User,
  Settings,
} from "lucide-react";
import { useAuthGlobal } from "../context/AuthContext";
import { requestNotificationPermission } from "../utils/notifications";
import DeleteAccountModal from "../components/common/AccountDeletionModal";
import api from "../services/api";
import "../styles/Settings.css";
import "../styles/SettingsV2.css";

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      className={`toggle-switch ${checked ? "toggle-switch--on" : ""} ${disabled ? "toggle-switch--disabled" : ""}`}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function SaveButton({ loading, saved, onClick }) {
  return (
    <button
      type="button"
      className={`save-btn ${saved ? "save-btn--saved" : ""}`}
      onClick={onClick}
      disabled={loading || saved}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="spin" /> Saving...
        </>
      ) : saved ? (
        <>
          <Check size={14} /> Saved
        </>
      ) : (
        "Save changes"
      )}
    </button>
  );
}

function SectionAlert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`section-alert section-alert--${type}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose}></button>}
    </div>
  );
}

// General Tab
const WORK_TYPES = [
  { value: "developer", label: "Developer / Engineer" },
  { value: "designer", label: "Designer" },
  { value: "student", label: "Student" },
  { value: "researcher", label: "Researcher" },
  { value: "writer", label: "Writer / Content Creator" },
  { value: "marketer", label: "Marketer" },
  { value: "manager", label: "Manager" },
  { value: "entrepreneur", label: "Entrepreneur" },
  { value: "other", label: "Other" },
];

const PREFERENCES = [
  {
    value: "beginner",
    label: "Beginner",
    desc: "Explain concepts simply, avoid jargon",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "Assume basic knowledge, balanced depth",
  },
  {
    value: "expert",
    label: "Expert",
    desc: "Use technical language, skip basics",
  },
];

const APPEARANCE_MODES = [
  {
    value: "light",
    label: "Light",
    preview: (
      <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
        <rect width="64" height="44" rx="6" fill="#ffffff" />
        {/* sidebar */}
        <rect x="0" y="0" width="16" height="44" rx="6" fill="#f1f1f1" />
        <rect x="3" y="8" width="10" height="2.5" rx="1" fill="#d1d1d1" />
        <rect x="3" y="13" width="8" height="2" rx="1" fill="#e1e1e1" />
        <rect x="3" y="17" width="9" height="2" rx="1" fill="#e1e1e1" />
        {/* chat */}
        <rect x="20" y="8" width="24" height="5" rx="2" fill="#f1f1f1" />
        <rect x="20" y="16" width="30" height="4" rx="2" fill="#f1f1f1" />
        <rect x="20" y="22" width="20" height="4" rx="2" fill="#f1f1f1" />
        {/* input */}
        <rect
          x="20"
          y="34"
          width="36"
          height="7"
          rx="3"
          fill="#f5f5f5"
          stroke="#e8e8e8"
          strokeWidth="0.8"
        />
      </svg>
    ),
  },
  {
    value: "auto",
    label: "Auto",
    preview: (
      <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
        {/* half light half dark */}
        <rect width="64" height="44" rx="6" fill="#ffffff" />
        <clipPath id="left-half">
          <rect width="32" height="44" rx="6" />
        </clipPath>
        <rect
          width="32"
          height="44"
          fill="#ffffff"
          clipPath="url(#left-half)"
        />
        <rect x="32" width="32" height="44" rx="6" fill="#1a1a1a" />
        {/* left sidebar */}
        <rect x="0" y="0" width="14" height="44" fill="#f1f1f1" />
        <rect x="2" y="8" width="9" height="2" rx="1" fill="#d1d1d1" />
        <rect x="2" y="13" width="7" height="1.5" rx="1" fill="#e1e1e1" />
        {/* right sidebar dark */}
        <rect x="32" y="0" width="14" height="44" fill="#111" />
        <rect x="34" y="8" width="9" height="2" rx="1" fill="#333" />
        <rect x="34" y="13" width="7" height="1.5" rx="1" fill="#333" />
        {/* divider */}
        <line x1="32" y1="0" x2="32" y2="44" stroke="#ccc" strokeWidth="0.8" />
        {/* auto label */}
        <rect x="22" y="19" width="20" height="6" rx="3" fill="#0d0d0d" />
        <text
          x="32"
          y="23.5"
          textAnchor="middle"
          fontSize="4"
          fill="#fff"
          fontFamily="sans-serif"
        >
          AUTO
        </text>
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    preview: (
      <svg width="64" height="44" viewBox="0 0 64 44" fill="none">
        <rect
          width="64"
          height="44"
          rx="6"
          fill="#1a1a1a"
          stroke="#333"
          strokeWidth="1"
        />
        {/* sidebar */}
        <rect x="0" y="0" width="16" height="44" rx="6" fill="#111" />
        <rect x="3" y="8" width="10" height="2.5" rx="1" fill="#333" />
        <rect x="3" y="13" width="8" height="2" rx="1" fill="#2a2a2a" />
        <rect x="3" y="17" width="9" height="2" rx="1" fill="#2a2a2a" />
        {/* chat bubbles */}
        <rect x="20" y="8" width="24" height="5" rx="2" fill="#2a2a2a" />
        <rect x="20" y="16" width="30" height="4" rx="2" fill="#2a2a2a" />
        <rect x="20" y="22" width="20" height="4" rx="2" fill="#2a2a2a" />
        {/* input */}
        <rect
          x="20"
          y="34"
          width="36"
          height="7"
          rx="3"
          fill="#222"
          stroke="#333"
          strokeWidth="0.8"
        />
      </svg>
    ),
  },
];

function GeneralTab({ user }) {
  const [form, setForm] = useState({
    ai_name: "",
    work_type: "other",
    professional_preference: "intermediate",
    notify_response_complete: true,
    notify_product_updates: true,
    notify_billing_alerts: true,
    appearance: "auto",
  });
  const [workDropOpen, setWorkDropOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/settings/general/");
        setForm((f) => ({ ...f, ...res.data }));

        localStorage.setItem(
          "notify_response_complete",
          String(res.data.notify_response_complete)
        );
        
        applyTheme(res.data.appearance || "auto");
      } catch {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      await api.patch("/settings/general/", {
        ai_name: form.ai_name,
        work_type: form.work_type,
        professional_preference: form.professional_preference,
        appearance: form.appearance,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = async (key, val) => {
    setForm(f => ({...f, [key]: val}));

    try {
      await api.patch("/settings/general/", { [key]: val });
      if (key === "notify_response_complete");
      localStorage.setItem("notify_response_complete", String(val));
    } catch {
      setForm(f => ({ ...f, [key]: val }));
      setError("Failed to save. Please try again.");
    }
  }

  const getInitials = () => {
    if (user?.name)
      return user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    if (user?.email) return user.email[0].toUpperCase();
    return "?";
  };

  const selectedWork = WORK_TYPES.find((w) => w.value === form.work_type);

  if (loading)
    return (
      <div className="settings-loading">
        <Loader2 size={20} className="spin" />
      </div>
    );

  return (
    <main className="flex flex-col">
      <SectionAlert type="error" message={error} onClose={() => setError("")} />

      {/* Profile */}
      <section className="sec">
        <h2>Profile</h2>
        <div className="flex gap-5 flex-wrap">
          <div className="profile-details">
            <label>Full Name</label>
            <div className="flex gap-2">
              <div className="rel">
                <button type="button" className="profile-user-avatar">
                  <div className="avt-avt">
                    <div className="avt">{getInitials()}</div>
                  </div>
                </button>
              </div>
              <input
                type="text"
                className="profile-edit-input"
                value={user?.name || ""}
                disabled
                placeholder="Your full name"
                title="Update full name in Account settings"
              />
            </div>
            <small className="input-hint">
              Update your name in Account settings
            </small>
          </div>
          <div className="input-container">
            <label>
              What should Clarix call you?
              <span style={{ marginLeft: "4px", color: "#8d2525" }}>*</span>
            </label>
            <input
              type="text"
              className="profile-edit-input"
              placeholder="e.g. Alex, bro, boss"
              value={form.ai_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, ai_name: e.target.value }))
              }
              maxLength={50}
            />
            <small className="input-hint">
              Clarix will address you by this name in conversations
            </small>
          </div>
        </div>

        {/* Work type */}
        <div>
          <label className="input-label">What best describes your work?</label>
          <div className="select-wrapper">
            <button
              type="button"
              className="select-work-btn"
              onClick={() => setWorkDropOpen(!workDropOpen)}
            >
              <span className="text-flow">
                <span style={{ pointerEvents: "none" }}>
                  {selectedWork?.label || "Select..."}
                </span>
              </span>
              <div className="chevron-bottom">
                <ChevronDown
                  size={20}
                  style={{
                    flexShrink: 0,
                    transform: workDropOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
            </button>
            {workDropOpen && (
              <>
                <div
                  className="select-backdrop"
                  onClick={() => setWorkDropOpen(false)}
                />
                <div className="select-dropdown">
                  {WORK_TYPES.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      className={`select-option ${form.work_type === w.value ? "select-option--active" : ""}`}
                      onClick={() => {
                        setForm((f) => ({ ...f, work_type: w.value }));
                        setWorkDropOpen(false);
                      }}
                    >
                      {w.label}
                      {form.work_type === w.value && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Professional preference */}
        <div>
          <label className="input-label">AI response style</label>
          <small
            className="input-hint"
            style={{ display: "block", marginBottom: 12 }}
          >
            How technical should Clarix be when responding to you?
          </small>
          <div className="preference-grid">
            {PREFERENCES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`preference-card ${form.professional_preference === p.value ? "preference-card--active" : ""}`}
                onClick={() =>
                  setForm((f) => ({ ...f, professional_preference: p.value }))
                }
              >
                <span className="preference-name">{p.label}</span>
                <span className="preference-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="sec">
        <h2>Notifications</h2>
        {[
          {
            key: "notify_response_complete",
            label: "Response completions",
            desc: "Get notified when Clarix has finished a response. Most useful for long-running tasks.",
            onChange: async (val) => {
              if (val) {
                const granted = await requestNotificationPermission();
                if (!granted) {
                  setError("Browser notifications blocked. Please enable them in browser settings.");
                  return;
                }
              }
              handleToggleChange("notify_response_complete", val);
            },
          },
          {
            key: "notify_product_updates",
            label: "Product updates",
            desc: "Receive emails about new features, improvements, and announcements from Clarix.",
            onChange: (val) => handleToggleChange("notify_product_updates", val),
          },
          {
            key: "notify_billing_alerts",
            label: "Billing alerts",
            desc: "Receive notifications about payments, subscription changes, and invoices.",
            onChange: (val) => handleToggleChange("notify_billing_alerts", val),
          },
        ].map((item) => (
          <div key={item.key} className="allow-notify-container">
            <div className="allow-notify">
              <p>{item.label}</p>
              <p style={{ color: "#73726c" }}>{item.desc}</p>
            </div>
            <label style={{ cursor: "pointer" }}>
              <Toggle
                checked={form[item.key]}
                onChange={item.onChange}
              />
            </label>
          </div>
        ))}
      </section>

      {/* Appearance */}
      <section className="sec">
        <h2>Appearance</h2>
        <div>
          <label className="input-label">Color mode</label>
          <div className="appearance-grid">
            {APPEARANCE_MODES.map((mode) => (
              <div key={mode.value} className="appearance-item">
                <button
                  type="button"
                  className={`appearance-btn ${
                    form.appearance === mode.value
                      ? "appearance-btn--active"
                      : ""
                  }`}
                  onClick={() => {
                    setForm((f) => ({ ...f, appearance: mode.value }));
                    applyTheme(mode.value);
                  }}
                >
                  <div className="appearance-preview">{mode.preview}</div>

                  {form.appearance === mode.value && (
                    <div className="appearance-check">
                      <Check size={11} />
                    </div>
                  )}
                </button>

                <span className="appearance-span">{mode.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="settings-save-row">
        <SaveButton loading={saving} saved={saved} onClick={handleSave} />
      </div>
    </main>
  );
}

// Account Tab
function AccountTab({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuthGlobal();
  const [fullName, setFullName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      await api.patch("/settings/account/", { full_name: fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setDeleteError("");
      await api.post("/settings/account/delete/", {
        confirmation: deleteInput,
      });
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(
        err?.response?.data?.confirmation?.[0] ||
          err?.response?.data?.detail ||
          "Failed to delete account.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = () => {
    if (user?.name)
      return user.name
        .split(" ")
        .map((w) => w[0])
        .join("".toUpperCase().slice(0, 2));
    if (user.email) return user.email[0].toUpperCase();
  };

  return (
    <main className="flex flex-col">
      <SectionAlert type="error" message={error} onClose={() => setError("")} />

      {/* Profile */}
      <section className="sec">
        <h2>Account</h2>
        <div className="account-avatar-row">
          <div className="avt-lg">{getInitials()}</div>
          <div>
            <p className="account-name">{user?.name || "User"}</p>
            <p className="account-email">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-5 flex-wrap">
          <div className="input-container" style={{ maxWidth: 400 }}>
            <label>Full name</label>
            <input
              type="text"
              className="profile-edit-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
            />
          </div>
          <div className="input-container" style={{ maxWidth: 400 }}>
            <label>Email address</label>
            <input
              type="email"
              className="profile-edit-input"
              value={user?.email || ""}
              disabled
              title="Email cannot be changed"
            />
          </div>
        </div>

        <div className="settings-save-row" style={{ margin: 0 }}>
          <SaveButton loading={saving} saved={saved} onClick={handleSave} />
        </div>
      </section>

      {/* Danger zone */}
      <section className="sec danger-section">
        <h2 style={{ color: "#dc2626" }}>Account Deletion</h2>
        <div className="danger-card">
          <div>
            <p className="danger-title">Delete account</p>
            <p className="danger-desc">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className="danger-btn"
            onClick={() => setShowDelete(!showDelete)}
          >
            <Trash2 size={14} /> Delete account
          </button>
        </div>

        {showDelete && (
            <DeleteAccountModal
              open={showDelete}
              onClose={() => setShowDelete(false)}
              deleteInput={deleteInput}
              setDeleteInput={setDeleteInput}
              deleting={deleting}
              deleteError={deleteError}
              setDeleteError={setDeleteError}
              handleDelete={handleDelete}
            />
        )}
      </section>
    </main>
  );
}

// Privacy Tab
function PrivacyTab() {
  const [form, setForm] = useState({
    allow_data_improvement: true,
    allow_analytics: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/settings/privacy/");
        setForm(res.data);
      } catch {
        setError("Failed to load privacy settings.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/settings/privacy/", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleClearConversations = async () => {
    try {
      setClearing(true);
      await api.delete("/settings/privacy/clear-conversations/");
      setCleared(true);
      setShowClearConfirm(false);
      setTimeout(() => setCleared(false), 3000);
    } catch (err) {
      setError("Failed to clear conversations", err);
    } finally {
      setClearing(false);
    }
  };

  if (loading)
    return (
      <div className="settings-loading">
        <Loader2 size={20} className="spin" />
      </div>
    );

  return (
    <main className="flex flex-col">
      <SectionAlert type="error" message={error} onClose={() => setError("")} />
      {cleared && (
        <SectionAlert
          type="success"
          message="All conversations cleared successfully."
        />
      )}

      {/* Data controls */}
      <section className="sec">
        <h2>Data & privacy</h2>
        {[
          {
            key: "allow_data_improvement",
            label: "Help improve Clarix",
            desc: "Allow your conversations to be used to improve Clarix AI models. Your data is anonymized and never shared with third parties.",
          },
          {
            key: "allow_analytics",
            label: "Usage analytics",
            desc: "Share anonymous usage data to help us understand how people use Clarix and improve the product.",
          },
        ].map((item) => (
          <div key={item.key} className="allow-notify-container">
            <div className="allow-notify">
              <p>{item.label}</p>
              <p style={{ color: "#73726c" }}>{item.desc}</p>
            </div>
            <Toggle
              checked={form[item.key]}
              onChange={(val) => setForm((f) => ({ ...f, [item.key]: val }))}
            />
          </div>
        ))}
        <div className="settings-save-row" style={{ margin: 0 }}>
          <SaveButton loading={saving} saved={saved} onClick={handleSave} />
        </div>
      </section>

      {/* Conversation data */}
      <section className="sec">
        <h2>Conversation data</h2>
        <div className="danger-card">
          <div>
            <p className="danger-title">Clear all conversations</p>
            <p className="danger-desc">
              Permanently delete all your conversations and messages. This
              cannot be undone.
            </p>
          </div>
          {!showClearConfirm ? (
            <button
              type="button"
              className="danger-btn"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 size={14} /> Clear all
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="danger-btn danger-btn--confirm"
                onClick={handleClearConversations}
                disabled={clearing}
              >
                {clearing ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <AlertTriangle size={14} />
                )}
                Confirm clear
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Legal */}
      <section className="sec">
        <h2>Legal</h2>
        <div className="legal-links">
          {[
            { label: "Privacy Policy", href: "#" },
            { label: "Terms of Service", href: "#" },
            { label: "Cookie Policy", href: "#" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="legal-link"
              target="_blank"
              rel="noreferrer"
            >
              {l.label} <ExternalLink size={12} />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

// Billing Tab
function BillingTab() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/settings/billing/");
        setBilling(res.data);
      } catch {
        setError("Failed to load billing info.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      const res = await api.get("/billing/portal/");
      window.location.href = res.data.portal_url;
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "_";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  if (loading)
    return (
      <div className="settings-loader">
        <Loader2 size={20} className="spin" />
      </div>
    );

  return (
    <main className="flex flex-col">
      <SectionAlert type="error" message={error} onClose={() => setError("")} />

      {/* Current plan */}
      <section className="sec">
        <h2>Current plan</h2>
        <div className="billing-plan-card">
          <div className="billing-plan-info">
            <div
              className={`billing-plan-badge billing-plan-badge--${billing?.plan}`}
            >
              {billing?.plan === "pro"
                ? "⚡ Pro"
                : billing?.plan === "max"
                  ? "👑 Max"
                  : "Free"}
            </div>
            <div>
              <p className="billing-plan-name">
                Clarix{" "}
                {billing?.plan?.charAt(0).toUpperCase() +
                  billing?.plan?.slice(1)}
              </p>
              {billing?.cancel_at_period_end ? (
                <p className="billing-plan-status billing-plan-status--cancel">
                  Cancels on {formatDate(billing?.current_period_end)}
                </p>
              ) : billing?.current_period_end ? (
                <p className="billing-plan-status">
                  Renews on {formatDate(billing?.current_period_end)}
                </p>
              ) : (
                <p className="billing-plan-status">No expiry</p>
              )}
            </div>
          </div>
          <div className="billing-plan-actions">
            {billing?.plan === "free" ? (
              <button
                type="button"
                className="billing-upgrade-btn"
                onClick={() => navigate("/upgrade")}
              >
                Upgrade to Pro
              </button>
            ) : (
              <button
                type="button"
                className="billing-manage-btn"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 size={14} className="spin" /> Loading...
                  </>
                ) : (
                  <>
                    <CreditCard size={14} /> Manage subscription
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {billing?.cancel_at_period_end && (
          <div className="billing-cancel-warning">
            <AlertTriangle size={15} />
            <p>
              Your subscription is scheduled to cancel. You'll keep{" "}
              {billing?.plan} access until{" "}
              <strong>{formatDate(billing?.current_period_end)}</strong>.{" "}
              <button className="billing-link-btn" onClick={handlePortal}>
                Reactivate →
              </button>
            </p>
          </div>
        )}
      </section>

      {/* Plan features */}
      {billing?.plan === "free" && (
        <section className="sec">
          <h2>Upgrade to Pro</h2>
          <div className="billing-upgrade-card">
            <ul className="billing-feature-list">
              {[
                "Unlimited AI messages",
                "Gemini 2.0 Flash + Groq Llama",
                "Image uploads & vision",
                "Full chat history",
                "Priority response speed",
                "API access",
              ].map((f) => (
                <li key={f}>
                  <Check size={14} color="#16a34a" /> {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="billing-upgrade-btn"
              onClick={() => navigate("/upgrade")}
            >
              View plans →
            </button>
          </div>
        </section>
      )}

      {/* Invoice history */}
      <section className="sec">
        <h2>Invoice history</h2>
        {billing?.invoices?.length === 0 ? (
          <p className="billing-empty">No invoices yet.</p>
        ) : (
          <div className="invoice-table">
            <div className="invoice-header">
              <span>Date</span>
              <span>Amount</span>
              <span>Status</span>
              <span>PDF</span>
            </div>
            {billing?.invoices?.map((inv) => (
              <div key={inv.id} className="invoice-row">
                <span>{formatDate(inv.date)}</span>
                <span>{formatAmount(inv.amount, inv.currency)}</span>
                <span
                  className={`invoice-status invoice-status--${inv.status}`}
                >
                  {inv.status}
                </span>
                <span>
                  {inv.pdf ? (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="invoice-pdf-btn"
                    >
                      <Download size={13} />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// Main Settings Page
const NAV_ITEMS = [
  { path: "/settings/general", label: "General", icon: Settings },
  { path: "/settings/account", label: "Account", icon: User },
  { path: "/settings/privacy", label: "Privacy", icon: Shield },
  { path: "/settings/billing", label: "Billing", icon: CreditCard },
];

export default function UserSettings() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthGlobal();

  // Redirect /settings → /settings/general
  useEffect(() => {
    if (location.pathname === "/settings") {
      navigate("/settings/general", { replace: true });
    }
  }, [location.pathname, navigate]);

  const activeTab = location.pathname.split("/settings/")[1] || "general";

  const renderTab = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab user={user} />;
      case "account":
        return <AccountTab user={user} />;
      case "privacy":
        return <PrivacyTab />;
      case "billing":
        return <BillingTab />;
      default:
        return <GeneralTab user={user} />;
    }
  };

  return (
    <div id="generalSettings">
      <div id="mount">
        <div className="settingsLayout">
          <div />
          <div className="layout-base">
            <div className="base">
              <div id="mainBlock">
                <header className="settings-header">
                  <div className="settings-header-title">
                    <h1>
                      <span className="text-flow">Settings</span>
                    </h1>
                  </div>
                </header>

                <main className="main-block">
                  <div className="grid-grid">
                    {/* NAV */}
                    <nav className="settings-nav">
                      <div className="settings-nav-inner">
                        <div className="settings-nav-items">
                          <ul className="settings-nav-items-list">
                            {NAV_ITEMS.map((item) => {
                              const Icon = item.icon;
                              const isActive =
                                location.pathname === item.path ||
                                location.pathname.startsWith(item.path + "/");
                              return (
                                <li key={item.path}>
                                  <Link
                                    to={item.path}
                                    className={`settings-item ${isActive ? "active" : ""}`}
                                  >
                                    <Icon
                                      size={15}
                                      style={{ flexShrink: 0, opacity: 0.7 }}
                                    />
                                    {item.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </nav>

                    {/* CONTENT */}
                    <div tabIndex="-1" className="outline-none">
                      {renderTab()}
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
