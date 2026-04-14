import { useState, useRef, useEffect } from "react";
import { useAuthGlobal } from "../context/AuthContext";
import Message from "../components/common/Alert";
import {
  ArrowUp,
  Paperclip,
  X,
  Square,
  ChevronDown,
  Trash2,
} from "lucide-react";
import ClarixIcon from "../components/common/ClarixIcon";
import ButtonSpinner from "../components/chat/ButtonSpinner";
import ImageUploadModal from "../components/chat/ImageUploadModal";
import ModelSwitcher from "../components/chat/ModelSwitcher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConversation, deleteConversation } from "../services/chat";
import {
  connectSocket,
  sendSocketMessage,
  disconnectSocket,
  stopSocketMessage,
} from "../services/socket";
import "../styles/Chat.css";
import "../styles/ChatV2.css";

function Chat({ conversationId, setConversationId, onConversationCreated }) {
  const { user } = useAuthGlobal();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [model, setModel] = useState("gemini");
  const [rateLimitError, setRateLimitError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [showTitleMenu, setShowTitleMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const streamRef = useRef("");
  const conversationIdRef = useRef(conversationId);
  const socketHandlerRef = useRef(null);
  const justCreatedRef = useRef(false);

  useEffect(() => {
    if (user?.email && sessionStorage.getItem("just_logged_in")) {
      setMsg(`Authenticated as ${user.email}`);
      sessionStorage.removeItem("just_logged_in");
    }
  }, [user]);

  socketHandlerRef.current = (data) => {
    if (data.type === "typing") {
      setIsTyping(true);
      setIsStreaming(true);
      streamRef.current = "";
      setMessages((prev) => [...prev, { role: "ai", text: "" }]);
    }

    if (data.type === "stream") {
      streamRef.current += data.content;

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last && last.role === "ai") {
          last.text = streamRef.current;
        }

        return updated;
      });

      setIsTyping(false);
    }

    if (data.type === "done") {
      setMessages((prev) => [...prev, { role: "ai", text: streamRef.current }]);
      setStreamingText("");
      streamRef.current = "";
      setIsTyping(false);
      setIsStreaming(false);

      if (!conversationIdRef.current) {
        justCreatedRef.current = true;
        setConversationId(data.conversation_id);
        conversationIdRef.current = data.conversation_id;
        setConversationTitle(data.title || "New Chat");
        onConversationCreated?.();
      }
    }

    if (data.type === "error") {
      setIsStreaming(false);
      if (
        data.message?.includes("message limit") ||
        data.message?.includes("wait")
      ) {
        setRateLimitError(data.message);
      } else {
        setError(data.message);
      }
      setIsTyping(false);
      setStreamingText("");
    }
  };

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    connectSocket(
      token,
      (data) => socketHandlerRef.current?.(data),
      (err) => setError(err),
    );

    return () => {
      // prevent React dev double unmount killing socket
      if (process.env.NODE_ENV === "production") {
        disconnectSocket();
      }
    };
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setConversationTitle("");
      return;
    }

    // skip reload right after creating conversation
    if (justCreatedRef.current) {
      justCreatedRef.current = false;
      return;
    }

    setConversationTitle("");
    loadConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, streamingText]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const loadConversation = async (id) => {
    try {
      const res = await getConversation(id);
      setConversationTitle(res.data.title?.trim() || "New Chat")

      const formatted = res.data.messages.map((m) => ({
        role: m.role === "assistant" ? "ai" : "user",
        text: m.content,
      }));

      setMessages((prev) => {
        // prevent overwrite if UI already has newer data
        if (prev.length >= formatted.length) return prev;
        return formatted;
      });
    } catch {
      setError("Failed to load conversation.");
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async () => {
    if (!conversationIdRef.current) return;
    try {
      await deleteConversation(conversationIdRef.current);
      setShowTitleMenu(false);
      setConversationTitle("");
      onConversationCreated?.();
      setConversationId(null);
      conversationIdRef.current = null;
      setMessages([]);
    } catch {
      setError("Failed to delete conversation.");
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const sendMessage = () => {
    if ((!input.trim() && !selectedImage) || isTyping || rateLimitError) return;

    const userText = input.trim();
    setInput("");
    setSelectedImage(null);
    setError("");

    // Add user message optimistically
    setMessages((prev) => [...prev, { role: "user", text: userText }]);

    // Send ONLY via WebSocket
    sendSocketMessage(userText, conversationIdRef.current, model);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasContent = input.trim() || selectedImage;

  return (
    <>
      <Message type="success" text={msg} onClose={() => setMsg("")} />
      <Message type="error" text={error} onClose={() => setError("")} />

      <div className="chat">
        {conversationId && conversationTitle && (
          <div className="chat-title-bar">
            <div className="chat-title-inner">
              <span className="chat-title-text">{conversationTitle}</span>
              <button
                className="chat-title-chevron"
                onClick={() => setShowTitleMenu(!showTitleMenu)}
              >
                <ChevronDown
                  size={15}
                  style={{
                    transform: showTitleMenu
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>

              {showTitleMenu && (
                <>
                  <div
                    className="title-menu-backdrop"
                    onClick={() => setShowTitleMenu(false)}
                  />
                  <div className="chat-title-menu">
                    <button
                      className="chat-title-menu-item danger"
                      onClick={handleDeleteConversation}
                    >
                      <Trash2 size={13} /> Delete conversation
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div
          className={`chat-content ${messages.length > 0 || streamingText ? "has-messages" : ""}`}
        >
          {messages.length === 0 && !streamingText && (
            <div className="title-row">
              <ClarixIcon size={28} />
              <div className="user-wishing">
                {getGreeting()}, {user?.name || "there"}
              </div>
            </div>
          )}

          {(messages.length > 0 || streamingText) && (
            <div className="messages">
              {messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  {m.role === "ai" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  ) : (
                    m.text
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message ai typing-logo">
                  <ClarixIcon size={20} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {rateLimitError && (
            <div
              className={`rate-limit-banner ${messages.length > 0 ? "change-width" : ""}`}
            >
              <span>{rateLimitError}</span>
            </div>
          )}

          <div
            className={`chat-input-wrapper ${messages.length > 0 ? "change-width" : ""} ${rateLimitError ? "has-banner" : ""}`}
          >
            {selectedImage && (
              <div className="image-preview-strip">
                <div className="image-preview-thumb">
                  <img src={selectedImage.url} alt="preview" />
                  <button onClick={() => setSelectedImage(null)}>
                    <X size={10} />
                  </button>
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="How can I help you today?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping || isStreaming || !!rateLimitError}
              rows={1}
            />

            <div className="input-actions">
              <button
                className="attach-icon-btn"
                onClick={() => setShowUpload(true)}
              >
                <Paperclip size={17} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ModelSwitcher selected={model} onChange={setModel} />
                {isStreaming ? (
                  <button onClick={stopSocketMessage} className="chat-stop-btn">
                    <Square size={14} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    className="chat-send-btn"
                    disabled={!hasContent || !!rateLimitError}
                    style={{
                      opacity: hasContent && !rateLimitError ? 1 : 0,
                      pointerEvents:
                        hasContent && !rateLimitError ? "auto" : "none",
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div role="note" className="responsive-note">
            Clarix is AI and can make mistakes. Please double-check responses.
          </div>

          {showUpload && (
            <ImageUploadModal
              onClose={() => setShowUpload(false)}
              onSelect={(img) => setSelectedImage(img)}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default Chat;
