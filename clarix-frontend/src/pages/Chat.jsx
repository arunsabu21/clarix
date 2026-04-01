import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import ClarixIcon from "../components/ClarixIcon";
import "../styles/Chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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

  const API = import.meta.env.VITE_API_BASE_URL;
  console.log(API);

  return (
    <div className="chat">
      <div className={`chat-content ${messages.length > 0 ? "has-messages" : ""}`}>

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

      </div>
    </div>
  );
}

export default Chat;