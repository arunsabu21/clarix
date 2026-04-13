import { Sparkles, Zap, Shield, MessageSquare } from "lucide-react";
import Navbar from "../components/common/Navbar";
function Landing() {
  return (
    <>
      <Navbar />
      <div className="landing">
        {/* HERO */}
        <section className="hero">
          <div className="hero-content">
            <h1>
              Your AI Assistant for <span>Everything</span>
            </h1>

            <p>
              Clarix helps you think, write, and build faster with real-time AI,
              smart search, and powerful conversations.
            </p>

            <div className="hero-actions">
              <button className="btn-primary">Start chatting</button>
              <button className="btn-secondary">Learn more</button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="features">
          <div className="features-grid">
            <div className="feature-card">
              <Sparkles size={22} />
              <h3>Smart AI</h3>
              <p>
                Get accurate, context-aware responses powered by modern LLMs.
              </p>
            </div>

            <div className="feature-card">
              <Zap size={22} />
              <h3>Real-time Streaming</h3>
              <p>Experience fast, smooth responses as they are generated.</p>
            </div>

            <div className="feature-card">
              <MessageSquare size={22} />
              <h3>Conversation Memory</h3>
              <p>Keep track of your chats and continue where you left off.</p>
            </div>

            <div className="feature-card">
              <Shield size={22} />
              <h3>Secure & Private</h3>
              <p>
                Your data is protected with secure authentication and storage.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default Landing;
