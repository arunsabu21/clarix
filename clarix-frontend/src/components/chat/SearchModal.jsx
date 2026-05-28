import { useState, useEffect, useRef } from "react";
import { Search, X, MessageSquare, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./SearchModal.css";

function useDebounce(value, delay = 350) {
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
  if (isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = Math.floor((now - date) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SearchModal({ onClose, onSelectConversation }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchRecent = async () => {
      try {
        const res = await api.get(
          "/chat/conversations/?page_size=10&ordering=-updated_at",
        );

        if (!isMounted) return;

        const data = res?.data?.results || res?.data || [];
        setInitial(data);
        setResults(data);
      } catch (error) {
        console.error("Failed to fetch recent chats:", error);
      }
    };
    fetchRecent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!debouncedQuery.trim()) {
      setResults(initial);
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/chat/conversations/?search=${encodeURIComponent(debouncedQuery)}&page_size=20`,
        );

        if (!isMounted) return;

        setResults(res?.data?.results || res?.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    search();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (conv) => {
    if (!conv?.id) return;

    onSelectConversation?.(conv.id);
    navigate(`/chat?c=${conv.id}`);
    onClose();
  };

  return (
    <>
      <div className="sm-backdrop" onClick={onClose} />

      <div className="sm-modal" role="dialog" aria-label="Search Chats">
        <div className="sm-input-row">
          <Search size={16} color="#73726c" className="sm-icon" />

          <input
            ref={inputRef}
            type="text"
            className="sm-input"
            placeholder="Search your chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {loading && <Loader2 size={15} className="spin-sm" color="#73726c" />}
          {!loading && query && (
            <button className="sm-clear" onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="sm-divider" />

        <div className="sm-label">{query.trim() ? "Results" : "Recent"}</div>

        <div className="sm-list">
          {results.length === 0 && !loading && (
            <div className="sm-empty">
              <MessageSquare size={20} strokeWidth={1} color="#d1d6e0" />
              <span>
                {query.trim() ? "No results found" : "No conversations yet"}
              </span>
            </div>
          )}

          {results.map((conv) => (
            <button
              key={conv.id}
              className="sm-item"
              onClick={() => handleSelect(conv)}
            >
              <MessageSquare
                size={14}
                color="#73726c"
                className="sm-item-icon"
              />
              <div className="sm-item-content">
                <span className="sm-item-title">
                  {conv.title?.trim() || "New Chat"}
                </span>
                {conv.last_message && (
                  <span className="sm-item-preview">
                    {conv.last_message.content}
                  </span>
                )}
              </div>
              <span className="sm-item-date">
                {formatDate(conv.updated_at)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
