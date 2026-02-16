# TaskCollab – Real-Time Task Collaboration Platform

TaskCollab is a full-stack real-time task management platform inspired by tools like Trello and Notion.  
It allows users to create boards, manage lists and tasks, assign members, and see updates instantly using WebSockets.

This project was built to understand real-time architecture, scalable backend design, authentication systems, and modern frontend state management.

---

## 🚀 Features

### Core Features

- User authentication (JWT-based login & registration)
- Create, update, delete boards
- Multiple lists inside each board
- Create and manage tasks within lists
- Drag and drop tasks between lists
- Assign multiple users to tasks
- Task priorities and due dates
- Activity history tracking
- Search and pagination
- Real-time updates across connected users

### Technical Highlights

- WebSocket-based live updates
- RESTful API design
- Optimistic UI updates
- Zustand for global state management
- Clean backend architecture (controllers + services)
- MongoDB indexing and TTL for activity logs
- Responsive UI

---

## 🏗️ Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- WebSocket (`ws`)
- JWT Authentication
- bcrypt for password hashing

### Frontend

- React 18
- Vite
- Zustand
- React Router v6
- react-beautiful-dnd
- Axios
- react-hot-toast

---

## 📂 Project Structure

task-collab-platform/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ ├── models/
│ │ ├── controllers/
│ │ ├── routes/
│ │ ├── middleware/
│ │ ├── services/
│ │ ├── websocket/
│ │ └── server.js
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ ├── store/
│ │ ├── styles/
│ │ ├── App.jsx
│ │ └── main.jsx
│
└── docs

The backend separates business logic from controllers for maintainability.  
The frontend uses a centralized state store for consistent UI updates.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (running locally or cloud instance)
- npm or yarn

---

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd task-collab-platform

2️⃣ Backend Setup

cd backend
npm install
cp .env.example .env
Start the backend:
npm run dev

Backend runs at:
http://localhost:5000

3️⃣ Frontend Setup

cd frontend
npm install
npm run dev

Frontend runs at:
http://localhost:5173

🔄 Real-Time Communication

The frontend connects to the backend WebSocket server using a JWT token.

When users:

Create a task

Update a task

Move a task

Delete a task

An event is broadcast to all connected users viewing that board.

This ensures real-time synchronization across clients.

🔐 Security

Password hashing with bcrypt

JWT authentication

Protected routes

Input validation middleware

CORS configuration

NoSQL injection prevention

XSS protection

📄 License
MIT License
```
