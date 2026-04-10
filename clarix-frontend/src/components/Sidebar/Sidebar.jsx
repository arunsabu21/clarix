import { useState, useEffect } from "react";
import {
  SquarePen,
  Search,
  MessageSquare,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import ClarixLogo from "../common/ClarixLogo";
import { getConversations, deleteConversation } from "../../services/chat";
import { useAuthGlobal } from "../../context/AuthContext";
import "./Sidebar.css";

function Sidebar({
  onNewChat,
  onSelectConversation,
  activeConversationId,
  refreshSidebarRef,
}) {
  const { user, logout} = useAuthGlobal();
  const [isOpen, setIsOpen] = useState(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return false;
    const saved = localStorage.getItem("sidebar");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [conversations, setConversations] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth > 768) {
      localStorage.setItem("sidebar", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
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
    if (user?.name) return user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    if (user?.email) return user.email[0].toUpperCase();
    return "?";
  };

  useEffect(() => {
    if (refreshSidebarRef) {
      refreshSidebarRef.current = fetchConversations;
    }
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? "open" : "sidebar-collapsed"}`}>
      <div className="sidebar-header">
        {isOpen && <ClarixLogo dark={false} size="sm" />}
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>

      <div className={`sidebar-content ${!isOpen ? "collapsed" : ""}`}>
        <div className="menu">
          <p onClick={handleNewChat}>
            <SquarePen size={15} /> New Chat
          </p>
          <p>
            <Search size={15} /> Search
          </p>
          <p>
            <MessageSquare size={15} /> Chats
          </p>
          <p>
            <FolderOpen size={15} /> Projects
          </p>
        </div>

        <div className="recents">
          <p className="recents-title">Recents</p>
          {conversations.length === 0 && (
            <small className="no-conversations">No conversations yet</small>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${activeConversationId === conv.id ? "active" : ""}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <small>
                {conv.title && conv.title.trim() !== ""
                  ? conv.title
                  : "New Chat"}
              </small>
              <button
                className="delete-btn"
                onClick={(e) => handleDelete(e, conv.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className={`sidebar-user ${!isOpen ? "collapsed" : ""}`}>
        {userMenuOpen && (
          <div className="user-menu">
            <button className="user-menu-item">
              <Settings size={14} /> Settings
            </button>
            <div className="user-menu-divider" />
            <button className="user-menu-item danger" onClick={logout}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
        <div className="user-info" onClick={() => setUserMenuOpen(!userMenuOpen)}>
          <div className="avatar">{getInitials()}</div>

          <div className="user-text">
            <p className="user-name">{user?.name || "User"}</p>
            <small className="user-email">{user?.email}</small>
          </div>
          <div className="user-actions">
          <button className="icon-btn">
            <ChevronUp size={16} />
          </button>
        </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
