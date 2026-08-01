import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBoardStore } from '../store/boardStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { projects, activeProject } = useBoardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(() => {
    return location.pathname.startsWith('/board/') ? location.pathname.split('/')[2] || null : null;
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const activeProjectId = location.pathname.startsWith('/board/')
    ? location.pathname.split('/')[2]
    : null;

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span className="sidebar-brand-name">ProjectManager</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{!collapsed && 'MENU'}</div>
        <button
          className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
          title="Dashboard"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {!collapsed && <span>Dashboard</span>}
        </button>

        <button
          className={`sidebar-item ${location.pathname === '/invitations' ? 'active' : ''}`}
          onClick={() => navigate('/invitations')}
          title="Invitations"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
          </svg>
          {!collapsed && <span>Invitations</span>}
        </button>

        <button
          className={`sidebar-item ${location.pathname === '/team-projects' ? 'active' : ''}`}
          onClick={() => navigate('/team-projects')}
          title="Inv Projects"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M2 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3 0 5 1.5 5 4"/>
          </svg>
          {!collapsed && <span>Inv Projects</span>}
        </button>

        <button
          className={`sidebar-item ${location.pathname === '/dashboard' ? '' : ''}`}
          onClick={() => navigate('/dashboard')}
          title="Projects"
          style={{ opacity: 0.85 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
          {!collapsed && <span>Projects</span>}
        </button>

        {projects.length > 0 && (
          <>
            <div className="sidebar-section-label">{!collapsed && 'MY PROJECTS'}</div>
            {projects.map((p) => {
              const sidebarProject = activeProject?.id === p.id ? activeProject : p;
              const tasks = (sidebarProject.columns ?? []).flatMap((column) =>
                column.tasks.map((task) => ({ task, columnName: column.name }))
              );
              const expanded = expandedProjectId === p.id && !collapsed;

              return (
                <div className={`sidebar-project-group ${expanded ? 'expanded' : ''}`} key={p.id}>
                  <div className={`sidebar-item sidebar-project-item ${activeProjectId === String(p.id) ? 'active' : ''}`}>
                    <button
                      className="sidebar-project-toggle"
                      onClick={() => {
                        if (collapsed) {
                          navigate(`/board/${p.id}`);
                          return;
                        }
                        setExpandedProjectId(expanded ? null : p.id);
                      }}
                      title={collapsed ? p.name : `Show tasks in ${p.name}`}
                      aria-expanded={expanded}
                    >
                      <span className="sidebar-project-dot" />
                      {!collapsed && (
                        <>
                          <span className="sidebar-project-name">{p.name}</span>
                          <span className="sidebar-project-count">{tasks.length}</span>
                          <svg className="sidebar-project-chevron" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
                        </>
                      )}
                    </button>
                    {!collapsed && (
                      <button className="sidebar-project-open" onClick={() => navigate(`/board/${p.id}`)} title={`Open ${p.name} board`}>
                        <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </button>
                    )}
                  </div>

                  {expanded && (
                    <div className="sidebar-task-dropdown">
                      {tasks.map(({ task, columnName }) => (
                        <button key={task.id} onClick={() => navigate(`/task/${task.id}`)} title={`View roadmap for ${task.title}`}>
                          <span className={`sidebar-task-priority priority-${task.priority}`} />
                          <span><b>{task.title}</b><small>{columnName}</small></span>
                        </button>
                      ))}
                      {!tasks.length && <p>No tasks in this project</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
          )}
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
