import api from "./api";

// List
export const getProjects = async (params = {}) => {
  const query = new URLSearchParams({
    archived: params.archived ?? false,
    ...(params.search && { search: params.search }),
    ...(params.ordering && { ordering: params.ordering }),
  });
  const response = await api.get(`/projects/?${query.toString()}`);
  return response;
};

// Create
export const createProject = (data) => api.post("/projects/", data);

// Detail
export const getProject = (projectId) => api.get(`/projects/${projectId}`);

// Update
export const updateProject = (projectId, data) =>
  api.patch(`/projects/${projectId}/`, data);

// Delete
export const deleteProject = (projectId) =>
  api.delete(`/projects/${projectId}/`);

// Archive / Unarchive
export const archiveProject = (projectId) =>
  api.post(`/projects/${projectId}/archive/`);

export const unarchiveProject = (projectId) =>
  api.post(`/projects/${projectId}/unarchive/`);

// Conversations
export const addConversationToProject = (projectId, conversationId) =>
  api.post(`/projects/${projectId}/conversations/`, {
    conversation_id: conversationId,
  });

export const removeConversationFromProject = (projectId, conversationId) =>
  api.delete(`/projects/${projectId}/conversations/`, {
    data: { conversation_id: conversationId },
  });

export const moveConversation = (conversationId, projectId = null) =>
  api.post("/projects/move-conversation/", {
    conversation_id: conversationId,
    project_id: projectId,
  });

// Reorder
export const reorderProjects = (projects) =>
  api.post("/projects/reorder/", { projects });
