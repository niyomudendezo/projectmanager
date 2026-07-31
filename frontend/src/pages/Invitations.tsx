import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import { useBoardStore } from '../store/boardStore';

interface Invitation {
  project_id: number;
  project_name: string;
  project_description: string;
  invited_by_name: string;
  invited_by_email: string;
  status: 'pending' | 'accepted';
  task_count: number;
  created_at: string;
  tasks: Array<{
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    column_id: number;
    column_name: string;
    start_date: string | null;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
  }>;
}

export default function Invitations() {
  const navigate = useNavigate();
  const { fetchProjects } = useBoardStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
    api.get('/invitations')
      .then(({ data }) => setInvitations(data))
      .catch(() => setError('Could not load your project invitations.'))
      .finally(() => setLoading(false));
  }, [fetchProjects]);

  const accept = async (projectId: number) => {
    setAccepting(projectId);
    setError('');
    try {
      await api.put(`/invitations/${projectId}/accept`);
      setInvitations((current) => current.map((item) =>
        item.project_id === projectId ? { ...item, status: 'accepted' } : item
      ));
      await fetchProjects();
    } catch {
      setError('This invitation could not be accepted. It may no longer be available.');
    } finally {
      setAccepting(null);
    }
  };

  const pending = invitations.filter((item) => item.status === 'pending');
  const accepted = invitations.filter((item) => item.status === 'accepted');

  return (
    <div className="app-layout invitations-page">
      <Sidebar />
      <main className="app-main">
        <header className="invitations-header">
          <p>COLLABORATION</p>
          <h1>Project invitations</h1>
          <span>Accept an invitation to access the project board and work on its tasks.</span>
        </header>
        <div className="invitations-content">
          {error && <p className="error">{error}</p>}
          {loading && <div className="invitations-loading">Loading invitations…</div>}
          {!loading && (
            <>
              <section>
                <div className="invitations-section-title"><h2>Pending invitations</h2><span>{pending.length}</span></div>
                <div className="invitation-list">
                  {pending.map((invitation) => (
                    <article className={`invitation-card ${expandedProjectId === invitation.project_id ? 'expanded' : ''}`} key={invitation.project_id}>
                      <div className="invitation-card-summary">
                        <div className="invitation-project-icon">{invitation.project_name[0]?.toUpperCase()}</div>
                        <div className="invitation-info">
                          <span>INVITED BY {invitation.invited_by_name}</span>
                          <h3>{invitation.project_name}</h3>
                          <p>{invitation.project_description || 'Collaborate on this project and help complete its tasks.'}</p>
                          <small>{invitation.task_count} tasks · {invitation.invited_by_email} · {new Date(invitation.created_at).toLocaleDateString()}</small>
                        </div>
                        <div className="invitation-actions">
                          <button className="btn-secondary" onClick={() => setExpandedProjectId((current) => current === invitation.project_id ? null : invitation.project_id)}>
                            {expandedProjectId === invitation.project_id ? 'Hide details' : 'View project details'}
                          </button>
                          <button className="btn-primary" disabled={accepting === invitation.project_id} onClick={() => accept(invitation.project_id)}>
                            {accepting === invitation.project_id ? 'Accepting…' : 'Accept invitation'}
                          </button>
                        </div>
                      </div>
                      {expandedProjectId === invitation.project_id && (
                        <div className="invitation-preview">
                          <div className="invitation-preview-heading">
                            <div><h4>Project task preview</h4><p>Read-only access until you accept this invitation.</p></div>
                            <span>{invitation.tasks.length} tasks</span>
                          </div>
                          <div className="invitation-task-list">
                            {invitation.tasks.map((task) => (
                              <div className="invitation-task" key={task.id}>
                                <div className="invitation-task-heading">
                                  <span className={`sidebar-task-priority priority-${task.priority}`} />
                                  <b>{task.title}</b>
                                  <em>{task.column_name}</em>
                                </div>
                                <p>{task.description || 'No description provided.'}</p>
                                <small>
                                  <strong>{task.priority} priority</strong>
                                  <span>From: {task.start_date || 'Not set'}{task.start_time ? ` at ${task.start_time.slice(0, 5)}` : ''}</span>
                                  <span>To: {task.end_date || 'Not set'}{task.end_time ? ` at ${task.end_time.slice(0, 5)}` : ''}</span>
                                </small>
                              </div>
                            ))}
                            {!invitation.tasks.length && <div className="invitation-preview-empty">This project does not have any tasks yet.</div>}
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                  {!pending.length && <div className="invitations-empty">You have no pending project invitations.</div>}
                </div>
              </section>

              <section>
                <div className="invitations-section-title"><h2>Accepted projects</h2><span>{accepted.length}</span></div>
                <div className="invitation-list">
                  {accepted.map((invitation) => (
                    <article className="invitation-card accepted" key={invitation.project_id}>
                      <div className="invitation-project-icon">{invitation.project_name[0]?.toUpperCase()}</div>
                      <div className="invitation-info">
                        <span>COLLABORATOR</span>
                        <h3>{invitation.project_name}</h3>
                        <p>{invitation.project_description || 'Shared project'}</p>
                        <small>{invitation.task_count} tasks · Shared by {invitation.invited_by_name}</small>
                      </div>
                      <button className="btn-secondary" onClick={() => navigate(`/board/${invitation.project_id}`)}>View project</button>
                    </article>
                  ))}
                  {!accepted.length && <div className="invitations-empty">Accepted collaboration projects will appear here.</div>}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
