import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error.message);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  searchUsers: (query) => api.get(`/auth/users/search?q=${query}`),
};

// Board API
export const boardAPI = {
  getBoards: (params) => api.get("/boards", { params }),
  getBoard: (id) => api.get(`/boards/${id}`),
  createBoard: (data) => api.post("/boards", data),
  createInvite: (id, data) => api.post(`/boards/${id}/invite`, data),
  updateBoard: (id, data) => api.put(`/boards/${id}`, data),
  deleteBoard: (id) => api.delete(`/boards/${id}`),
  addMember: (id, data) => api.post(`/boards/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/boards/${id}/members/${userId}`),
};

// List API
export const listAPI = {
  createList: (data) => api.post("/lists", data),
  updateList: (id, data) => api.put(`/lists/${id}`, data),
  deleteList: (id) => api.delete(`/lists/${id}`),
  moveList: (id, data) => api.put(`/lists/${id}/move`, data),
};

// Task API
export const taskAPI = {
  getTasks: (params) => api.get("/tasks", { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post("/tasks", data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  moveTask: (id, data) => api.put(`/tasks/${id}/move`, data),
  assignTask: (id, data) => api.post(`/tasks/${id}/assign`, data),
  unassignTask: (id, userId) => api.delete(`/tasks/${id}/assign/${userId}`),
};

// Activity API
export const activityAPI = {
  getBoardActivity: (boardId, params) =>
    api.get(`/activities/board/${boardId}`, { params }),
  getUserActivity: (params) => api.get("/activities/user", { params }),
};

// Invite API
export const inviteAPI = {
  getInvite: (token) => api.get(`/invites/${token}`),
  acceptInvite: (token) => api.post(`/invites/${token}/accept`),
};

export default api;
