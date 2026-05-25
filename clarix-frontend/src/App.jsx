import { useRef } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Landing from "./pages/Home";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import PricingPage from "./pages/PricingPage";
import UpgradeSuccess from "./pages/UpgradeSuccess";
import UserSettings from "./pages/Settings";
import SearchChats from "./pages/Chats";
import Projects from "./pages/Projects";
import ProjectDetailsAndMessage from "./pages/ProjectDetails";
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
      <Route path="/upgrade" element={<PricingPage />} />

      <Route
        path="/upgrade/success"
        element={
          <ProtectedRoute>
            <UpgradeSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recents"
        element={
          <ProtectedRoute>
            <SearchChats />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailsAndMessage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
