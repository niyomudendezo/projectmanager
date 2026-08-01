import { useState } from 'react';
import type { Task } from '../types';
import { useBoardStore } from '../store/boardStore';

interface Props {
  columnId?: string;
  task?: Task;
  onClose: () => void;
}

export default function TaskModal({ columnId, task, onClose }: Props) {
  const { addTask, updateTask } = useBoardStore();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(task?.start_date ?? '');
  const [endDate, setEndDate] = useState(task?.end_date ?? '');
  const [startTime, setStartTime] = useState(task?.start_time?.slice(0, 5) ?? '');
  const [endTime, setEndTime] = useState(task?.end_time?.slice(0, 5) ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (startDate && endDate && endDate < startDate) {
      setError('End date cannot be before the start date');
      return;
    }
    if (startDate && endDate && startDate === endDate && startTime && endTime && endTime < startTime) {
      setError('End time cannot be before the start time');
      return;
    }
    const schedule = {
      start_date: startDate || null,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
    };
    setLoading(true);
    try {
      if (task) await updateTask(task.id, title, description, priority, schedule);
      else {
        if (!columnId) {
          setError('Task column is unavailable');
          return;
        }
        await addTask(columnId, title, description, priority, schedule);
      }
      onClose();
    } catch { setError('Failed to save task'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <div>
            <h3>{task ? 'Edit Task' : 'New Task'}</h3>
            <p>Add the task details and schedule.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <fieldset className="task-schedule">
            <legend>Schedule</legend>
            <div className="task-schedule-grid">
              <label>
                <span>From date</span>
                <input type="date" value={startDate} max={endDate || undefined} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label>
                <span>Start time</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </label>
              <label>
                <span>To date</span>
                <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </label>
              <label>
                <span>End time</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </label>
            </div>
          </fieldset>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
