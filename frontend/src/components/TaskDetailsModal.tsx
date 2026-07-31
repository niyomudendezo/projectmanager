import type { Task } from '../types';

interface Props {
  task: Task;
  columnName: string;
  onClose: () => void;
  onEdit: () => void;
}

export default function TaskDetailsModal({ task, columnName, onClose, onEdit }: Props) {
  const formatDate = (date?: string | null) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';
  const formatTime = (time?: string | null) =>
    time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not set';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-details-modal" onClick={(event) => event.stopPropagation()}>
        <div className="task-modal-header">
          <div>
            <span className={`wrike-priority priority-${task.priority}`}>{task.priority}</span>
            <h3>{task.title}</h3>
            <p>Task details</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <dl className="task-details-list">
          <div><dt>Status</dt><dd>{columnName}</dd></div>
          <div><dt>Priority</dt><dd className="task-details-capitalize">{task.priority}</dd></div>
          <div className="task-details-full">
            <dt>Description</dt>
            <dd>{task.description || 'No description provided.'}</dd>
          </div>
          <div><dt>From date</dt><dd>{formatDate(task.start_date)}</dd></div>
          <div><dt>Start time</dt><dd>{formatTime(task.start_time)}</dd></div>
          <div><dt>To date</dt><dd>{formatDate(task.end_date)}</dd></div>
          <div><dt>End time</dt><dd>{formatTime(task.end_time)}</dd></div>
          <div className="task-details-full">
            <dt>Created</dt>
            <dd>{task.created_at ? new Date(task.created_at).toLocaleString() : 'Not available'}</dd>
          </div>
        </dl>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Close</button>
          <button type="button" onClick={onEdit} className="btn-primary">Edit task</button>
        </div>
      </div>
    </div>
  );
}
