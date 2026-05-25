import { useState, useEffect, useRef } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Chat from "./Chat";
import api from "../services/api";
import {
  ArrowLeft,
  EllipsisVertical,
  Star,
  Plus,
  ChevronDown,
  ArrowUp,
  Loader2,
  Trash2,
  Archive,
  Pencil,
  X,
  MessageSquare,
  Check,
} from "lucide-react";

import {
  getProject,
  updateProject,
  deleteProject,
  archiveProject,
  addConversationToProject,
  removeConversationFromProject,
} from "../services/projects";
import "../styles/ProjectDetails.css";

function AddConversationModal({ projectId, existingIds, onAdd, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(null);
  const [added, setAdded] = useState(new Set());

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(
          "/chat/conversations/?page_size=100&ordering=-updated_at",
        );
        const all = res.data.results || res.data;
        setConversations(all.filter((c) => !existingIds.has(c.id)));
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [existingIds]);

  const filtered = conversations.filter((c) =>
    (c.title || "New Chat").toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = async (conv) => {
    setAdding(conv.id);
    try {
      await addConversationToProject(projectId, conv.id);
      setAdded((prev) => new Set([...prev, conv.id]));
      onAdd(conv);
    } catch (err) {
      console.log(err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <div className="pro-modal-backdrop" onClick={onClose} />
      <div className="pro-modal">
        <div className="pro-modal-header">
          <h2>Add existing conversation</h2>
          <button className="pro-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="pro-modal-body">
          <input
            className="pro-modal-input"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="proj-conv-list">
            {loading && (
              <div className="proj-loading-sm">
                <Loader2 size={16} className="spin" color="#73726c" />
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="proj-empty-sm">No conversations available</p>
            )}
            {filtered.map((conv) => (
              <div key={conv.id} className="proj-conv-item">
                <div className="proj-conv-info">
                  <MessageSquare size={13} color="#73726c" />
                  <span>{conv.title || "New Chat"}</span>
                </div>
                <button
                  className={`proj-conv-add-btn ${added.has(conv.id) ? "proj-conv-add-btn--done" : ""}`}
                  onClick={() => !added.has(conv.id) && handleAdd(conv)}
                  disabled={adding === conv.id || added.has(conv.id)}
                >
                  {adding === conv.id ? (
                    <Loader2 size={12} className="spin" />
                  ) : added.has(conv.id) ? (
                    <Check size={12} />
                  ) : (
                    <Plus size={12} />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function OptionsMenu({ project, onRename, onArchive, onDelete, onClose }) {
  return (
    <>
      <div className="pro-options-backdrop" onClick={onClose} />
      <div className="pro-options-menu">
        <button
          className="pro-options-item"
          onClick={() => {
            onRename();
            onClose();
          }}
        >
          <Pencil size={13} /> Rename
        </button>
        <button
          className="pro-options-item"
          onClick={() => {
            onArchive();
            onClose();
          }}
        >
          <Archive size={13} />
          {project.is_archived ? "Unarchive" : "Archive"}
        </button>
        <div className="pro-options-divider" />
        <button
          className="pro-options-item pro-options-item--danger"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 size={13} /> Delete project
        </button>
      </div>
    </>
  );
}

function RenameInput({ value, onSave, onCancel }) {
  const [name, setName] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSave(name.trim());
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="proj-rename-form">
        <input
          ref={inputRef}
          className="proj-rename-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className="proj-rename-save">
          <Check size={14} />
        </button>
        <button type="button" className="proj-rename-cancel" onClick={onCancel}>
          <X size={14} />
        </button>
      </form>
    </>
  );
}

function ConversationsPanel({
  conversations,
  activeConvId,
  onSelect,
  onRemove,
  removing,
  onAddExisting,
}) {
  return (
    <>
      <div className="pro-right-box">
        <div className="proj-panel-header">
          <span className="proj-panel-title">Conversations</span>
          <div className="proj-panel-actions">
            <button
              className="proj-panel-btn"
              onClick={onAddExisting}
              title="Add existing conversation"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
        </div>

        <div className="proj-panel-list">
          {conversations.length === 0 ? (
            <div className="proj-panel-empty">
              <MessageSquare size={22} strokeWidth={1} color="#d1d6e0" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <ul>
              {conversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    className={`proj-panel-conv ${activeConvId === conv.id ? "proj-panel-conv--active" : ""}`}
                    onClick={() => onSelect(conv.id)}
                  >
                    <MessageSquare
                      size={13}
                      style={{ flexShrink: 0, opacity: 0.5 }}
                    />
                    <span className="proj-panel-conv-title">
                      {conv.title || "New Chat"}
                    </span>
                    <button
                      className="proj-panel-conv-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(conv.id);
                      }}
                      disabled={removing === conv.id}
                      title="Remove from project"
                    >
                      {removing === conv.id ? (
                        <Loader2 size={11} className="spin" />
                      ) : (
                        <X size={11} />
                      )}
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default function ProjectDetailsAndMessage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const refreshSidebarRef = useRef(null);

  const [project, setProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeConvId = searchParams.get("c") || null;
  const setActiveConvId = (id) => {
    if (id) setSearchParams({ c: id });
    else setSearchParams({});
  };

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const [starred, setStarred] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getProject(projectId);
        setProject(res.data);
        setConversations(res.data.conversations || []);
      } catch {
        setError("Project not found. Redirecting back...");
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId, navigate]);

  // Start new chat and add to project
  const handleNewChat = async () => {
    try {
      setNewChatLoading(true);
      const res = await api.post("/chat/conversations/");
      const newConv = res.data;
      await addConversationToProject(projectId, newConv.id);
      setConversations((prev) => [newConv, ...prev]);
      navigate(`/chat?c=${newConv.id}`);
    } catch {
      setError("Something went wrong. Failed to create chat.");
    } finally {
      setNewChatLoading(false);
    }
  };

  const handleSendFromTextarea = async () => {
    if (!input.trim()) return;
    try {
      setNewChatLoading(true);
      const res = await api.post("/chat/conversations/");
      const newConv = res.data;
      await addConversationToProject(projectId, newConv.id);
      setConversations((prev) => [newConv, ...prev]);

      sessionStorage.setItem("pending_message", input.trim());
      setInput("");
      navigate(`/chat?c=${newConv.id}`);
    } catch (err) {
      console.log(err);
      setError("Failed to create chat");
    } finally {
      setNewChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendFromTextarea();
    }
  };

  const handleRemove = async (convId) => {
    try {
      setRemoving(convId);
      await removeConversationFromProject(projectId, convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));

      if (activeConvId === convId) setActiveConvId(null);
    } catch (err) {
      console.log(err);
      setError("Failed to remove conversation.");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddExisting = (conv) => {
    setConversations((prev) => {
      if (prev.find((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  };

  const handleRename = async (newName) => {
    try {
      const res = await updateProject(projectId, { name: newName });
      setProject((prev) => ({ ...prev, name: res.data.name }));
      setIsRenaming(false);
    } catch (err) {
      console.log(err);
      setError("Failed to rename project.");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveProject(projectId);
      navigate("/projects");
    } catch (err) {
      console.log(err);
      setError("Failed yo archive project");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(`Delete "${project?.name}"? Conversations will be kept.`)
    )
      return;
    try {
      await deleteProject(projectId);
      navigate("/projects");
    } catch (err) {
      console.log(err);
      setError("Failed to delete project");
    }
  };

  const existingIds = new Set(conversations.map((c) => c.id));

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Loader2 size={24} className="spin" color="#73726c" />
      </div>
    );

  return (
    <>
      <Sidebar
        onNewChat={() => setActiveConvId(null)}
        onSelectConversation={setActiveConvId}
        activeConversationId={activeConvId}
        refreshSidebarRef={refreshSidebarRef}
      />

      {/* Add existing modal */}
      {showAddModal && (
        <AddConversationModal
          projectId={projectId}
          existingIds={existingIds}
          onAdd={handleAddExisting}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <div id="projectMain">
        <div>
          {/* ── Header ── */}
          <header className="project-headerV2 project-headerV2-min768">
            <div className="pro-back pro-back-min768 pro-back-min1024">
              <Link to="/projects" className="pro-back-link">
                <ArrowLeft size={16} />
                All projects
              </Link>
            </div>
          </header>

          {/* ── Main content ── */}
          <main className="pro-details-main pro-details-min768 pro-details-min1280">
            {/* ── Left column ── */}
            <div className="pro-details-layout">
              {/* Project name + actions */}
              <div style={{ marginBottom: "12px" }}>
                <div className="pro-detail-name">
                  {/* Name or rename input */}
                  {isRenaming ? (
                    <RenameInput
                      value={project?.name || ""}
                      onSave={handleRename}
                      onCancel={() => setIsRenaming(false)}
                    />
                  ) : (
                    <h1>
                      {project?.icon && (
                        <span style={{ marginRight: 8 }}>{project?.icon}</span>
                      )}
                      {project?.name}
                    </h1>
                  )}

                  <div
                    style={{
                      display: "flex",
                      height: "32px",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  />

                  {/* Actions */}
                  <div className="pro-details-actions">
                    {/* Options menu */}
                    <div
                      style={{
                        fontSize: "var(--text-md)",
                        color: "var(--color-text-primary)",
                        position: "relative",
                      }}
                    >
                      <button
                        type="button"
                        className="pro-detail-action"
                        onClick={() => setOptionsOpen(!optionsOpen)}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <EllipsisVertical className="pro-detail-options-icon" />
                        </span>
                      </button>
                      {optionsOpen && (
                        <OptionsMenu
                          project={project}
                          onRename={() => setIsRenaming(true)}
                          onArchive={handleArchive}
                          onDelete={handleDelete}
                          onClose={() => setOptionsOpen(false)}
                        />
                      )}
                    </div>

                    {/* Star */}
                    <div style={{ width: "fit-content" }}>
                      <button
                        type="button"
                        className="pro-detail-action"
                        onClick={() => setStarred((v) => !v)}
                        title={starred ? "Unstar" : "Star project"}
                      >
                        <Star
                          className="pro-detail-options-icon"
                          fill={starred ? "currentColor" : "none"}
                          color={starred ? "#f59e0b" : "currentColor"}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: "var(--text-md)",
                    color: "var(--color-text-muted)",
                    fontWeight: "430",
                    lineHeight: "1.4",
                  }}
                >
                  {project?.description}
                </div>

                {/* Meta */}
                <div className="details-spacing">
                  <span>
                    {conversations.length} conversation
                    {conversations.length !== 1 ? "s" : ""}
                  </span>
                  {project?.updated_at && (
                    <span>
                      Updated{" "}
                      {new Date(project.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="proj-error-banner">
                  {error}
                  <button onClick={() => setError("")}>
                    <X size={13} />
                  </button>
                </div>
              )}

              <>
                <fieldset className="fieldSet">
                  <div style={{ position: "relative" }}>
                    <div className="pro-chat-box pro-chat-box-min768 pro-chat-width">
                      <div
                        style={{
                          margin: "14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div className="pro-box-font">
                          <div className="pro-box-inner">
                            <textarea
                              ref={textareaRef}
                              className="proj-textarea"
                              placeholder="How can I help you today?"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              rows={1}
                            />
                          </div>
                        </div>
                        <div className="pro-box-footer">
                          <div className="pro-footer-inner">
                            <div>
                              <button
                                type="button"
                                className="pro-footer-action-btn"
                                onClick={() => setShowAddModal(true)}
                                aria-label="Add conversation"
                                title="Add existing conversation"
                              >
                                <div
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Plus
                                    size={20}
                                    style={{ flexShrink: "0" }}
                                    color="var(--color-text-muted)"
                                  />
                                </div>
                              </button>
                            </div>
                            <div className="pro-footer-spacing" />
                          </div>
                          <div className="pro-footer-right">
                            <span style={{ display: "inline-flex" }}>
                              <div className="pro-model-selection">
                                <button type="button" className="pro-modal-btn">
                                  <div className="model-text">
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          whiteSpace: "nowrap",
                                          userSelect: "none",
                                        }}
                                      >
                                        Gemini
                                      </div>
                                    </div>
                                    <span
                                      style={{
                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      Flash
                                    </span>
                                  </div>
                                  <div className="modal-chevron-icon">
                                    <ChevronDown size={16} />
                                  </div>
                                </button>
                              </div>
                            </span>
                          </div>
                          <div className="pro-chat-send">
                            <button
                              type="button"
                              className="pro-send-btn"
                              aria-label="Send"
                              onClick={handleSendFromTextarea}
                              disabled={!input.trim() || newChatLoading}
                              style={{ opacity: input.trim() ? 1 : 0.4 }}
                            >
                              {newChatLoading ? (
                                <Loader2
                                  size={14}
                                  className="spin"
                                  color="#fff"
                                />
                              ) : (
                                <ArrowUp size={16} color="#ffffff" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>

                {/* Tip */}
                <div className="pro-organize-tip">
                  <div className="pro-organize-box">
                    <h3>
                      Start a chat to keep conversations organized and re-use
                      project knowledge.
                    </h3>
                  </div>
                </div>
              </>
            </div>

            {/* ── Right column — conversations panel ── */}
            <div className="pro-right-block">
              <div style={{ position: "relative" }}>
                <ConversationsPanel
                  conversations={conversations}
                  activeConvId={activeConvId}
                  onSelect={(convId) => navigate(`/chat?c=${convId}`)}
                  onRemove={handleRemove}
                  removing={removing}
                  onAddExisting={() => setShowAddModal(true)}
                  onNewChat={handleNewChat}
                  newChatLoading={newChatLoading}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
