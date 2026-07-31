const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabase, checkDatabase, readSupabaseConfig } = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
}

function issueToken(user) {
  return jwt.sign(
    { sub: Number(user.id), name: user.name, email: user.email },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), jwtSecret());
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function fail(res, error, status = 500) {
  console.error(error);
  const message = process.env.NODE_ENV === 'production' ? undefined : error.message;
  return res.status(status).json({ error: status === 500 ? 'Server error' : error.message, ...(message && { message }) });
}

async function projectAccess(projectId, userId) {
  const db = getSupabase();
  const { data: project, error } = await db
    .from('projects').select('id,user_id').eq('id', projectId).maybeSingle();
  if (error) throw error;
  if (!project) return null;
  if (Number(project.user_id) === Number(userId)) return { project, role: 'owner' };

  const { data: collaborator, error: collaboratorError } = await db
    .from('project_collaborators').select('status')
    .eq('project_id', projectId).eq('user_id', userId).eq('status', 'accepted').maybeSingle();
  if (collaboratorError) throw collaboratorError;
  return collaborator ? { project, role: 'collaborator' } : null;
}

async function ownerAccess(projectId, userId) {
  const db = getSupabase();
  const { data, error } = await db.from('projects').select('id,user_id')
    .eq('id', projectId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function columnAccess(columnId, userId) {
  const db = getSupabase();
  const { data, error } = await db.from('columns_table').select('id,project_id')
    .eq('id', columnId).maybeSingle();
  if (error) throw error;
  if (!data || !(await projectAccess(data.project_id, userId))) return null;
  return data;
}

async function taskAccess(taskId, userId) {
  const db = getSupabase();
  const { data, error } = await db.from('tasks').select('id,column_id')
    .eq('id', taskId).maybeSingle();
  if (error) throw error;
  if (!data || !(await columnAccess(data.column_id, userId))) return null;
  return data;
}

async function loadProject(project, role) {
  const db = getSupabase();
  const { data: columns, error } = await db.from('columns_table').select('*')
    .eq('project_id', project.id).order('position');
  if (error) throw error;
  for (const column of columns) {
    const { data: tasks, error: taskError } = await db.from('tasks').select('*')
      .eq('column_id', column.id).order('position');
    if (taskError) throw taskError;
    column.tasks = tasks;
  }
  return { ...project, role, columns };
}

app.get('/api/health', async (_req, res) => {
  const config = readSupabaseConfig();
  try {
    await checkDatabase();
    res.json({ status: 'ok', database: 'connected', supabase_url_configured: Boolean(config.url) });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email' });

  try {
    const db = getSupabase();
    const { data: existing, error: findError } = await db.from('users').select('id').eq('email', email).maybeSingle();
    if (findError) throw findError;
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error: userError } = await db.from('users')
      .insert({ name, email, password: passwordHash }).select('id,name,email').single();
    if (userError) throw userError;
    const { data: project, error: projectError } = await db.from('projects')
      .insert({ user_id: user.id, name: 'My First Project', description: 'Welcome to your project board!' })
      .select('id').single();
    if (projectError) throw projectError;
    const { error: columnError } = await db.from('columns_table').insert([
      { project_id: project.id, name: 'To Do', position: 0 },
      { project_id: project.id, name: 'In Progress', position: 1 },
      { project_id: project.id, name: 'Done', position: 2 },
    ]);
    if (columnError) throw columnError;
    res.status(201).json({ token: issueToken(user), user });
  } catch (error) { fail(res, error); }
});

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  try {
    const db = getSupabase();
    const { data: user, error } = await db.from('users').select('id,name,email,password')
      .eq('email', email).maybeSingle();
    if (error) throw error;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const safeUser = { id: user.id, name: user.name, email: user.email };
    res.json({ token: issueToken(safeUser), user: safeUser });
  } catch (error) { fail(res, error); }
});

app.get('/api/projects', requireAuth, async (req, res) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('projects').select('*')
      .eq('user_id', req.user.sub).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(await Promise.all(data.map((project) => loadProject(project, 'owner'))));
  } catch (error) { fail(res, error); }
});

