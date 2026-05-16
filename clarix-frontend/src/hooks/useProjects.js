import { useState, useEffect, useCallback } from "react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  addConversationToProject,
  removeConversationFromProject,
  moveConversation,
  reorderProjects,
} from "../services/projects";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-updated_at");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getProjects({ archived, search, ordering });
        setProjects(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.log(err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [archived, search, ordering]);

  const handleCreate = async (data) => {
    try {
      const res = await createProject(data);
      setProjects((prev) => [res.data, ...(prev || [])]);
      return { success: true, project: res.data };
    } catch (err) {
      const msg =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.error ||
        "Failed to create project";
      return { success: false, error: msg };
    }
  };

  const handleUpdate = async (projectId, data) => {
    try {
      const res = await updateProject(projectId, data);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? res.data : p)),
      );
      return { success: true, project: res.data };
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update project";
      return { success: false, error: msg };
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      return { success: true };
    } catch {
      return { success: false, error: "Failed to delete project." };
    }
  };

  const handleArchive = async (projectId) => {
    try {
      await archiveProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      return { success: true };
    } catch {
      return { success: false, error: "Failed to archive project" };
    }
  };

  const handleUnarchive = async (projectId) => {
    try {
      await unarchiveProject(projectId);

      setProjects((prev) => prev.filter((p) => p.id !== projectId));

      return { success: true };
    } catch {
      return { success: false, error: "Failed to unarchive project." };
    }
  };

  const handleAddConversation = async (projectId, conversationId) => {
    try {
      await addConversationToProject(projectId, conversationId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, conversation_count: p.conversation_count + 1 }
            : p,
        ),
      );
      return { success: true };
    } catch {
      return { success: false, error: "Failed to add conversation." };
    }
  };

  const handleRemoveConversation = async (projectId, conversationId) => {
    try {
      await removeConversationFromProject(projectId, conversationId);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? {
                ...p,
                conversation_count: Math.max(0, p.conversation_count - 1),
              }
            : p,
        ),
      );
      return { success: true };
    } catch {
      return { success: false, error: "Failed to remove conversation." };
    }
  };

  const handleMoveConversation = async (conversationId, toProjectId) => {
    try {
      await moveConversation(conversationId, toProjectId);
      return { success: true };
    } catch {
      return { success: false, error: "Failed to move conversation." };
    }
  };

  const handleReorder = async (reorderedProjects) => {
    setProjects(reorderedProjects);
    try {
      await reorderProjects(
        reorderedProjects.map((p, i) => ({ id: p, sort_order: i })),
      );
      return { success: true };
    } catch {
      fetchProjects();
      return { success: false, error: "Failed to reorder projects." };
    }
  };

  return {
    projects,
    loading,
    error,
    archived,
    search,
    ordering,
    setOrdering,
    setArchived,
    setSearch,

    createProject: handleCreate,
    updateProject: handleUpdate,
    deleteProject: handleDelete,
    archiveProject: handleArchive,
    unarchiveProject: handleUnarchive,
    addConversation: handleAddConversation,
    removeConversation: handleRemoveConversation,
    moveConversation: handleMoveConversation,
    reorderProjects: handleReorder,
  };
}
