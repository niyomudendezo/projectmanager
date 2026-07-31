import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import { useBoardStore } from '../store/boardStore';
import type { Task } from '../types';

interface RoadmapColumn {
  id: number;
  name: string;
  position: number;
}

interface RoadmapTask extends Task {
  column_name: string;
  column_position: number;
  project_id: number;
  project_name: string;
  project_description: string;
  project_columns: RoadmapColumn[];
}

export default function TaskRoadmap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchProjects } = useBoardStore();
  const [task, setTask] = useState<RoadmapTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
    if (!id) return;
    setLoading(true);
    api.get(`/tasks/${id}`)
      .then(({ data }) => setTask(data))
      .catch(() => setError('The task could not be loaded or you do not have access.'))
      .finally(() => setLoading(false));
  }, [id, fetchProjects]);

  const formatDate = (date?: string | null) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not scheduled';
  const formatTime = (time?: string | null) =>
    time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="app-layout task-roadmap-page">
      <Sidebar />
      <main className="app-main">
        {loading && <div className="task-roadmap-loading">Loading task roadmap…</div>}
        {!loading && error && (
          <div className="task-roadmap-error">
            <b>Task unavailable</b><p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
          </div>
        )}
        {!loading && task && (
          <>
            <header className="task-roadmap-header">
              <div className="task-roadmap-breadcrumb">
                <button onClick={() => navigate('/dashboard')}>Projects</button><span>/</span>
                <button onClick={() => navigate(`/board/${task.project_id}`)}>{task.project_name}</button><span>/</span>
                <b>{task.title}</b>
              </div>
              <div className="task-roadmap-title">
                <div>
                  <span className={`wrike-priority priority-${task.priority}`}>{task.priority}</span>
                  <h1>{task.title}</h1>
                  <p>{task.project_name} · {task.column_name}</p>
                </div>
                <button className="btn-primary" onClick={() => navigate(`/board/${task.project_id}`)}>Open board</button>
              </div>
            </header>

            <div className="task-roadmap-content">
              <section className="task-roadmap-panel">
                <div className="task-roadmap-panel-title">
                  <div><h2>Task roadmap</h2><p>Progress through the project workflow</p></div>
                  <span>{task.column_name}</span>
                </div>
                <div className="task-status-roadmap">
                  {task.project_columns.map((column, index) => {
                    const currentIndex = task.project_columns.findIndex((item) => item.id === task.column_id);
                    const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
                    return (
                      <div className={`task-roadmap-step ${state}`} key={column.id}>
                        <div><span>{state === 'complete' ? '✓' : index + 1}</span></div>
                        <b>{column.name}</b>
                        <small>{state === 'complete' ? 'Passed' : state === 'current' ? 'Current status' : 'Upcoming'}</small>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="task-roadmap-grid">
                <section className="task-roadmap-panel task-schedule-panel">
                  <div className="task-roadmap-panel-title"><div><h2>Schedule</h2><p>Planned task duration</p></div></div>
                  <div className="task-date-roadmap">
                    <article>
                      <span>START</span><b>{formatDate(task.start_date)}</b><small>{formatTime(task.start_time) || 'Time not set'}</small>
                    </article>
                    <div><i /><span>→</span><i /></div>
                    <article>
                      <span>DUE</span><b>{formatDate(task.end_date)}</b><small>{formatTime(task.end_time) || 'Time not set'}</small>
                    </article>
                  </div>
                </section>

                <aside className="task-roadmap-panel task-info-panel">
                  <div className="task-roadmap-panel-title"><div><h2>Task information</h2><p>Complete details</p></div></div>
                  <dl>
                    <div><dt>Priority</dt><dd className="task-details-capitalize">{task.priority}</dd></div>
                    <div><dt>Status</dt><dd>{task.column_name}</dd></div>
                    <div><dt>Created</dt><dd>{task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unavailable'}</dd></div>
                  </dl>
                </aside>
              </div>

              <section className="task-roadmap-panel task-description-panel">
                <div className="task-roadmap-panel-title"><div><h2>Description</h2><p>Task scope and requirements</p></div></div>
                <p>{task.description || 'No description has been provided for this task.'}</p>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
