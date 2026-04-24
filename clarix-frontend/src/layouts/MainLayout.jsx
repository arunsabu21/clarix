import { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";

function MainLayout({
  children,
  onNewChat,
  onSelectConversation,
  activeConversationId,
  refreshSidebarRef,
}) {
  return (
    <div id="app">
      <Sidebar
        onNewChat={onNewChat}
        onSelectConversation={onSelectConversation}
        activeConversationId={activeConversationId}
        refreshSidebarRef={refreshSidebarRef}
      />
      <main className="main">{children}</main>
    </div>
  );
}

export default MainLayout;