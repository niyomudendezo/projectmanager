# 📋 ProjectManager

A full-stack Kanban-based project management web application built with **React + TypeScript** (frontend) and **PHP + MySQL** (backend). Inspired by tools like Trello, Asana, and Monday.com.

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
| Backend   | PHP 8+, Apache (.htaccess routing)      |
| Database  | MySQL 8                                 |
| Auth      | JWT (JSON Web Tokens)                   |
| Server    | XAMPP / LAMPP                           |

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

- [XAMPP](https://www.apachefriends.org/) or [LAMPP](https://www.apachefriends.org/index.html) installed
- Node.js v18+ and npm
- PHP 8+
- MySQL 8

---

### 1. Clone the Repository

```bash
git clone https://github.com/niyomudendezo/projectmanager.git
cd projectmanager
```

---

### 2. Database Setup

1. Start **MySQL** from XAMPP/LAMPP control panel
2. Open **phpMyAdmin** at `http://localhost/phpmyadmin`
3. Click **Import** → select `database.sql` → click **Go**

Or via terminal:
```bash
mysql -u root -p < database.sql
```

---

### 3. Backend Setup

1. Copy the project to your web server root:
   ```bash
   # For LAMPP on Linux
   sudo cp -r projectmanager /opt/lampp/htdocs/

   # For XAMPP on Windows
   # Copy to C:\xampp\htdocs\projectmanager
   ```

2. Edit `backend/config/database.php` with your DB credentials:
   ```php
   $host = 'localhost';
   $db   = 'projectmanager';
   $user = 'root';
   $pass = '';          // your MySQL password
   ```

3. Edit `backend/config/jwt.php` and set a secret key:
   ```php
   define('JWT_SECRET', 'your-secret-key-here');
   ```

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

Create a `.env` file inside `frontend/`:
```env
VITE_API_URL=http://localhost/projectmanager/backend
```

Start the development server:
```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

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
