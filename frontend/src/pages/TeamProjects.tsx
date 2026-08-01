import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import { useBoardStore } from '../store/boardStore';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'collaborator';
}

interface TeamProject {
  project_id: string;
  project_name: string;
  project_description: string;
  status: 'pending' | 'accepted';
  task_count: number;
  invited_by_name: string;
  team: TeamMember[];
}

export default function TeamProjects() {
  const navigate = useNavigate();
  const { fetchProjects } = useBoardStore();
  const [projects, setProjects] = useState<TeamProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
    api.get('/invitations')
      .then(({ data }) => setProjects(data.filter((item: TeamProject) => item.status === 'accepted')))
      .catch(() => setError('Could not load your invited team projects.'))
      .finally(() => setLoading(false));
  }, [fetchProjects]);

  return (
    <div className="app-layout team-projects-page">
      <Sidebar />
      <main className="app-main">
        <header className="invitations-header team-projects-header">
          <p>TEAM WORKSPACE</p>
          <h1>Invited projects</h1>
          <span>Projects where you collaborate with other registered users.</span>
        </header>
        <div className="team-projects-content">
          {error && <p className="error">{error}</p>}
          {loading && <div className="invitations-loading">Loading team projects…</div>}
          {!loading && projects.map((project) => (
            <article className="team-project-card" key={project.project_id}>
              <div className="team-project-top">
                <div className="invitation-project-icon">{project.project_name[0]?.toUpperCase()}</div>
                <div>
                  <span>SHARED BY {project.invited_by_name}</span>
                  <h2>{project.project_name}</h2>
                  <p>{project.project_description || 'Shared collaboration project'}</p>
                </div>
                <button className="btn-primary" onClick={() => navigate(`/board/${project.project_id}`)}>Open project</button>
              </div>
              <div className="team-project-meta">
                <span><b>{project.task_count}</b> project tasks</span>
                <span><b>{project.team.length}</b> team members</span>
              </div>
              <section className="team-member-section">
                <h3>People working on this project</h3>
                <div className="team-member-list">
                  {project.team.map((member) => (
                    <div className="team-member" key={member.id}>
                      <span>{member.name[0]?.toUpperCase()}</span>
                      <p><b>{member.name}</b><small>{member.email}</small></p>
                      <em>{member.role}</em>
                    </div>
                  ))}
                </div>
              </section>
            </article>
          ))}
          {!loading && !projects.length && (
            <div className="team-projects-empty">
              <div>👥</div>
              <h2>No invited projects yet</h2>
              <p>Accept a project invitation first, then it will appear here with its team.</p>
              <button className="btn-primary" onClick={() => navigate('/invitations')}>View invitations</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
