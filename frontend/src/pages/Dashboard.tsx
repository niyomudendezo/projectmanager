import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import type { Project } from '../types';
import Sidebar from '../components/Sidebar';

const Icon = ({ name }: { name: string }) => {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 10.5L12 3l9 7.5V21H5V10.5"/><path d="M9 21v-7h6v7"/></>,
    projects: <><path d="M3 6h7l2 2h9v12H3z"/><path d="M3 11h18"/></>,
    tasks: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6v.2h-4V21a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H2.8v-4H3a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3V2.8h4V3a1.7 1.7 0 001 1.6 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9 1.7 1.7 0 001.6 1h.2v4H21a1.7 1.7 0 00-1.6 1z"/></>,
    logout: <><path d="M10 4H4v16h6M15 8l4 4-4 4M19 12H9"/></>,
    bell: <><path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <path d="M9 18l6-6-6-6"/>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

function projectStats(project: Project) {
  const columns = project.columns ?? [];
  const tasks = columns.flatMap((column) => column.tasks ?? []);
  const done = columns
    .filter((column) => /done|complete|finished/i.test(column.name))
    .reduce((sum, column) => sum + column.tasks.length, 0);
  const active = columns
    .filter((column) => /progress|doing|active/i.test(column.name))
    .reduce((sum, column) => sum + column.tasks.length, 0);
  return { tasks: tasks.length, done, active, progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
}

export default function Dashboard() {
  const { projects, loading, error, fetchProjects, createProject, deleteProject } = useBoardStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const analytics = useMemo(() => {
    const stats = projects.map(projectStats);
    const total = stats.reduce((sum, item) => sum + item.tasks, 0);
    const done = stats.reduce((sum, item) => sum + item.done, 0);
    const active = stats.reduce((sum, item) => sum + item.active, 0);
    const todo = Math.max(0, total - done - active);
    const rate = total ? Math.round((done / total) * 100) : 0;
    const priorities = { high: 0, medium: 0, low: 0 };
    projects.forEach((project) => project.columns?.forEach((column) => column.tasks.forEach((task) => priorities[task.priority]++)));
    return { total, done, active, todo, rate, priorities };
  }, [projects]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createProject(name.trim(), description.trim());
      setName('');
      setDescription('');
      setShowForm(false);
      await fetchProjects();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pm-dashboard">
      <Sidebar />

      <main className="pm-main">
        <header className="pm-topbar">
          <div className="pm-search"><Icon name="search" /><input placeholder="Search your projects…" /></div>
          <div className="pm-top-actions">
            <button className="pm-icon-button"><Icon name="bell" /><i /></button>
            <div className="pm-top-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          </div>
        </header>

        <div className="pm-content">
          <section className="pm-welcome">
            <div>
              <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'} <span>👋</span></h1>
              <small>Here’s what’s happening with your projects today.</small>
            </div>
            <button className="pm-new-button" onClick={() => setShowForm(true)}><Icon name="plus" /> New project</button>
          </section>

          {error && <div className="pm-error">{error}<button onClick={fetchProjects}>Try again</button></div>}

          <section className="pm-stat-grid" aria-label="Project statistics">
            <article>
              <div className="blue"><Icon name="projects" /></div>
              <p><span>Total projects</span><b>{loading ? '—' : projects.length}</b><small>Stored in your workspace</small></p>
              <i className="pm-spark blue-spark" />
            </article>
            <article>
              <div className="orange"><Icon name="tasks" /></div>
              <p><span>Tasks in progress</span><b>{loading ? '—' : analytics.active}</b><small>{analytics.total} total tasks</small></p>
              <i className="pm-spark orange-spark" />
            </article>
            <article>
              <div className="green"><Icon name="tasks" /></div>
              <p><span>Tasks completed</span><b>{loading ? '—' : analytics.done}</b><small>{analytics.rate}% completion rate</small></p>
              <i className="pm-spark green-spark" />
            </article>
            <article>
              <div className="purple"><Icon name="chart" /></div>
              <p><span>Total tasks</span><b>{loading ? '—' : analytics.total}</b><small>Across all projects</small></p>
              <i className="pm-spark purple-spark" />
            </article>
          </section>

          <section className="pm-dashboard-grid">
            <div className="pm-panel pm-project-panel" id="projects">
              <div className="pm-panel-heading">
                <div><h2>Recent projects</h2><p>Progress calculated from saved Kanban tasks</p></div>
                <button onClick={() => setShowForm(true)}>Add project <Icon name="plus" /></button>
              </div>
              <div className="pm-project-list">
                {loading && [1, 2, 3].map((item) => <div className="pm-project-skeleton" key={item} />)}
                {!loading && projects.slice(0, 5).map((project, index) => {
                  const stats = projectStats(project);
                  const colors = ['#5b4dde', '#24bfa5', '#ff826a', '#3b82f6', '#e9a23b'];
                  const color = colors[index % colors.length];
                  return (
                    <article key={project.id} onClick={() => navigate(`/board/${project.id}`)}>
                      <div className="pm-project-letter" style={{ background: `${color}18`, color }}>{project.name[0].toUpperCase()}</div>
                      <div className="pm-project-info">
                        <div><h3>{project.name}</h3><span>{stats.progress}%</span></div>
                        <p>{project.description || 'No description added'}</p>
                        <div className="pm-progress"><i style={{ width: `${stats.progress}%`, background: color }} /></div>
                        <small>{stats.done} completed · {stats.tasks} tasks</small>
                      </div>
                      <button className="pm-delete-project" onClick={(event) => { event.stopPropagation(); deleteProject(project.id); }} title="Delete project"><Icon name="trash" /></button>
                      <Icon name="arrow" />
                    </article>
                  );
                })}
                {!loading && projects.length === 0 && (
                  <div className="pm-empty">
                    <div><Icon name="projects" /></div>
                    <h3>No projects yet</h3>
                    <p>Create your first project to start organizing tasks.</p>
                    <button onClick={() => setShowForm(true)}>Create project</button>
                  </div>
                )}
              </div>
            </div>

            <div className="pm-panel pm-workload-panel">
              <div className="pm-panel-heading"><div><h2>Work overview</h2><p>Live task status from your boards</p></div></div>
              <div className="pm-donut-wrap">
                <div className="pm-donut" style={{ background: `conic-gradient(#2bc49b 0 ${analytics.rate}%, #f0f3f8 ${analytics.rate}% 100%)` }}>
                  <div><b>{analytics.rate}%</b><span>complete</span></div>
                </div>
              </div>
              <div className="pm-workload-legend">
                <div><i className="todo" /><span>To do</span><b>{analytics.todo}</b></div>
                <div><i className="active" /><span>In progress</span><b>{analytics.active}</b></div>
                <div><i className="done" /><span>Completed</span><b>{analytics.done}</b></div>
              </div>
            </div>
          </section>

          <section className="pm-panel pm-analytics-panel" id="analytics">
            <div className="pm-panel-heading">
              <div><h2>Project task performance</h2><p>Task totals and completion by project</p></div>
              <span className="pm-db-badge"><i /> Live database data</span>
            </div>
            <div className="pm-chart">
              <div className="pm-chart-y"><span>{Math.max(10, analytics.total)}</span><span>{Math.ceil(Math.max(10, analytics.total) / 2)}</span><span>0</span></div>
              <div className="pm-bars">
                {(projects.length ? projects.slice(0, 8) : [{ id: 0, name: 'No data', columns: [] } as unknown as Project]).map((project) => {
                  const stats = projectStats(project);
                  const max = Math.max(analytics.total, 1);
                  return (
                    <div className="pm-bar-group" key={project.id}>
                      <div className="pm-bar-area">
                        <i className="total" style={{ height: `${Math.max(4, (stats.tasks / max) * 100)}%` }} title={`${stats.tasks} total`} />
                        <i className="complete" style={{ height: `${Math.max(stats.done ? 4 : 0, (stats.done / max) * 100)}%` }} title={`${stats.done} completed`} />
                      </div>
                      <span>{project.name.length > 12 ? `${project.name.slice(0, 11)}…` : project.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pm-chart-legend"><span><i className="total" /> Total tasks</span><span><i className="complete" /> Completed</span></div>
          </section>
        </div>
      </main>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal pm-project-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header"><div><h3>Create a new project</h3><p>Three Kanban columns will be added automatically.</p></div><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <label>Project name</label>
              <input placeholder="e.g. Website redesign" value={name} onChange={(event) => setName(event.target.value)} autoFocus required />
              <label>Description <span>(optional)</span></label>
              <textarea placeholder="What is this project about?" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
              <div className="modal-actions"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" className="pm-new-button" disabled={creating}>{creating ? 'Creating…' : 'Create project'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
