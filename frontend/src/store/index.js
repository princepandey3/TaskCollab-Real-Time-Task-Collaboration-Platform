import { create } from "zustand";
import { authAPI, boardAPI } from "../services/api";
import wsClient from "../services/websocket";

// Auth Store
export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const data = await authAPI.login(credentials);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });

      // Connect WebSocket
      wsClient.connect(data.token);

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });

      // Connect WebSocket
      wsClient.connect(data.token);

      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    wsClient.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

// Board Store
export const useBoardStore = create((set, get) => ({
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const data = await boardAPI.getBoards();
      set({ boards: data.boards, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBoard: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await boardAPI.getBoard(id);
      set({ currentBoard: data.board, loading: false });

      // Join board room via WebSocket
      wsClient.joinBoard(id);

      return data.board;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createBoard: async (boardData) => {
    try {
      const data = await boardAPI.createBoard(boardData);
      set((state) => ({ boards: [data.board, ...state.boards] }));
      return data.board;
    } catch (error) {
      throw error;
    }
  },

  updateBoard: async (id, boardData) => {
    try {
      const data = await boardAPI.updateBoard(id, boardData);
      set((state) => ({
        boards: state.boards.map((b) => (b._id === id ? data.board : b)),
        currentBoard:
          state.currentBoard?._id === id ? data.board : state.currentBoard,
      }));
      return data.board;
    } catch (error) {
      throw error;
    }
  },

  deleteBoard: async (id) => {
    try {
      await boardAPI.deleteBoard(id);
      set((state) => ({
        boards: state.boards.filter((b) => b._id !== id),
        currentBoard:
          state.currentBoard?._id === id ? null : state.currentBoard,
      }));
    } catch (error) {
      throw error;
    }
  },

  addList: (list) => {
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          lists: [...state.currentBoard.lists, { ...list, tasks: [] }],
        },
      };
    });
  },

  updateList: (listId, updates) => {
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map((list) =>
            list._id === listId ? { ...list, ...updates } : list,
          ),
        },
      };
    });
  },

  deleteList: (listId) => {
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          lists: state.currentBoard.lists.filter((list) => list._id !== listId),
        },
      };
    });
  },

  addTask: (task) => {
    set((state) => {
      if (!state.currentBoard) return state;
      // task.list may be an id (string) or a populated object ({ _id, title })
      const taskListId =
        typeof task.list === "string" ? task.list : task.list?._id || task.list;

      return {
        currentBoard: {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map((list) =>
            list._id === taskListId
              ? { ...list, tasks: [...list.tasks, task] }
              : list,
          ),
        },
      };
    });
  },

  updateTask: (taskId, updates) => {
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map((list) => ({
            ...list,
            tasks: list.tasks.map((task) =>
              task._id === taskId ? { ...task, ...updates } : task,
            ),
          })),
        },
      };
    });
  },

  deleteTask: (taskId) => {
    set((state) => {
      if (!state.currentBoard) return state;
      return {
        currentBoard: {
          ...state.currentBoard,
          lists: state.currentBoard.lists.map((list) => ({
            ...list,
            tasks: list.tasks.filter((task) => task._id !== taskId),
          })),
        },
      };
    });
  },

  moveTask: (taskId, sourceListId, destListId, newPosition) => {
    set((state) => {
      if (!state.currentBoard) return state;

      let task = null;
      const lists = state.currentBoard.lists.map((list) => {
        if (list._id === sourceListId) {
          const taskIndex = list.tasks.findIndex((t) => t._id === taskId);
          if (taskIndex > -1) {
            task = {
              ...list.tasks[taskIndex],
              list: destListId,
              position: newPosition,
            };
            return {
              ...list,
              tasks: list.tasks.filter((t) => t._id !== taskId),
            };
          }
        }
        return list;
      });

      if (!task) return state;

      const updatedLists = lists.map((list) => {
        if (list._id === destListId) {
          const newTasks = [...list.tasks];
          newTasks.splice(newPosition, 0, task);
          return { ...list, tasks: newTasks };
        }
        return list;
      });

      return {
        currentBoard: {
          ...state.currentBoard,
          lists: updatedLists,
        },
      };
    });
  },

  clearCurrentBoard: () => {
    const currentBoardId = get().currentBoard?._id;
    if (currentBoardId) {
      wsClient.leaveBoard(currentBoardId);
    }
    set({ currentBoard: null });
  },
}));
