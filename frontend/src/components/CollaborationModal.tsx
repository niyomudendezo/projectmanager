import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../api/client';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  status?: 'pending' | 'accepted';
  created_at?: string;
}

interface Props {
  projectId: string;
  onClose: () => void;
}

export default function CollaborationModal({ projectId, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/projects/${projectId}/collaborators`)
      .then(({ data }) => setCollaborators(data))
      .catch(() => setError('Could not load collaborators'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/collaborators`, { email: email.trim() });
      setCollaborators((current) => [data, ...current]);
      setSuccess(`${data.name} can now collaborate on this project.`);
      setEmail('');
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.error
        : null;
      setError(message || 'Failed to send collaboration request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal collaboration-modal" onClick={(event) => event.stopPropagation()}>
        <div className="task-modal-header">
          <div>
            <h3>Project collaboration</h3>
            <p>Invite a registered user to help work on this project.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={invite} className="collaboration-form">
          <label htmlFor="collaborator-email">Collaborator email</label>
          <div>
            <input
              id="collaborator-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              required
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Checking…' : 'Invite'}
            </button>
          </div>
          <small>The email must already be registered in ProjectManager.</small>
        </form>

        {error && <p className="error collaboration-message">{error}</p>}
        {success && <p className="collaboration-success">{success}</p>}

        <section className="collaborator-list">
          <h4>People with access <span>{collaborators.length}</span></h4>
          {loading && <p className="collaborator-empty">Loading collaborators…</p>}
          {!loading && collaborators.map((collaborator) => (
            <article key={collaborator.id}>
              <span>{collaborator.name[0]?.toUpperCase()}</span>
              <p><b>{collaborator.name}</b><small>{collaborator.email}</small></p>
              <em className={collaborator.status === 'pending' ? 'pending' : ''}>
                {collaborator.status === 'pending' ? 'Pending' : 'Can edit'}
              </em>
            </article>
          ))}
          {!loading && !collaborators.length && (
            <p className="collaborator-empty">No collaborators have been invited yet.</p>
          )}
        </section>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-secondary">Done</button>
        </div>
      </div>
    </div>
  );
}
