import api from "./api";

export const sendMessage = (message, conversation_id = null, model="gemini") => {
    const payload = { message, model };
    if ( conversation_id ) payload.conversation_id = conversation_id;
    return api.post("/chat/send/", payload);
};

export const getConversations = () => api.get("/chat/conversations/");

export const getConversation = (id) => api.get(`/chat/conversations/${id}/`);

export const deleteConversation = (id) => api.delete(`/chat/conversations/${id}/`);