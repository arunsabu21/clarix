import { useState, useEffect } from "react";
import {
  SquarePen,
  Search,
  MessageSquare,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import ClarixLogo from "../ClarixLogo";
import "./Sidebar.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return false;
    const saved = localStorage.getItem("sidebar");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (window.innerWidth > 768) {
      localStorage.setItem("sidebar", JSON.stringify(isOpen));
    }
  }, [isOpen]);

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
          <p>
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
          <small>Casual Greeting</small>
          <small>Need Some Help</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
