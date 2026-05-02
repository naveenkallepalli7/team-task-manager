# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application built with the **MERN stack** (MongoDB, Express, React, Node.js) featuring JWT authentication, role-based access control, Kanban boards, and a rich analytics dashboard.

---

## 🖼️ Screenshots

| Login | Dashboard | Kanban Board |
|-------|-----------|--------------|
| Clean dark auth UI | Stat cards + Charts | Per-project task board |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Recharts, Axios |
| Backend | Node.js + Express.js (MVC architecture) |
| Database | MongoDB + Mongoose ORM |
| Auth | JWT + bcryptjs |
| Styling | Vanilla CSS (custom design system) |
| Deployment | Vercel & Render |

---

## 🔐 Authentication

- **Signup / Login** with bcrypt-hashed passwords
- JWT tokens (7-day expiry) stored in `localStorage`
- Protected route middleware on all API routes
- Public routes redirect to dashboard if logged in

---

## 👥 Role-Based Access Control

| Feature | Admin | Member |
|---------|-------|--------|
| Create Projects | ✅ | ❌ |
| Manage Members | ✅ | ❌ |
| Create/Delete Tasks | ✅ | ❌ |
| View All Tasks | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ |
| Update Task Status | ✅ | ✅ (own tasks) |
| Manage Users | ✅ | ❌ |

---

## 🚀 Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Clone & Install

```bash
git clone <repo-url>
cd team-task-manager

# Install root dev deps
npm install

# Install backend & frontend deps
npm run install:all
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

`.env` variables:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- 1 Admin user
- 3 Member users
- 3 Projects
- 10 Tasks (with varied statuses and dates)

### 4. Run Development Servers

**Option A — Run separately (recommended):**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

**Option B — Run concurrently (from root):**
```bash
npm install   # install concurrently
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@taskmanager.com | Admin@123 |
| 👤 Member | alice@taskmanager.com | Member@123 |
| 👤 Member | bob@taskmanager.com | Member@123 |
| 👤 Member | carol@taskmanager.com | Member@123 |

---

## 🔗 REST API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, get JWT |
| GET | `/api/auth/me` | Private | Get current user |

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/:id` | Admin | Get user by ID |
| PUT | `/api/users/profile` | Private | Update own profile |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

### Projects — `/api/projects`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Private | Get accessible projects |
| GET | `/api/projects/:id` | Private | Get project details |
| POST | `/api/projects` | Admin | Create project |
| PUT | `/api/projects/:id` | Admin | Update project |
| PUT | `/api/projects/:id/members` | Admin | Set project members |
| DELETE | `/api/projects/:id` | Admin | Delete project + tasks |

### Tasks — `/api/tasks`
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Private | Get tasks (filtered) |
| GET | `/api/tasks/stats` | Private | Dashboard stats |
| GET | `/api/tasks/:id` | Private | Get task by ID |
| POST | `/api/tasks` | Admin | Create task |
| PUT | `/api/tasks/:id` | Private | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

**Query params for `GET /api/tasks`:**
- `status` — Pending | In Progress | Completed
- `priority` — Low | Medium | High
- `projectId` — Filter by project
- `assignedTo` — Filter by user (admin only)
- `search` — Full-text search in title/description
- `overdue=true` — Show only overdue tasks

---

## 📁 Project Structure

```
team-task-manager/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API service layer
│   │   ├── components/      # Layout, Sidebar
│   │   ├── context/         # AuthContext
│   │   └── pages/           # Dashboard, Projects, Tasks, Users
│   └── vite.config.js
│
├── server/                  # Express.js backend
│   ├── src/
│   │   ├── controllers/     # auth, user, project, task
│   │   ├── middleware/       # auth.middleware (JWT + roles)
│   │   ├── models/          # User, Project, Task (Mongoose)
│   │   ├── routes/          # Express routers
│   │   └── utils/           # seed.js
│   ├── .env
│   └── package.json
│
├── package.json             # Root scripts
└── README.md
```

---

## 🚀 Deployment on Vercel & Render

### 1. Push to GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy Backend to Render
1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo and select the `server` directory
3. Set Build Command: `npm install` and Start Command: `node src/index.js`
4. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_SECRET_KEY`, `NODE_ENV=production`

### 3. Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo and select the `client` directory
3. Framework Preset: `Vite`
4. Add Environment Variable: `VITE_API_URL` pointing to your Render backend URL (e.g. `https://taskflow-api.onrender.com/api`)

### 4. Set Frontend URL in Render
Update the `CLIENT_URL` environment variable in Render with your Vercel URL (e.g. `https://team-task-manager.vercel.app`) to allow CORS.

---

## 🎥 Demo Recording Steps

1. Start both servers (see Local Setup above)
2. Open OBS Studio or any screen recorder
3. Navigate to http://localhost:5173
4. **Record this flow (5 min):**
   - Login as Admin (use Quick Demo button)
   - Show Dashboard with charts and stats
   - Go to Projects → Create a new project
   - Open a project → show Kanban board
   - Create a task and assign it to a member
   - Go to Tasks page → use filter bar
   - Login as Member → show limited access
   - Show status update (Pending → In Progress → Completed)
   - Go to Users page (admin only)

---

## ✨ Features

- 🔐 JWT Authentication (signup/login)
- 👥 Role-based access (Admin / Member)
- 📁 Project management with member assignment
- 📋 Kanban board per project
- ✅ Full task CRUD with filtering & search
- 📊 Dashboard with Recharts (Pie + Bar charts)
- ⚠️ Overdue task detection & alerts
- 🎨 Premium dark UI with glassmorphism
- 📱 Responsive design
- 🌱 Seed data for instant testing
- 🚀 Vercel & Render deployment ready