app.post('/api/projects', requireAuth, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const db = getSupabase();
    const { data: project, error } = await db.from('projects')
      .insert({ user_id: req.user.sub, name, description: req.body.description || '' }).select('*').single();
    if (error) throw error;
    const { error: columnError } = await db.from('columns_table').insert([
      { project_id: project.id, name: 'To Do', position: 0 },
      { project_id: project.id, name: 'In Progress', position: 1 },
      { project_id: project.id, name: 'Done', position: 2 },
    ]);
    if (columnError) throw columnError;
    res.status(201).json(project);
  } catch (error) { fail(res, error); }
});

app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const access = await projectAccess(req.params.id, req.user.sub);
    if (!access) return res.status(404).json({ error: 'Not found' });
    const db = getSupabase();
    const { data, error } = await db.from('projects').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json(await loadProject(data, access.role));
  } catch (error) { fail(res, error); }
});

app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    if (!(await ownerAccess(req.params.id, req.user.sub))) return res.status(404).json({ error: 'Not found' });
    const { error } = await getSupabase().from('projects')
      .update({ name: req.body.name, description: req.body.description || '' }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    if (!(await ownerAccess(req.params.id, req.user.sub))) return res.status(404).json({ error: 'Not found' });
    const { error } = await getSupabase().from('projects').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.get('/api/projects/:id/collaborators', requireAuth, async (req, res) => {
  try {
    if (!(await ownerAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Only the project owner can manage collaborators' });
    const db = getSupabase();
    const { data: rows, error } = await db.from('project_collaborators')
      .select('user_id,status,created_at').eq('project_id', req.params.id).order('created_at', { ascending: false });
    if (error) throw error;
    const output = [];
    for (const row of rows) {
      const { data: user, error: userError } = await db.from('users').select('id,name,email').eq('id', row.user_id).single();
      if (userError) throw userError;
      output.push({ ...user, status: row.status, created_at: row.created_at });
    }
    res.json(output);
  } catch (error) { fail(res, error); }
});

app.post('/api/projects/:id/collaborators', requireAuth, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
  try {
    if (!(await ownerAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Only the project owner can manage collaborators' });
    const db = getSupabase();
    const { data: user, error } = await db.from('users').select('id,name,email').eq('email', email).maybeSingle();
    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'No registered user was found with this email' });
    if (Number(user.id) === Number(req.user.sub)) return res.status(400).json({ error: 'You already own this project' });
    const { error: insertError } = await db.from('project_collaborators')
      .insert({ project_id: req.params.id, user_id: user.id, invited_by: req.user.sub });
    if (insertError?.code === '23505') return res.status(409).json({ error: 'This user is already a collaborator' });
    if (insertError) throw insertError;
    res.status(201).json({ ...user, status: 'pending' });
  } catch (error) { fail(res, error); }
});

app.post('/api/columns', requireAuth, async (req, res) => {
  const projectId = Number(req.body.project_id || 0);
  const name = String(req.body.name || '').trim();
  if (!projectId || !name) return res.status(400).json({ error: 'project_id and name required' });
  try {
    if (!(await projectAccess(projectId, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const db = getSupabase();
    const { data: last, error: lastError } = await db.from('columns_table').select('position')
      .eq('project_id', projectId).order('position', { ascending: false }).limit(1);
    if (lastError) throw lastError;
    const position = last.length ? Number(last[0].position) + 1 : 1;
    const { data, error } = await db.from('columns_table')
      .insert({ project_id: projectId, name, position }).select('*').single();
    if (error) throw error;
    res.status(201).json({ ...data, tasks: [] });
  } catch (error) { fail(res, error); }
});

app.put('/api/columns/:id', requireAuth, async (req, res) => {
  try {
    if (!(await columnAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await getSupabase().from('columns_table').update({ name: req.body.name }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.delete('/api/columns/:id', requireAuth, async (req, res) => {
  try {
    if (!(await columnAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await getSupabase().from('columns_table').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.get('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    if (!(await taskAccess(req.params.id, req.user.sub))) return res.status(404).json({ error: 'Task not found' });
    const db = getSupabase();
    const { data: task, error } = await db.from('tasks').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    const { data: column, error: columnError } = await db.from('columns_table').select('id,name,position,project_id').eq('id', task.column_id).single();
    if (columnError) throw columnError;
    const { data: project, error: projectError } = await db.from('projects').select('id,name,description').eq('id', column.project_id).single();
    if (projectError) throw projectError;
    const { data: projectColumns, error: listError } = await db.from('columns_table').select('id,name,position').eq('project_id', project.id).order('position');
    if (listError) throw listError;
    res.json({ ...task, column_name: column.name, column_position: column.position, project_id: project.id, project_name: project.name, project_description: project.description, project_columns: projectColumns });
  } catch (error) { fail(res, error); }
});

app.post('/api/tasks', requireAuth, async (req, res) => {
  const columnId = Number(req.body.column_id || 0);
  const title = String(req.body.title || '').trim();
  if (!columnId || !title) return res.status(400).json({ error: 'column_id and title required' });
  try {
    if (!(await columnAccess(columnId, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const db = getSupabase();
    const { data: last, error: lastError } = await db.from('tasks').select('position').eq('column_id', columnId).order('position', { ascending: false }).limit(1);
    if (lastError) throw lastError;
    const position = last.length ? Number(last[0].position) + 1 : 1;
    const payload = { column_id: columnId, title, description: req.body.description || '', priority: req.body.priority || 'medium', start_date: req.body.start_date || null, end_date: req.body.end_date || null, start_time: req.body.start_time || null, end_time: req.body.end_time || null, position };
    const { data, error } = await db.from('tasks').insert(payload).select('*').single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { fail(res, error); }
});

app.put('/api/tasks/:id/move', requireAuth, async (req, res) => {
  try {
    if (!(await taskAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    if (!(await columnAccess(req.body.column_id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await getSupabase().from('tasks')
      .update({ column_id: req.body.column_id, position: Number(req.body.position || 0) }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    if (!(await taskAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const payload = { title: req.body.title, description: req.body.description || '', priority: req.body.priority || 'medium', start_date: req.body.start_date || null, end_date: req.body.end_date || null, start_time: req.body.start_time || null, end_time: req.body.end_time || null };
    const { error } = await getSupabase().from('tasks').update(payload).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    if (!(await taskAccess(req.params.id, req.user.sub))) return res.status(403).json({ error: 'Forbidden' });
    const { error } = await getSupabase().from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) { fail(res, error); }
});

app.get('/api/invitations', requireAuth, async (req, res) => {
  try {
    const db = getSupabase();
    const { data: rows, error } = await db.from('project_collaborators').select('*')
      .eq('user_id', req.user.sub).order('created_at', { ascending: false });
    if (error) throw error;
    const output = [];
    for (const row of rows) {
      const { data: project, error: projectError } = await db.from('projects').select('*').eq('id', row.project_id).single();
      if (projectError) throw projectError;
      const { data: inviter, error: inviterError } = await db.from('users').select('name,email').eq('id', row.invited_by).single();
      if (inviterError) throw inviterError;
      const loaded = await loadProject(project, 'collaborator');
      const tasks = loaded.columns.flatMap((column) => column.tasks.map((task) => ({ ...task, column_name: column.name })));
      const { data: members, error: memberError } = await db.from('project_collaborators').select('user_id').eq('project_id', row.project_id).eq('status', 'accepted');
      if (memberError) throw memberError;
      const { data: owner, error: ownerError } = await db.from('users').select('id,name,email').eq('id', project.user_id).single();
      if (ownerError) throw ownerError;
      const team = [{ ...owner, role: 'owner' }];
      for (const member of members) {
        const { data: user, error: userError } = await db.from('users').select('id,name,email').eq('id', member.user_id).single();
        if (userError) throw userError;
        team.push({ ...user, role: 'collaborator' });
      }
      output.push({ project_id: row.project_id, status: row.status, created_at: row.created_at, project_name: project.name, project_description: project.description, invited_by_name: inviter.name, invited_by_email: inviter.email, task_count: tasks.length, tasks, team });
    }
    res.json(output);
  } catch (error) { fail(res, error); }
});

app.put('/api/invitations/:id/accept', requireAuth, async (req, res) => {
  try {
    const db = getSupabase();
    const { data, error } = await db.from('project_collaborators').update({ status: 'accepted' })
      .eq('project_id', req.params.id).eq('user_id', req.user.sub).eq('status', 'pending').select('project_id').maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pending invitation not found' });
    res.json({ success: true, project_id: Number(req.params.id) });
  } catch (error) { fail(res, error); }
});

const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((error, _req, res, _next) => fail(res, error));

app.listen(PORT, () => {
  console.log(`ProjectManager listening on port ${PORT}`);
});
