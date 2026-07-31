import { create } from 'zustand';
import type { Project, Task } from '../types';
import api from '../api/client';

interface BoardState {
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (name: string, description: string) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  addColumn: (projectId: number, name: string) => Promise<void>;
  deleteColumn: (columnId: number) => Promise<void>;
  renameColumn: (columnId: number, name: string) => Promise<void>;

  addTask: (columnId: number, title: string, description: string, priority: Task['priority'], schedule: Pick<Task, 'start_date' | 'end_date' | 'start_time' | 'end_time'>) => Promise<void>;
  updateTask: (taskId: number, title: string, description: string, priority: Task['priority'], schedule: Pick<Task, 'start_date' | 'end_date' | 'start_time' | 'end_time'>) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
  moveTask: (taskId: number, newColumnId: number, newPosition: number) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  projects: [],
  activeProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/projects');
      set({ projects: data, loading: false });
    } catch { set({ loading: false, error: 'Failed to load projects' }); }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/projects/${id}`);
      set({ activeProject: data, loading: false });
    } catch { set({ loading: false, error: 'Failed to load project' }); }
  },

  createProject: async (name, description) => {
    const { data } = await api.post('/projects', { name, description });
    set((s) => ({ projects: [data, ...s.projects] }));
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  addColumn: async (projectId, name) => {
    const { data } = await api.post('/columns', { project_id: projectId, name });
    set((s) => ({
      activeProject: s.activeProject
        ? { ...s.activeProject, columns: [...(s.activeProject.columns || []), data] }
        : s.activeProject,
    }));
  },

  deleteColumn: async (columnId) => {
    await api.delete(`/columns/${columnId}`);
    set((s) => ({
      activeProject: s.activeProject
        ? { ...s.activeProject, columns: s.activeProject.columns?.filter((c) => c.id !== columnId) }
        : s.activeProject,
    }));
  },

  renameColumn: async (columnId, name) => {
    await api.put(`/columns/${columnId}`, { name });
    set((s) => ({
      activeProject: s.activeProject
        ? {
            ...s.activeProject,
            columns: s.activeProject.columns?.map((c) => (c.id === columnId ? { ...c, name } : c)),
          }
        : s.activeProject,
    }));
  },

  addTask: async (columnId, title, description, priority, schedule) => {
    const { data } = await api.post('/tasks', { column_id: columnId, title, description, priority, ...schedule });
    set((s) => ({
      activeProject: s.activeProject
        ? {
            ...s.activeProject,
            columns: s.activeProject.columns?.map((c) =>
              c.id === columnId ? { ...c, tasks: [...c.tasks, data] } : c
            ),
          }
        : s.activeProject,
    }));
  },

  updateTask: async (taskId, title, description, priority, schedule) => {
    await api.put(`/tasks/${taskId}`, { title, description, priority, ...schedule });
    set((s) => ({
      activeProject: s.activeProject
        ? {
            ...s.activeProject,
            columns: s.activeProject.columns?.map((c) => ({
              ...c,
              tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, title, description, priority, ...schedule } : t)),
            })),
          }
        : s.activeProject,
    }));
  },

  deleteTask: async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    set((s) => ({
      activeProject: s.activeProject
        ? {
            ...s.activeProject,
            columns: s.activeProject.columns?.map((c) => ({
              ...c,
              tasks: c.tasks.filter((t) => t.id !== taskId),
            })),
          }
        : s.activeProject,
    }));
  },

  moveTask: async (taskId, newColumnId, newPosition) => {
    // Optimistic update
    const prev = get().activeProject;
    if (!prev?.columns) return;

    let movedTask: Task | undefined;
    const updated = prev.columns.map((c) => {
      const found = c.tasks.find((t) => t.id === taskId);
      if (found) movedTask = found;
      return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
    });

    if (!movedTask) return;
    const withMoved = updated.map((c) => {
      if (c.id !== newColumnId) return c;
      const tasks = [...c.tasks];
      tasks.splice(newPosition, 0, { ...movedTask!, column_id: newColumnId });
      return { ...c, tasks };
    });

    set({ activeProject: { ...prev, columns: withMoved } });

    try {
      await api.put(`/tasks/${taskId}/move`, { column_id: newColumnId, position: newPosition });
    } catch {
      set({ activeProject: prev }); // rollback
    }
  },
}));
