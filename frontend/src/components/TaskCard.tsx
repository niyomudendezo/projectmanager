import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { useBoardStore } from '../store/boardStore';
import TaskModal from './TaskModal';
import TaskDetailsModal from './TaskDetailsModal';

export default function TaskCard({ task }: { task: Task }) {
  const { deleteTask, activeProject } = useBoardStore();
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  const columns = activeProject?.columns ?? [];
  const columnIndex = Math.max(0, columns.findIndex((column) => column.id === task.column_id));
  const taskProgress = columns.length > 1 ? Math.round((columnIndex / (columns.length - 1)) * 100) : 0;
  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const scheduleText = task.start_date || task.end_date
    ? [
        task.start_date ? formatDate(task.start_date) : 'Open',
        task.start_time ? formatTime(task.start_time) : '',
        '–',
        task.end_date ? formatDate(task.end_date) : 'Open',
        task.end_time ? formatTime(task.end_time) : '',
      ].filter(Boolean).join(' ')
    : null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`task-card wrike-task-card ${isDragging ? 'is-dragging' : ''}`}
        onClick={() => !isDragging && setViewing(true)}
        {...attributes}
        {...listeners}
      >
        <div className="task-card-head">
          <span className={`wrike-priority priority-${task.priority}`}>{task.priority}</span>
          <div className="task-actions">
            <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setEditing(true); }} title="Edit">✎</button>
            <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); deleteTask(task.id); }} title="Delete">×</button>
          </div>
        </div>
        <div className="task-content">
          <p className="task-title">{task.title}</p>
          {task.description && <p className="task-desc">{task.description}</p>}
          {scheduleText && (
            <div className="wrike-task-schedule" title={scheduleText}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              <span>{scheduleText}</span>
            </div>
          )}
          <div className="wrike-task-progress">
            <div><span>Progress</span><b>{taskProgress}%</b></div>
            <i><span style={{ width: `${taskProgress}%` }} /></i>
          </div>
          <div className="wrike-task-footer">
            <span className="wrike-task-avatar">{task.title[0]?.toUpperCase()}</span>
            <span className="wrike-task-date">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
              {task.end_date ? formatDate(task.end_date) : task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Active'}
            </span>
            <span className="wrike-task-comments">
              <svg viewBox="0 0 24 24"><path d="M4 5h16v12H8l-4 4z"/></svg>0
            </span>
          </div>
        </div>
        <div className="task-drag-handle" title="Drag task">⠿</div>
      </div>
      {viewing && (
        <TaskDetailsModal
          task={task}
          columnName={columns.find((column) => column.id === task.column_id)?.name ?? 'Unknown'}
          onClose={() => setViewing(false)}
          onEdit={() => { setViewing(false); setEditing(true); }}
        />
      )}
      {editing && <TaskModal task={task} onClose={() => setEditing(false)} />}
    </>
  );
}
