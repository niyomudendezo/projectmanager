# 📋 ProjectManager

A full-stack Kanban-based project management web application built with **React + TypeScript**, **Node.js/Express**, and **Supabase PostgreSQL**. Inspired by tools like Trello, Asana, and Monday.com.

🔗 **Live Repository:** [https://github.com/niyomudendezo/projectmanager](https://github.com/niyomudendezo/projectmanager)

---

## ✨ Features

- 🔐 **Authentication** — Register & Login with JWT-based sessions
- 📁 **Project Management** — Create, view, and delete projects with progress tracking
- 🗂️ **Kanban Board** — Drag-and-drop tasks across customizable columns
- ✅ **Task Management** — Add tasks with title, description, priority, and due date
- 🎨 **Priority Badges** — Visual Low / Medium / High priority indicators
- 📅 **Due Dates** — Overdue task highlighting
- 📊 **Dashboard Stats** — Total projects, tasks, high-priority count
- 📈 **Progress Bars** — Per-project completion tracking
- 👥 **Collaboration** — Invite team members to projects
- 📱 **Responsive** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Zustand     |
| Styling   | Pure CSS (custom design system)         |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable      |
| HTTP      | Axios                                   |
| Routing   | React Router DOM v7                     |
| Backend   | Node.js 20+, Express                    |
| Database  | Supabase PostgreSQL                     |
| Auth      | JWT (JSON Web Tokens)                   |
| Server    | Hostinger Node.js Web App               |

---

## 📁 Project Structure

```
projectmanager/
├── backend/
│   ├── config/
│   │   ├── database.php       # DB connection
│   │   └── jwt.php            # JWT helpers
│   ├── middleware/
│   │   └── auth.php           # JWT auth middleware
│   ├── routes/
│   │   ├── auth.php           # Register / Login
│   │   ├── projects.php       # CRUD projects
│   │   ├── columns.php        # CRUD columns
│   │   ├── tasks.php          # CRUD + move tasks
│   │   └── invitations.php    # Team invitations
│   ├── .htaccess              # URL routing
│   └── index.php              # Entry point
├── frontend/
│   ├── src/
│   │   ├── api/client.ts      # Axios instance
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── store/             # Zustand state management
│   │   ├── types/             # TypeScript interfaces
│   │   └── index.css          # Global styles
│   ├── package.json
│   └── vite.config.ts
├── database.sql               # Database schema
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js v20+ and npm
- A Supabase project

---

### 1. Clone the Repository

```bash
git clone https://github.com/niyomudendezo/projectmanager.git
cd projectmanager
```

---

### 2. Supabase Database Setup

1. Create a Supabase project.
2. Open **SQL Editor**, create a new query, paste `database.sql`, and click **Run**.
3. Open **Connect** and copy the **Transaction pooler** connection string.
4. Set `DATABASE_URL` and `JWT_SECRET` in the PHP server environment. See `.env.example` and `SUPABASE_SETUP.md`.

---

### 3. Server Setup

1. Configure the server environment:
   ```env
   SUPABASE_URL=https://PROJECT_REF.supabase.co
   SUPABASE_API_KEY=automatically-added-by-hostinger
   JWT_SECRET=replace-with-a-long-random-secret
   ```

2. Install and run locally:
   ```bash
   npm install
   npm run build
   npm start
   ```

3. Verify the database at `http://localhost:3000/api/health`.

4. Make sure **Apache** is running from XAMPP/LAMPP

5. Verify the API is working:
   ```
   http://localhost/projectmanager/backend/
   ```

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Start only the Vite development server when working on frontend UI:
```bash
npm run dev
```

The complete production-style app is served by Express at **http://localhost:3000**.

---

### 5. Build for Production

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`. Copy them to your Apache web root if needed.

---

## 🚀 Usage

1. Open `http://localhost:5173` in your browser
2. Click **Register** to create a new account
3. **Login** with your credentials
4. Click **New Project** to create your first project
5. Open a project to access the **Kanban Board**
6. Add **columns** (e.g., To Do, In Progress, Done)
7. Add **tasks** with priority and due dates
8. **Drag and drop** tasks between columns

---

## 📸 Screenshots

| Login Page | Dashboard | Kanban Board |
|------------|-----------|--------------|
| Split-card login with avatar | Stats + project cards with progress | Drag-and-drop columns with priority badges |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login & get JWT token |
| GET | `/projects` | Get all user projects |
| POST | `/projects` | Create new project |
| GET | `/projects/:id` | Get project with columns & tasks |
| DELETE | `/projects/:id` | Delete project |
| POST | `/columns` | Add column to project |
| PUT | `/columns/:id` | Rename column |
| DELETE | `/columns/:id` | Delete column |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| PUT | `/tasks/:id/move` | Move task to column |
| DELETE | `/tasks/:id` | Delete task |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Niyomudende Zo**
- GitHub: [@niyomudendezo](https://github.com/niyomudendezo)
