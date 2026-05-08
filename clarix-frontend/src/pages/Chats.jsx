import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CirclePlus,
  Search,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  X,
  MessageSquare,
} from "lucide-react";
import api from "../services/api";
import "../styles/SearchChats.css";
import DeleteAllChatPopUp from "../components/chat/DeleteAllChatModal";
import Sidebar from "../components/Sidebar/Sidebar";

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function SearchChats() {
  const navigate = useNavigate();

  // ── Data
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  // ── Search
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const searchRef = useRef(null);

  // ── Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  // ── Actions
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  /* ── Fetch ── */
  const fetchChats = useCallback(async (pg = 1, search = "") => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        page: pg,
        page_size: 20,
        ordering: "-updated_at",
      });
      if (search) params.set("search", search);

      const res = await api.get(`/chat/conversations/?${params}`);

      // Handle both paginated and non-paginated responses
      if (res.data.results) {
        setChats(res.data.results);
        setTotalPages(res.data.total_pages || 1);
        setCount(res.data.count || 0);
      } else {
        setChats(res.data);
        setTotalPages(1);
        setCount(res.data.length);
      }
    } catch {
      setError("Failed to load chats. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchChats(1, debouncedSearch);
  }, [debouncedSearch, fetchChats]);

  useEffect(() => {
    fetchChats(page, debouncedSearch);
  }, [page]);

  /* ── Selection helpers ── */
  const allSelected = chats.length > 0 && selected.size === chats.length;
  const someSelected = selected.size > 0;

  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelected(new Set());
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(chats.map((c) => c.id)));
    }
  };

  /* ── Delete single ── */
  const handleDeleteOne = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDeletingId(id);
      await api.delete(`/chat/conversations/${id}/`);
      setChats((prev) => prev.filter((c) => c.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setCount((c) => c - 1);
    } catch {
      setError("Failed to delete conversation.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Delete selected ── */
  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    try {
      setDeleting(true);
      await api.delete("/chat/conversations/delete-multiple/", {
        data: { ids: [...selected] },
      });
      setChats((prev) => prev.filter((c) => !selected.has(c.id)));
      setCount((c) => c - selected.size);
      setSelected(new Set());
      setSelectMode(false);
    } catch {
      setError("Failed to delete selected conversations.");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Delete all ── */
  const confirmDeleteAll = async () => {
    try {
      setDeleting(true);
      await api.delete("/chat/conversations/delete-all/");

      setChats([]);
      setCount(0);
      setSelected(new Set());
      setSelectMode(false);

      setShowDeleteAllModal(false);
    } catch {
      setError("Failed to delete all conversations.");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Navigate to chat ── */
  const handleChatClick = (id) => {
    if (selectMode) return;
    navigate(`/chat?c=${id}`);
  };

  return (
    <>
    <Sidebar />
      <div id="recentChats">
        <div className="recent-chats-layout">
          {/* ── Header ── */}
          <header className="recent-header recent-header-min768 recent-header-align">
            <div className="recent-title-block recent-title-padding-min1024 recent-title-padding-min768">
              <h1 className="recent-title">
                <span className="text-flow">Chats</span>
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Delete all */}
                {chats.length > 0 && !selectMode && (
                  <button
                    className="nc-btn del-all-chat"
                    onClick={() => setShowDeleteAllModal(true)}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 size={13} className="spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    Delete all
                  </button>
                )}

                {/* New chat */}
                <Link to="/chat" className="nc-btn">
                  <CirclePlus size={16} />
                  New chat
                </Link>
              </div>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="recent-main recent-main-min1024 recent-main-min768">
            {/* Error */}
            {error && (
              <div className="chats-error">
                <span>{error}</span>
                <button onClick={() => setError("")}>
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Search box */}
            <div role="search">
              <label htmlFor="sr" className="sr-label">
                Search your chats
              </label>
              <div className="sr-box">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <Search size={16} color="#73726c" />
                </div>
                <input
                  id="sr"
                  ref={searchRef}
                  type="text"
                  className="sr-input"
                  role="searchbox"
                  autoComplete="off"
                  placeholder="Search your chats..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    className="sr-clear"
                    onClick={() => {
                      setSearchInput("");
                      searchRef.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Select bar */}
            <div className="recent-select-all recent-select-all-margin">
              {/* Select all checkbox */}
              <div
                className={`recent-select-all-check ${!selectMode ? "opacity-none" : ""}`}
                onClick={selectMode ? toggleAll : undefined}
                style={{ cursor: selectMode ? "pointer" : "default" }}
              >
                <label className="check-label">
                  <div className="check-box">
                    {selectMode && allSelected && (
                      <CheckSquare size={14} color="#0d0d0d" />
                    )}
                    {selectMode && !allSelected && someSelected && (
                      <Square size={14} color="#73726c" />
                    )}
                  </div>
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                }}
              >
                {selectMode ? (
                  <>
                    <span style={{ fontSize: 14, color: "#3d3d3d" }}>
                      {someSelected
                        ? `${selected.size} selected`
                        : "Select conversations"}
                    </span>
                    {someSelected && (
                      <button
                        className="chats-text-btn chats-text-btn--danger"
                        onClick={handleDeleteSelected}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <Loader2 size={12} className="spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete ({selected.size})
                      </button>
                    )}
                    <button
                      className="chats-text-btn"
                      onClick={toggleSelectMode}
                      style={{ marginLeft: "auto" }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 430,
                        lineHeight: "1.4",
                        color: "#3d3d3d",
                      }}
                    >
                      Your conversations with Clarix
                    </span>
                    {chats.length > 0 && (
                      <button
                        className="chats-select-btn"
                        onClick={toggleSelectMode}
                      >
                        Select
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Chat list */}
            <div className="conversations-base c-pd c-mr">
              {/* Loading */}
              {loading && (
                <div className="chats-loading">
                  <Loader2 size={20} className="spin" />
                  <span>Loading chats...</span>
                </div>
              )}

              {/* Empty */}
              {!loading && chats.length === 0 && (
                <div className="chats-empty">
                  <MessageSquare size={60} strokeWidth={1} color="#d1d6e0" />
                  <p>
                    {debouncedSearch
                      ? `No chats found for "${debouncedSearch}"`
                      : "No conversations yet"}
                  </p>
                  {!debouncedSearch && (
                    <Link
                      to="/chat"
                      className="nc-btn"
                      style={{ marginTop: 8 }}
                    >
                      <CirclePlus size={15} /> Start chatting
                    </Link>
                  )}
                </div>
              )}

              {/* List */}
              {!loading && chats.length > 0 && (
                <ul role="list" aria-label="Chats" className="flex flex-col">
                  {chats.map((chat) => (
                    <li
                      className={`c-li ${selected.has(chat.id) ? "c-li--selected" : ""}`}
                      key={chat.id}
                    >
                      <div className="rel">
                        {/* Checkbox */}
                        <div
                          className={`c-li-check cli-check-left ${selectMode ? "c-li-check--visible" : ""}`}
                          onClick={() => selectMode && toggleOne(chat.id)}
                        >
                          <div
                            className={`check-box ${selected.has(chat.id) ? "check-box--checked" : ""}`}
                          >
                            {selected.has(chat.id) && (
                              <CheckSquare size={12} color="#0d0d0d" />
                            )}
                          </div>
                        </div>

                        {/* Chat row */}
                        <div
                          className="chat-link chat-link-pd"
                          onClick={() =>
                            selectMode
                              ? toggleOne(chat.id)
                              : handleChatClick(chat.id)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (selectMode
                              ? toggleOne(chat.id)
                              : handleChatClick(chat.id))
                          }
                        >
                          <div style={{ width: "100%", minWidth: 0 }}>
                            <div className="chat-row-top">
                              <div className="text-flow chat-title-text">
                                {chat.title?.trim() || "New Chat"}
                              </div>
                              <span className="chat-date">
                                {formatDate(chat.updated_at)}
                              </span>
                            </div>
                          </div>

                          {/* Delete button */}
                          {!selectMode && (
                            <button
                              className="chat-delete-btn"
                              onClick={(e) => handleDeleteOne(e, chat.id)}
                              disabled={deletingId === chat.id}
                              aria-label="Delete conversation"
                            >
                              {deletingId === chat.id ? (
                                <Loader2 size={13} className="spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="chats-pagination">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  ← Prev
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                    )
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`dot-${i}`} className="page-dot">
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          className={`page-num ${page === p ? "page-num--active" : ""}`}
                          onClick={() => setPage(p)}
                          disabled={loading}
                        >
                          {p}
                        </button>
                      ),
                    )}
                </div>

                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next →
                </button>
              </div>
            )}
          </main>
          <DeleteAllChatPopUp
            open={showDeleteAllModal}
            title="Delete all chats?"
            description="This will permanently delete all your conversations and cannot be undone."
            confirmText="Delete all"
            loading={deleting}
            onClose={() => setShowDeleteAllModal(false)}
            onConfirm={confirmDeleteAll}
          />
        </div>
      </div>
    </>
  );
}
