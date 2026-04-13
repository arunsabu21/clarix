import { useRef } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Landing from "./pages/Home";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

function ChatWrapper() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConversationId = searchParams.get("c") || null;
  const refreshSidebarRef = useRef(null);

  const setConversationId = (id) => {
    if (id) setSearchParams({ c: id });
    else setSearchParams({});
  };

  return (
    <MainLayout
      onNewChat={() => setSearchParams({})}
      onSelectConversation={(id) => setSearchParams({ c: id })}
      activeConversationId={activeConversationId}
      refreshSidebarRef={refreshSidebarRef}
    >
      <Chat
        conversationId={activeConversationId}
        setConversationId={setConversationId}
        onConversationCreated={() => refreshSidebarRef.current?.()}
      />
    </MainLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatWrapper />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
