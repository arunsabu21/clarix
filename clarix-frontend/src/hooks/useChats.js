import { useEffect, useState } from "react";

import { getConversations, deleteConversation } from "../services/chat";

export const useChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await getConversations();
      setChats(res.data.results || []);
      setError("");
    } catch (err) {
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id);

      setChats((prev) => prev.filter((chat) => chat.id !== id));
    } catch {
      setError("Failed to delete chat");
    }
  };

  return {
    chats,
    loading,
    error,
    fetchChats,
    handleDelete,
  };
};
