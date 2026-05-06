import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthGlobal } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import Message from "../components/common/Alert";
import {
  ArrowUp,
  Paperclip,
  X,
  Square,
  ChevronDown,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Ghost,
  Search,
} from "lucide-react";
import ClarixIcon from "../components/common/ClarixIcon";
import ButtonSpinner from "../components/chat/ButtonSpinner";
import ImageUploadModal from "../components/chat/ImageUploadModal";
import ModelSwitcher from "../components/chat/ModelSwitcher";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConversation, deleteConversation } from "../services/chat";
import { showResponseCompleteNotification } from "../utils/notifications";
import {
  connectSocket,
  sendSocketMessage,
  disconnectSocket,
  stopSocketMessage,
} from "../services/socket";
import "../styles/Chat.css";
import "../styles/ChatV2.css";
import api from "../services/api";

function Chat({ conversationId, setConversationId, onConversationCreated }) {
  const navigate = useNavigate();
  const { user } = useAuthGlobal();
  const { setMsg } = useMessage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [msg, setLocalMsg] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [model, setModel] = useState("gemini");
  const [rateLimitError, setRateLimitError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const [showTitleMenu, setShowTitleMenu] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [plan, setPlan] = useState("free");
  const [aiName, setAiName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const streamRef = useRef("");
  const conversationIdRef = useRef(conversationId);
  const socketHandlerRef = useRef(null);
  const justCreatedRef = useRef(false);
  const ghostRef = useRef(null);
  const isSearchingRef = useRef(false);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.get("/billing/status/");
        setPlan(res.data.plan);
      } catch {}
    };
    fetchPlan();
  }, []);

  useEffect(() => {
    const fetchAiName = async () => {
      try {
        const res = await api.get("/settings/general/");
        setAiName(res.data.ai_name || "");
      } catch {}
    };
    fetchAiName();
  }, []);

  const setIsSearchingBoth = (val) => {
    isSearchingRef.current = val;
    setIsSearching(val);
  };

  socketHandlerRef.current = (data) => {
    if (data.type === "typing") {
      setIsTyping(true);
      setIsStreaming(true);
      streamRef.current = "";
      setMessages((prev) => [...prev, { role: "ai", text: "" }]);
    }

    if (data.type === "search_used") {
      setIsSearching(true);
    }

    if (data.type === "stream") {
      setIsSearching(false);
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
      setIsSearching(false);
      setMessages((prev) => [...prev, { role: "ai", text: streamRef.current }]);
      setStreamingText("");
      streamRef.current = "";
      setIsTyping(false);
      setIsStreaming(false);

      const notifyEnabled = localStorage.getItem("notify_response_complete");
      if (notifyEnabled === "true") {
        showResponseCompleteNotification(data.title || "your message", setMsg);
      }

      if (!conversationIdRef.current) {
        justCreatedRef.current = true;
        setConversationId(data.conversation_id);
        conversationIdRef.current = data.conversation_id;
        setConversationTitle(data.title || "New Chat");
        onConversationCreated?.();
      }
    }

    if (data.type === "error") {
      setIsSearching(false);
      setIsStreaming(false);
      if (
        data.message?.includes("message limit") ||
        data.message?.includes("wait")
      ) {
        setError(data.message);
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
    setMessages([]);
    setConversationTitle("");
    setIsTyping(false);
    setIsStreaming(false);
    setIsSearching(false);
    setError("");
    setRateLimitError("");
    streamRef.current = "";

    loadConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (document.visibilityState === "visible") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isSearching, streamingText]);

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
      setConversationTitle(res.data.title?.trim() || "New Chat");

      const formatted = res.data.messages.map((m) => ({
        role: m.role === "assistant" ? "ai" : "user",
        text: m.content,
      }));

      setMessages(formatted);
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

  // Regenerate conversation
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === "ai") {
          updated.splice(i, 1);
          break;
        }
      }
      return updated;
    });

    setError("");
    sendSocketMessage(lastUserMsg.text, conversationIdRef.current, model);
  };

  // Copy Response
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Feedback
  const handleFeedback = (index, type) => {
    setFeedbacks((prev) => ({
      ...prev,
      [index]: prev[index] === type ? null : type,
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isTyping || rateLimitError) return;

    const userText = input.trim();
    setInput("");
    setSelectedImage(null);
    setError("");

    // Add user message optimistically
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, image: selectedImage?.url || null },
    ]);

    let imageData = null;
    let imageMime = null;

    if (selectedImage?.file) {
      try {
        imageData = await toBase64(selectedImage.file);
        imageMime = selectedImage.file.type;
      } catch {
        setError("Failed to process image");
        return;
      }
    }

    setSelectedImage(null);

    // Send ONLY via WebSocket
    sendSocketMessage(
      userText,
      conversationIdRef.current,
      model,
      imageData,
      imageMime,
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasContent = input.trim() || selectedImage;

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  return (
    <>
      <Message type="success" text={msg} onClose={() => setLocalMsg("")} />
      <Message type="warning" text={error} onClose={() => setError("")} />

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

        {messages.length === 0 && !streamingText && (
          <div className="ignitico-ghost-container">
            <div className="ignitico-ghost" title="Ignitico Chat">
              <Ghost size={22} strokeWidth={1.75} />
            </div>
          </div>
        )}

        <div
          className={`chat-content ${messages.length > 0 || streamingText ? "has-messages" : ""}`}
        >
          {messages.length === 0 && plan === "free" && (
            <>
              <div className="chat-user-plan">
                Free plan
                <div className="divider">|</div>
                <span>
                  <Link to="/upgrade" className="upgrade-link">
                    Upgrade
                  </Link>
                </span>
              </div>
            </>
          )}

          {messages.length === 0 && !streamingText && (
            <div className="title-row">
              <ClarixIcon size={28} />
              <div className="user-wishing">
                {getGreeting()}, {aiName || user?.name || "there"}
              </div>
            </div>
          )}

          {(messages.length > 0 || streamingText) && (
            <div className="messages">
              {messages.map((m, i) => {
                const isLastAI = m.role === "ai" && i === messages.length - 1;

                return (
                  <div key={i} className={`message ${m.role}`}>
                    {m.role === "ai" ? (
                      <>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text}
                        </ReactMarkdown>

                        {isLastAI && !isStreaming && (
                          <div className="message-actions">
                            <button
                              className="message-action-btn"
                              onClick={() => handleCopy(m.text, i)}
                              title="Copy"
                            >
                              {copiedIndex === i ? (
                                <Check size={15} />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>
                            <button
                              className={`message-action-btn ${feedbacks[i] === "up" ? "active-feedback-up" : ""}`}
                              onClick={() => handleFeedback(i, "up")}
                              title="Positive Response"
                            >
                              <ThumbsUp size={15} />
                            </button>
                            <button
                              className={`message-action-btn ${feedbacks[i] === "down" ? "active-feedback-down" : ""}`}
                              onClick={() => handleFeedback(i, "down")}
                              title="Negative Response"
                            >
                              <ThumbsDown size={15} />
                            </button>
                            <button
                              className="message-action-btn"
                              onClick={handleRegenerate}
                              title="Regenerate response"
                            >
                              <RotateCcw size={15} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="user-message-content">
                            {m.image && (
                              <img
                                src={m.image}
                                alt="uploaded"
                                className="message-image-preview"
                              />
                            )}
                            {m.text && <span>{m.text}</span>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="message ai typing-logo">
                  <ClarixIcon size={20} />
                </div>
              )}

              {isSearching && (
                <div className="message ai">
                  <span className="search-shimmer">Searching the web...</span>
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
              <button
                onClick={() => navigate("/upgrade")}
                className="rate-limit-banner-upgrade"
              >
                Upgrade
              </button>
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
