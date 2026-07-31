export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Task {
  id: number;
  column_id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  position: number;
  created_at?: string;
}

export interface Column {
  id: number;
  project_id: number;
  name: string;
  position: number;
  tasks: Task[];
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
  role?: 'owner' | 'collaborator';
  columns?: Column[];
}
