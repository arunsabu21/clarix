import { useState, useRef, useEffect } from "react";
import { useAuthGlobal } from "../context/AuthContext";
import Message from "../components/Alert";
import { ArrowUp } from "lucide-react";
import ClarixIcon from "../components/ClarixIcon";
import "../styles/Chat.css";

function Chat() {
  const { user, logout } = useAuthGlobal();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [msg, setMsg] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.email && sessionStorage.getItem("just_logged_in")) {
      setMsg(`Authenticated as ${user.email}`);

      sessionStorage.removeItem("just_logged_in");
    }
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setIsTyping(true);
    setTimeout(() => {
      const aiMessage = { role: "ai", text: "Hey! I'm Clarix 🤖" };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Message type="success" text={msg} onClose={() => setMsg("")} />
      <div className="chat">
        <div
          className={`chat-content ${messages.length > 0 ? "has-messages" : ""}`}
        >
          {messages.length === 0 && (
            <div className="title-row">
              <ClarixIcon size={28} />
              <div className="user-wishing">Good Evening, User</div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.text}
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

          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder="How can I help you today?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage} className="chat-send-btn">
              <ArrowUp size={18} />
            </button>
          </div>
          <button className="chat-send-btn" onClick={logout}></button>
        </div>
      </div>
    </>
  );
}

export default Chat;
