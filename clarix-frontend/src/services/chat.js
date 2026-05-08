import api from "./api";

export const sendMessage = (
  message,
  conversation_id = null,
  model = "gemini",
) => {
  const payload = { message, model };
  if (conversation_id) payload.conversation_id = conversation_id;
  return api.post("/chat/send/", payload);
};

// Get conversations
export const getConversations = (params = {}) => {
  return api.get("/chat/conversations/", {
    params,
  });
};

// Get single conversation
export const getConversation = (id) => api.get(`/chat/conversations/${id}/`);

// Delete single conversation
export const deleteConversation = (id) =>
  api.delete(`/chat/conversations/${id}/`);

// Rename conversation
export const renameConversation = (id, title) => {
  return api.patch(`/chat/conversations/${id}/`, {
    title,
  });
};

// Delete all conversations
export const deleteAllConversations = () => {
  return api.delete("/chat/conversations/delete-all/");
};

// Delete multiple conversations
export const deleteMultipleConversations = (ids) => {
  return api.delete("/chat/conversations/delete-multiple/", {
    data: { ids },
  });
};
