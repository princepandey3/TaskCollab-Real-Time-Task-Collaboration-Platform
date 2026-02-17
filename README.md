# TaskCollab – Real-Time Task Collaboration Platform

TaskCollab is a full-stack, real-time task collaboration app for teams. It combines a REST API, WebSocket-powered live updates, and a modern React frontend to let multiple users create boards, lists, and tasks and see changes instantly.

This README gives a feature overview, architecture notes, setup instructions, environment variables, and contributor guidance so you can run and extend the project.

**Highlights:**

- Real-time updates via WebSockets
- Rich task model (assignees, priority, due dates)
- Drag-and-drop task reordering
- JWT authentication with protected API routes
- Clean separation: controllers → services → models

---

**Contents**

- **Features** — what the app does
- **Tech Stack** — libraries and tooling
- **Architecture** — high-level structure and realtime flow
- **Getting Started** — local setup for backend & frontend
- **Environment** — required env vars
- **Development** — common scripts and tips
- **Contributing & License**

---

**Features**

- User accounts: register, login, JWT-based auth, secure password hashing with bcrypt.
- Boards: create, rename, archive, and delete boards; board-level membership and permissions.
- Lists: multiple ordered lists per board (e.g., To Do, In Progress, Done).
- Tasks: create/update/delete tasks with title, description, priority, due date, labels, and attachments (if extended).
- Assignments: assign multiple users to a task and track task members.
- Drag & drop: reorder tasks within lists and move tasks between lists using react-beautiful-dnd on the frontend.
- Real-time sync: changes (create/update/move/delete) broadcast to all connected clients viewing the same board via WebSocket server (`ws`).
- Activity history: immutable activity log entries for task/board actions with TTL indexing for storage management.
- Search & pagination: API endpoints support searching tasks/boards and paginated responses for large datasets.
- Optimistic UI: frontend updates immediately for snappy UX, falling back on server confirmation.

---

**Tech Stack**

- Backend: Node.js, Express.js, MongoDB, Mongoose, WebSocket (`ws`), JWT, bcrypt.
- Frontend: React 18, Vite, Zustand for state, React Router v6, react-beautiful-dnd, Axios, react-hot-toast.
- Dev tooling: ESLint / Prettier (optional), nodemon for backend development, and typical npm scripts.

---

**Architecture & Data Flow**

- The backend exposes a REST API for CRUD operations (boards, lists, tasks, invites, users, activities).
- Business logic lives in `services/` while `controllers/` translate HTTP requests to service calls.
- Persistent storage: MongoDB with Mongoose models (`models/`)
- WebSocket server (in `websocket/`) manages active connections per board; when a change is persisted it publishes an event to connected clients.
- Clients authenticate via a JWT; the token is used for both REST requests (Authorization header) and WebSocket handshake.

Realtime flow (summary):

1. Client updates/creates a task via REST API.
2. Server validates and persists the change, records an activity.
3. Server publishes an event through the WebSocket service to all sockets subscribed to that board.
4. Clients receive the event and update local state (Zustand) to reflect the change.

---

**Repository layout (important files)**

- `backend/` — Node/Express backend and WebSocket server
  - `backend/src/server.js` — app entry
  - `backend/src/config/database.js` — Mongo connection
  - `backend/src/controllers/` — HTTP handlers
  - `backend/src/services/` — business logic
  - `backend/src/models/` — Mongoose schemas
  - `backend/src/websocket/` — sockets and broadcast logic
- `frontend/` — React app built with Vite
  - `frontend/src/App.jsx`, `frontend/src/main.jsx` — app entry
  - `frontend/src/pages/` — major views (Board, Boards, Auth, Invite)
  - `frontend/src/components/` — reusable UI (Navbar, TaskCard, TaskModal)
  - `frontend/src/services/api.js` — Axios instance and API helpers
  - `frontend/src/services/websocket.js` — socket client and event handlers

---

**Getting Started (local development)**

Prerequisites: `node` (v16+), `npm`, and a running MongoDB (local or cloud).

Backend

1. Open a terminal and go to the backend folder:

```bash
cd backend
npm install
cp .env.example .env
```

2. Edit `.env` with your MongoDB URI and JWT secret. Example vars are listed in the Environment section below.

3. Start the backend in development mode:

```bash
npm run dev
```

The backend default base URL is `http://localhost:5000` (adjustable via `PORT`).

Frontend

1. In a new terminal, go to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

2. Open the dev server URL printed by Vite (usually `http://localhost:5173`).

The frontend expects a backend URL and a mechanism to obtain a JWT (login/register). Configure any API base URLs in `frontend/src/services/api.js`.

---

**Environment variables**

Common variables to set in `backend/.env`:

- `PORT` — server port (e.g., `5000`)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `JWT_EXPIRES_IN` — token lifetime (e.g., `7d`)
- `NODE_ENV` — `development` or `production`

Frontend environment (Vite) — in `frontend/.env` or `frontend/.env.local`:

- `VITE_API_BASE_URL` — backend base URL (e.g., `http://localhost:5000`)
- `VITE_WS_URL` — WebSocket URL (if separate)

---

**API & WebSocket notes**

- REST endpoints are grouped by resource (auth, boards, lists, tasks, invites, activities). See `backend/src/routes/` for route definitions.
- WebSocket connections should send the JWT for authentication during handshake; after auth clients subscribe to a `boardId` channel.
- Events broadcast from server include types like `task:created`, `task:updated`, `task:moved`, `task:deleted`, and `board:updated`.

---

**Security**

- Passwords hashed with `bcrypt` before storage.
- JWT-based authentication for REST and WebSocket.
- Input validation middleware and sanitization applied in controllers.
- Use HTTPS in production and set secure cookie / CORS policies as needed.

---

**Development tips & scripts**

- Backend:
  - `npm run dev` — start server with `nodemon` for live reload
  - `npm start` — production start
- Frontend:
  - `npm run dev` — start Vite dev server
  - `npm run build` — production build
  - `npm run preview` — preview built site

Run linters/formatters locally if available before pushing changes.

---

**Contributing**

- Fork the repo and create a feature branch.
- Follow existing code patterns: controllers call services; services handle business logic; controllers return appropriate HTTP responses.
- Open a PR with a clear description and link any related issue.

---

**License**

This project is provided under the MIT License.

---

# 👨‍💻 Author

Prince Pandey\
B.Tech CSE IIIT KOTA | Full Stack Developer
