const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const { getDb, checkDatabase, config } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

const oid = (value) => value ? String(value) : null;
const newId = () => randomUUID();
const now = () => new Date();
const defaultColumns = () => ['To Do', 'In Progress', 'Done'].map((name, position) => ({
  _id: newId(), name, position, tasks: [],
}));

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
  return process.env.JWT_SECRET;
}
function token(user) {
  return jwt.sign({ sub: String(user._id), name: user.name, email: user.email }, secret(), { expiresIn: '7d' });
}
function auth(req, res, next) {
  const value = req.get('authorization') || '';
  if (!value.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(value.slice(7), secret()); return next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}
function fail(res, error, status = 500) {
  console.error(error);
  const configuration = /configuration is missing|JWT_SECRET/.test(error.message || '');
  return res.status(configuration ? 503 : status).json({
    error: configuration ? error.message : 'Server error',
    ...(process.env.NODE_ENV !== 'production' && !configuration ? { message: error.message } : {}),
  });
}
function userJson(user) { return { id: String(user._id), name: user.name, email: user.email }; }
function taskJson(task, columnId) {
  return { ...task, _id: undefined, id: String(task._id), column_id: String(columnId), created_at: task.created_at?.toISOString?.() || task.created_at };
}
function projectJson(project, role = 'owner') {
  return {
    id: String(project._id), user_id: String(project.user_id), name: project.name,
    description: project.description || '', created_at: project.created_at?.toISOString?.() || project.created_at,
    role,
    columns: (project.columns || []).sort((a, b) => a.position - b.position).map((column) => ({
      id: String(column._id), project_id: String(project._id), name: column.name, position: column.position,
      tasks: (column.tasks || []).sort((a, b) => a.position - b.position).map((task) => taskJson(task, column._id)),
    })),
  };
}
async function getProject(id) {
  const projectId = oid(id); if (!projectId) return null;
  return (await getDb()).collection('projects').findOne({ _id: projectId });
}
function roleFor(project, userId) {
  if (String(project.user_id) === String(userId)) return 'owner';
  return (project.collaborators || []).some((c) => String(c.user_id) === String(userId) && c.status === 'accepted') ? 'collaborator' : null;
}
function findColumn(project, id) { return (project.columns || []).find((c) => String(c._id) === String(id)); }
function findTask(project, id) {
  for (const column of project.columns || []) {
    const task = (column.tasks || []).find((item) => String(item._id) === String(id));
    if (task) return { task, column };
  }
  return null;
}
async function projectContainingColumn(id) {
  const columnId = oid(id); if (!columnId) return null;
  return (await getDb()).collection('projects').findOne({ 'columns._id': columnId });
}
async function projectContainingTask(id) {
  const taskId = oid(id); if (!taskId) return null;
  return (await getDb()).collection('projects').findOne({ 'columns.tasks._id': taskId });
}

app.get('/api/health', async (_req, res) => {
  try { await checkDatabase(); res.json({ status: 'ok', database: 'connected', provider: 'mysql', database_name: config().database }); }
  catch (error) { const c = config(); res.status(503).json({ status: 'error', database: 'disconnected', provider: 'mysql', configured: Boolean(c.user && c.password && c.database), error: error.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  try {
    const db = await getDb();
    if (await db.collection('users').findOne({ email })) return res.status(409).json({ error: 'Email already registered' });
    const user = { _id: newId(), name, email, password: await bcrypt.hash(password, 12), created_at: now() };
    await db.collection('users').insertOne(user);
    await db.collection('projects').insertOne({ _id: newId(), user_id: user._id, name: 'My First Project', description: 'Welcome to your project board!', created_at: now(), columns: defaultColumns(), collaborators: [] });
    res.status(201).json({ token: token(user), user: userJson(user) });
  } catch (error) { fail(res, error); }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await (await getDb()).collection('users').findOne({ email });
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: token(user), user: userJson(user) });
  } catch (error) { fail(res, error); }
});

app.get('/api/projects', auth, async (req, res) => {
  try { const rows = await (await getDb()).collection('projects').find({ user_id: oid(req.user.sub) }).sort({ created_at: -1 }).toArray(); res.json(rows.map((p) => projectJson(p))); }
  catch (error) { fail(res, error); }
});
app.post('/api/projects', auth, async (req, res) => {
  const name = String(req.body.name || '').trim(); if (!name) return res.status(400).json({ error: 'Name required' });
  try { const project = { _id: newId(), user_id: oid(req.user.sub), name, description: req.body.description || '', created_at: now(), columns: defaultColumns(), collaborators: [] }; await (await getDb()).collection('projects').insertOne(project); res.status(201).json(projectJson(project)); }
  catch (error) { fail(res, error); }
});
app.get('/api/projects/:id', auth, async (req, res) => {
  try { const project = await getProject(req.params.id); const role = project && roleFor(project, req.user.sub); if (!role) return res.status(404).json({ error: 'Not found' }); res.json(projectJson(project, role)); }
  catch (error) { fail(res, error); }
});
app.put('/api/projects/:id', auth, async (req, res) => {
  try { const project = await getProject(req.params.id); if (!project || roleFor(project, req.user.sub) !== 'owner') return res.status(404).json({ error: 'Not found' }); await (await getDb()).collection('projects').updateOne({ _id: project._id }, { $set: { name: req.body.name, description: req.body.description || '' } }); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});
app.delete('/api/projects/:id', auth, async (req, res) => {
  try { const project = await getProject(req.params.id); if (!project || roleFor(project, req.user.sub) !== 'owner') return res.status(404).json({ error: 'Not found' }); await (await getDb()).collection('projects').deleteOne({ _id: project._id }); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

app.get('/api/projects/:id/collaborators', auth, async (req, res) => {
  try { const project = await getProject(req.params.id); if (!project || roleFor(project, req.user.sub) !== 'owner') return res.status(403).json({ error: 'Only the project owner can manage collaborators' }); const db = await getDb(); const output = []; for (const c of project.collaborators || []) { const user = await db.collection('users').findOne({ _id: c.user_id }); if (user) output.push({ ...userJson(user), status: c.status, created_at: c.created_at }); } res.json(output); }
  catch (error) { fail(res, error); }
});
app.post('/api/projects/:id/collaborators', auth, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  try { const project = await getProject(req.params.id); if (!project || roleFor(project, req.user.sub) !== 'owner') return res.status(403).json({ error: 'Only the project owner can manage collaborators' }); const db = await getDb(); const user = await db.collection('users').findOne({ email }); if (!user) return res.status(404).json({ error: 'No registered user was found with this email' }); if (String(user._id) === req.user.sub) return res.status(400).json({ error: 'You already own this project' }); if ((project.collaborators || []).some((c) => String(c.user_id) === String(user._id))) return res.status(409).json({ error: 'This user is already a collaborator' }); await db.collection('projects').updateOne({ _id: project._id }, { $push: { collaborators: { user_id: user._id, invited_by: oid(req.user.sub), status: 'pending', created_at: now() } } }); res.status(201).json({ ...userJson(user), status: 'pending' }); }
  catch (error) { fail(res, error); }
});

app.post('/api/columns', auth, async (req, res) => {
  try { const project = await getProject(req.body.project_id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); const name = String(req.body.name || '').trim(); if (!name) return res.status(400).json({ error: 'project_id and name required' }); const column = { _id: newId(), name, position: project.columns?.length || 0, tasks: [] }; await (await getDb()).collection('projects').updateOne({ _id: project._id }, { $push: { columns: column } }); res.status(201).json({ id: String(column._id), project_id: String(project._id), name, position: column.position, tasks: [] }); }
  catch (error) { fail(res, error); }
});
app.put('/api/columns/:id', auth, async (req, res) => {
  try { const project = await projectContainingColumn(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); await (await getDb()).collection('projects').updateOne({ _id: project._id, 'columns._id': oid(req.params.id) }, { $set: { 'columns.$.name': req.body.name } }); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});
app.delete('/api/columns/:id', auth, async (req, res) => {
  try { const project = await projectContainingColumn(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); await (await getDb()).collection('projects').updateOne({ _id: project._id }, { $pull: { columns: { _id: oid(req.params.id) } } }); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

app.get('/api/tasks/:id', auth, async (req, res) => {
  try { const project = await projectContainingTask(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(404).json({ error: 'Task not found' }); const found = findTask(project, req.params.id); res.json({ ...taskJson(found.task, found.column._id), column_name: found.column.name, column_position: found.column.position, project_id: String(project._id), project_name: project.name, project_description: project.description, project_columns: project.columns.map((c) => ({ id: String(c._id), name: c.name, position: c.position })) }); }
  catch (error) { fail(res, error); }
});
app.post('/api/tasks', auth, async (req, res) => {
  try { const project = await projectContainingColumn(req.body.column_id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); const column = findColumn(project, req.body.column_id); const title = String(req.body.title || '').trim(); if (!title) return res.status(400).json({ error: 'column_id and title required' }); const task = { _id: newId(), title, description: req.body.description || '', priority: req.body.priority || 'medium', start_date: req.body.start_date || null, end_date: req.body.end_date || null, start_time: req.body.start_time || null, end_time: req.body.end_time || null, position: column.tasks?.length || 0, created_at: now() }; await (await getDb()).collection('projects').updateOne({ _id: project._id, 'columns._id': column._id }, { $push: { 'columns.$.tasks': task } }); res.status(201).json(taskJson(task, column._id)); }
  catch (error) { fail(res, error); }
});
app.put('/api/tasks/:id', auth, async (req, res) => {
  try { const project = await projectContainingTask(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); const found = findTask(project, req.params.id); Object.assign(found.task, { title: req.body.title, description: req.body.description || '', priority: req.body.priority || 'medium', start_date: req.body.start_date || null, end_date: req.body.end_date || null, start_time: req.body.start_time || null, end_time: req.body.end_time || null }); await (await getDb()).collection('projects').replaceOne({ _id: project._id }, project); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});
app.put('/api/tasks/:id/move', auth, async (req, res) => {
  try { const project = await projectContainingTask(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); const found = findTask(project, req.params.id); const target = findColumn(project, req.body.column_id); if (!target) return res.status(403).json({ error: 'Forbidden' }); found.column.tasks = found.column.tasks.filter((t) => String(t._id) !== req.params.id); target.tasks.splice(Number(req.body.position || 0), 0, found.task); target.tasks.forEach((t, i) => { t.position = i; }); found.column.tasks.forEach((t, i) => { t.position = i; }); await (await getDb()).collection('projects').replaceOne({ _id: project._id }, project); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});
app.delete('/api/tasks/:id', auth, async (req, res) => {
  try { const project = await projectContainingTask(req.params.id); if (!project || !roleFor(project, req.user.sub)) return res.status(403).json({ error: 'Forbidden' }); const found = findTask(project, req.params.id); found.column.tasks = found.column.tasks.filter((t) => String(t._id) !== req.params.id); await (await getDb()).collection('projects').replaceOne({ _id: project._id }, project); res.json({ success: true }); }
  catch (error) { fail(res, error); }
});

app.get('/api/invitations', auth, async (req, res) => {
  try { const db = await getDb(); const projects = await db.collection('projects').find({ collaborators: { $elemMatch: { user_id: oid(req.user.sub) } } }).toArray(); const output = []; for (const project of projects) { const invitation = project.collaborators.find((c) => String(c.user_id) === req.user.sub); const inviter = await db.collection('users').findOne({ _id: invitation.invited_by }); const owner = await db.collection('users').findOne({ _id: project.user_id }); const tasks = project.columns.flatMap((c) => c.tasks.map((t) => ({ ...taskJson(t, c._id), column_name: c.name }))); const team = [{ ...userJson(owner), role: 'owner' }]; for (const c of project.collaborators.filter((item) => item.status === 'accepted')) { const member = await db.collection('users').findOne({ _id: c.user_id }); if (member) team.push({ ...userJson(member), role: 'collaborator' }); } output.push({ project_id: String(project._id), status: invitation.status, created_at: invitation.created_at, project_name: project.name, project_description: project.description, invited_by_name: inviter?.name, invited_by_email: inviter?.email, task_count: tasks.length, tasks, team }); } res.json(output); }
  catch (error) { fail(res, error); }
});
app.put('/api/invitations/:id/accept', auth, async (req, res) => {
  try { const project = await getProject(req.params.id); const invitation = project?.collaborators?.find((c) => String(c.user_id) === req.user.sub && c.status === 'pending'); if (!invitation) return res.status(404).json({ error: 'Pending invitation not found' }); invitation.status = 'accepted'; await (await getDb()).collection('projects').replaceOne({ _id: project._id }, project); res.json({ success: true, project_id: req.params.id }); }
  catch (error) { fail(res, error); }
});

const dist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(dist));
app.get(/.*/, (req, res, next) => req.path.startsWith('/api/') ? next() : res.sendFile(path.join(dist, 'index.html')));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => fail(res, error));
app.listen(PORT, () => console.log(`ProjectManager listening on port ${PORT} with MySQL`));
