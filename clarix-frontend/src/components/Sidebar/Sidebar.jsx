import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CirclePlus,
  Search,
  MessageSquare,
  FolderOpen,
  PanelLeft,
  PanelRight,
  Trash2,
  Settings,
  LogOut,
  ChevronUp,
  Zap,
  Crown,
  Circle,
  CircleArrowUp,
  Globe,
} from "lucide-react";
import api from "../../services/api";
import ClarixLogo from "../common/ClarixLogo";
import { getConversations, deleteConversation } from "../../services/chat";
import { useAuthGlobal } from "../../context/AuthContext";
import LoginTooltip from "../Sidebar/LoginTooltip";
import "./Sidebar.css";

function Sidebar({
  onNewChat,
  onSelectConversation,
  activeConversationId,
  refreshSidebarRef,
}) {
  const { user, logout } = useAuthGlobal();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return false;
    const saved = localStorage.getItem("sidebar");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [conversations, setConversations] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const userMenuRef = useRef(null);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.get("/billing/status/");
        setPlan(res.data.plan);
      } catch {}
    };
    fetchPlan();
  }, []);

  // Persist sidebar state on desktop
  useEffect(() => {
    if (window.innerWidth > 768) {
      localStorage.setItem("sidebar", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Expose refresh fn via ref
  useEffect(() => {
    if (refreshSidebarRef) {
      refreshSidebarRef.current = fetchConversations;
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.results || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) onNewChat();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    fetchConversations();
  };

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

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile: floating open button — lives outside sidebar so it's always reachable */}
      {!isOpen && (
        <button
          className="sidebar__mobile-open"
          onClick={() => setIsOpen(true)}
          aria-label="Open sidebar"
        >
          <PanelRight size={17} />
        </button>
      )}

      <aside
        className={`sidebar ${isOpen ? "sidebar--open" : "sidebar--collapsed"}`}
      >
        {/* ── Header ── */}
        <div className="sidebar__header">
          {isOpen && (
            <div className="sidebar__logo">
              <ClarixLogo dark={false} size="sm" />
            </div>
          )}
          <button
            className="sidebar__toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <PanelLeft size={17} /> : <PanelRight size={17} />}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="sidebar__body">
          {/* New Chat */}
          <button className="sidebar__new-chat" onClick={handleNewChat}>
            <CirclePlus size={15} strokeWidth={2} />
            {isOpen && <span>New Chat</span>}
          </button>

          <div className="sidebar__nav">
            <button className="sidebar__nav-item">
              <Search size={18} strokeWidth={1.5} />
              {isOpen && <span>Search</span>}
            </button>
            <button className="sidebar__nav-item" onClick={() => navigate("/recents")}>
              <MessageSquare size={18} strokeWidth={1.5} />
              {isOpen && <span>Chats</span>}
            </button>
            <button className="sidebar__nav-item">
              <FolderOpen size={18} strokeWidth={1.5} />
              {isOpen && <span>Projects</span>}
            </button>
          </div>

          {/* Conversations */}
          {isOpen && (
            <div className="sidebar__recents">
              <p className="sidebar__section-label">Recents</p>

              {conversations.length === 0 ? (
                <p className="sidebar__empty">No conversations yet</p>
              ) : (
                <ul className="sidebar__conv-list" role="list">
                  {conversations.map((conv) => (
                    <li key={conv.id}>
                      <button
                        className={`sidebar__conv-item ${
                          activeConversationId === conv.id
                            ? "sidebar__conv-item--active"
                            : ""
                        }`}
                        onClick={() => {
                          onSelectConversation(conv.id);
                          if (window.innerWidth <= 768) setIsOpen(false);
                        }}
                        onMouseEnter={() => setHoveredId(conv.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        title={conv.title || "New Chat"}
                      >
                        <span className="sidebar__conv-title">
                          {conv.title?.trim() || "New Chat"}
                        </span>
                        <span
                          className={`sidebar__conv-delete ${
                            hoveredId === conv.id ||
                            activeConversationId === conv.id
                              ? "sidebar__conv-delete--visible"
                              : ""
                          }`}
                          role="button"
                          tabIndex={0}
                          aria-label="Delete conversation"
                          onClick={(e) => handleDelete(e, conv.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleDelete(e, conv.id)
                          }
                        >
                          <Trash2 size={12} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / User ── */}
        <div
          className={`sidebar__footer ${!isOpen ? "sidebar__footer--collapsed" : ""}`}
          ref={userMenuRef}
        >
          <LoginTooltip user={user} />
          {/* User popup menu */}
          {userMenuOpen && isOpen && (
            <div className="sidebar__user-menu" role="menu">
              <button
                onClick={() => navigate("/settings")}
                className="sidebar__user-menu-item"
                role="menuitem"
              >
                <Settings size={13} />
                Settings
              </button>
              <button
                onClick={() => navigate("/upgrade")}
                className="sidebar__user-menu-item"
                role="menuitem"
              >
                <CircleArrowUp size={13} />
                Upgrade Plan
              </button>
              <button className="sidebar__user-menu-item" role="menuitem">
                <Globe size={13} />
                Language
              </button>
              <div className="sidebar__user-menu-divider" />
              <button
                className="sidebar__user-menu-item sidebar__user-menu-item--danger"
                role="menuitem"
                onClick={logout}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}

          <button
            className="sidebar__user-info"
            onClick={() => isOpen && setUserMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
          >
            <div className="sidebar__avatar" aria-hidden="true">
              {getInitials()}
            </div>
            {isOpen && (
              <>
                <div className="sidebar__user-text">
                  <span className="sidebar__user-name">
                    {user?.name || "User"}
                  </span>
                  <span className="sidebar__user-email">{user?.email}</span>
                  <span className={`plan-badge plan-badge--${plan}`}>
                    {plan === "pro" ? (
                      <>
                        <Zap size={10} fill="currentColor" /> Pro
                      </>
                    ) : plan === "max" ? (
                      <>
                        <Crown size={10} fill="currentColor" /> Max
                      </>
                    ) : (
                      <>
                        <Circle size={10} /> Free
                      </>
                    )}
                  </span>
                </div>
                <ChevronUp
                  size={14}
                  className={`sidebar__chevron ${userMenuOpen ? "sidebar__chevron--up" : "sidebar__chevron--down"}`}
                />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
