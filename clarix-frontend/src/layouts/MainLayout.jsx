import { useState } from "react";
import SearchModal from "../components/chat/SearchModal";
import Sidebar from "../components/Sidebar/Sidebar";

function MainLayout({
  children,
  onNewChat,
  onSelectConversation,
  activeConversationId,
  refreshSidebarRef,
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  return (
    <div id="app">
      <Sidebar
        onNewChat={onNewChat}
        onSelectConversation={onSelectConversation}
        activeConversationId={activeConversationId}
        refreshSidebarRef={refreshSidebarRef}
        onOpenSearch={() => setShowSearchModal(true)}
      />

      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          onSelectConversation={(id) => {
            onSelectConversation?.(id);
            setShowSearchModal(false);
          }}
        />
      )}
      <main className="main">{children}</main>
    </div>
  );
}

export default MainLayout;
