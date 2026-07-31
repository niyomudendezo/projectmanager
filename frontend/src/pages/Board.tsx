import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../store/boardStore';
import Sidebar from '../components/Sidebar';
import KanbanBoard from '../components/KanbanBoard';
import CollaborationModal from '../components/CollaborationModal';

export default function Board() {
  const { id } = useParams<{ id: string }>();
  const { activeProject, loading, error, fetchProject, fetchProjects } = useBoardStore();
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'list' | 'timeline' | 'calendar'>('board');
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [showCollaboration, setShowCollaboration] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (id) fetchProject(Number(id));
  }, [id, fetchProject, fetchProjects]);

  const columns = activeProject?.columns ?? [];
  const tasks = columns.flatMap((column) => column.tasks);
  const completed = columns
    .filter((column) => /done|complete|finished/i.test(column.name))
    .reduce((sum, column) => sum + column.tasks.length, 0);
  const inProgress = columns
    .filter((column) => /progress|doing|active/i.test(column.name))
    .reduce((sum, column) => sum + column.tasks.length, 0);
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const taskRows = columns.flatMap((column) => column.tasks.map((task) => ({ task, column })));
  const visibleRows = taskRows.filter(({ task, column }) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query);
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || column.id === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });
  const activeFilterCount = Number(priorityFilter !== 'all') + Number(statusFilter !== 'all');
  const calendarMeta = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { year, month, firstDay, days };
  }, [calendarDate]);

  return (
    <div className="app-layout wrike-board-page">
      <Sidebar />
      <main className="app-main">
        <header className="wrike-project-header">
          <div className="wrike-breadcrumb">
            <button onClick={() => navigate('/dashboard')}>Projects</button>
            <span>/</span>
            <b>{activeProject?.name ?? 'Loading project…'}</b>
          </div>
          <div className="wrike-project-title-row">
            <div className="wrike-project-icon">{activeProject?.name?.[0]?.toUpperCase() || 'P'}</div>
            <div className="wrike-project-title">
              <h1>{activeProject?.name ?? 'Loading project…'}</h1>
              <p>{activeProject?.description || 'Organize and move tasks through your project workflow.'}</p>
            </div>
            {activeProject?.role !== 'collaborator' && (
              <button className="wrike-share-button" onClick={() => setShowCollaboration(true)}>
                <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M16 5a3 3 0 010 6M18 14c2 .7 3 2.5 3 5"/></svg>
                Share
              </button>
            )}
          </div>

          <div className="wrike-project-summary">
            <div className="wrike-progress-summary">
              <div className="wrike-progress-ring" style={{ background: `conic-gradient(#28b889 ${progress}%, #e8edf3 ${progress}% 100%)` }}>
                <span>{progress}%</span>
              </div>
              <p><b>Project progress</b><small>{completed} of {tasks.length} tasks completed</small></p>
            </div>
            <div className="wrike-summary-stat"><span className="gray" /> <p><b>{Math.max(0, tasks.length - completed - inProgress)}</b><small>To do</small></p></div>
            <div className="wrike-summary-stat"><span className="orange" /> <p><b>{inProgress}</b><small>In progress</small></p></div>
            <div className="wrike-summary-stat"><span className="green" /> <p><b>{completed}</b><small>Completed</small></p></div>
            <div className="wrike-summary-stat"><span className="purple" /> <p><b>{columns.length}</b><small>Statuses</small></p></div>
          </div>

          <nav className="wrike-view-tabs">
            <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/></svg>
              Board
            </button>
            <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
              <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
              List
            </button>
            <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>
              <svg viewBox="0 0 24 24"><path d="M4 19V5M4 7h7v4H4M11 12h9v4h-9"/></svg>
              Timeline
            </button>
            <button className={view === 'calendar' ? 'active' : ''} onClick={() => setView('calendar')}>
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>
              Calendar
            </button>
          </nav>
        </header>

        <section className="wrike-board-toolbar">
          <div><h2>{view[0].toUpperCase() + view.slice(1)} view</h2><span>{visibleRows.length} of {tasks.length} tasks</span></div>
          <div className="wrike-toolbar-actions">
            <div className="wrike-filter-wrap">
              <button className={showFilters || activeFilterCount ? 'active' : ''} onClick={() => setShowFilters(!showFilters)}>
                <svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg> Filter
                {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
              </button>
              {showFilters && (
                <div className="wrike-filter-popover">
                  <div><h4>Filter tasks</h4><button onClick={() => { setPriorityFilter('all'); setStatusFilter('all'); }}>Clear all</button></div>
                  <label>Priority</label>
                  <div className="wrike-filter-options">
                    {(['all', 'high', 'medium', 'low'] as const).map((value) => (
                      <button key={value} className={priorityFilter === value ? 'selected' : ''} onClick={() => setPriorityFilter(value)}>{value}</button>
                    ))}
                  </div>
                  <label>Status</label>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
                    <option value="all">All statuses</option>
                    {columns.map((column) => <option key={column.id} value={column.id}>{column.name} ({column.tasks.length})</option>)}
                  </select>
                  <button className="wrike-apply-filter" onClick={() => setShowFilters(false)}>Show {visibleRows.length} tasks</button>
                </div>
              )}
            </div>
            <div className={`wrike-board-search ${showSearch || search ? 'open' : ''}`}>
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" autoFocus={showSearch} />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            </div>
            {!showSearch && !search && <button onClick={() => setShowSearch(true)} aria-label="Search tasks"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button>}
            <button><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></button>
          </div>
        </section>

        <div className="board-body wrike-board-body">
          {loading && (
            <div className="wrike-board-loading">
              <span /><span /><span />
              <p>Loading tasks from your workspace…</p>
            </div>
          )}
          {error && <div className="wrike-board-error"><span>!</span><p>{error}</p><button onClick={() => id && fetchProject(Number(id))}>Try again</button></div>}
          {!loading && activeProject && view === 'board' && <KanbanBoard search={search} priority={priorityFilter} status={statusFilter} />}
          {!loading && activeProject && view === 'list' && (
            <div className="wrike-list-view">
              <div className="wrike-list-head"><span>Task name</span><span>Status</span><span>Priority</span><span>Created</span><span>Progress</span></div>
              {visibleRows.map(({ task, column }) => {
                const columnIndex = columns.findIndex((item) => item.id === column.id);
                const itemProgress = columns.length > 1 ? Math.round((columnIndex / (columns.length - 1)) * 100) : 0;
                return (
                  <button className="wrike-list-row" key={task.id}>
                    <span><i>{task.title[0]?.toUpperCase()}</i><p><b>{task.title}</b><small>{task.description || 'No description'}</small></p></span>
                    <span><i className={`status ${/done|complete/i.test(column.name) ? 'done' : /progress/i.test(column.name) ? 'progress' : ''}`} />{column.name}</span>
                    <span><em className={`priority-${task.priority}`}>{task.priority}</em></span>
                    <span>{task.created_at ? new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                    <span><i className="list-progress"><b style={{ width: `${itemProgress}%` }} /></i>{itemProgress}%</span>
                  </button>
                );
              })}
              {!visibleRows.length && <div className="wrike-view-empty">{tasks.length ? 'No tasks match your search and filters.' : 'No tasks to display. Add a task from Board view.'}</div>}
            </div>
          )}
          {!loading && activeProject && view === 'timeline' && (
            <div className="wrike-timeline-view">
              <div className="wrike-timeline-head" style={{ gridTemplateColumns: `220px repeat(${Math.max(columns.length, 1)}, minmax(120px, 1fr))` }}>
                <span>Tasks</span>
                {columns.map((column) => <span key={column.id}>{column.name}</span>)}
              </div>
              {visibleRows.map(({ task, column }) => {
                const position = Math.max(0, columns.findIndex((item) => item.id === column.id));
                return (
                  <div className="wrike-timeline-row" key={task.id} style={{ gridTemplateColumns: `220px repeat(${Math.max(columns.length, 1)}, minmax(120px, 1fr))` }}>
                    <span><b>{task.title}</b><small>{task.priority} priority</small></span>
                    <div className="wrike-timeline-track" style={{ gridColumn: `2 / span ${Math.max(columns.length, 1)}` }}>
                      <i style={{ left: `${(position / Math.max(columns.length, 1)) * 100}%`, width: `${100 / Math.max(columns.length, 1)}%` }}>
                        <b>{column.name}</b>
                      </i>
                    </div>
                  </div>
                );
              })}
              {!visibleRows.length && <div className="wrike-view-empty">{tasks.length ? 'No tasks match your search and filters.' : 'Your task timeline will appear here.'}</div>}
            </div>
          )}
          {!loading && activeProject && view === 'calendar' && (
            <div className="wrike-calendar-view">
              <div className="wrike-calendar-title">
                <button aria-label="Previous month" onClick={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}>‹</button>
                <h3>{calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button aria-label="Next month" onClick={() => setCalendarDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}>›</button>
                <span>Tasks are shown from their start date through their end date</span>
              </div>
              <div className="wrike-calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <b className="wrike-calendar-weekday" key={day}>{day}</b>)}
                {Array.from({ length: calendarMeta.firstDay }).map((_, index) => <div className="wrike-calendar-day muted" key={`blank-${index}`} />)}
                {Array.from({ length: calendarMeta.days }, (_, index) => index + 1).map((day) => {
                  const dayTasks = visibleRows.filter(({ task }) => {
                    const cellDate = `${calendarMeta.year}-${String(calendarMeta.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (task.start_date || task.end_date) {
                      const fromDate = task.start_date || task.end_date!;
                      const toDate = task.end_date || task.start_date!;
                      return cellDate >= fromDate && cellDate <= toDate;
                    }
                    if (!task.created_at) return false;
                    const created = new Date(task.created_at);
                    return created.getFullYear() === calendarMeta.year && created.getMonth() === calendarMeta.month && created.getDate() === day;
                  });
                  const today = day === new Date().getDate() && calendarMeta.month === new Date().getMonth();
                  return (
                    <div className={`wrike-calendar-day ${today ? 'today' : ''}`} key={day}>
                      <span>{day}</span>
                      {dayTasks.slice(0, 3).map(({ task, column }) => (
                        <button
                          key={task.id}
                          title={`${task.title} · ${column.name} · From ${task.start_date || 'not set'} ${task.start_time?.slice(0, 5) || ''} to ${task.end_date || 'not set'} ${task.end_time?.slice(0, 5) || ''}`}
                        >
                          <i />
                          <span>
                            <b>{task.title}</b>
                            {(task.start_date || task.end_date) && (
                              <small>
                                {task.start_date || 'Open'}{task.start_time ? ` ${task.start_time.slice(0, 5)}` : ''}
                                {' → '}
                                {task.end_date || 'Open'}{task.end_time ? ` ${task.end_time.slice(0, 5)}` : ''}
                              </small>
                            )}
                          </span>
                        </button>
                      ))}
                      {dayTasks.length > 3 && <small>+{dayTasks.length - 3} more</small>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      {showCollaboration && activeProject && (
        <CollaborationModal projectId={activeProject.id} onClose={() => setShowCollaboration(false)} />
      )}
    </div>
  );
}
