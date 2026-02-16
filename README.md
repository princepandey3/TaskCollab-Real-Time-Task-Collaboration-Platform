# 🚀 TaskCollab -- Real-Time Task Collaboration Platform

TaskCollab is a **production-ready full-stack real-time collaboration
platform** designed for modern teams. Inspired by tools like Trello and
Jira, it enables teams to manage projects using boards, lists, and tasks
--- all synchronized instantly using WebSockets.

Built with scalability, clean architecture, and performance in mind,
TaskCollab demonstrates modern full-stack engineering practices
including:

-   Real-time synchronization
-   Secure JWT authentication
-   Optimistic UI updates
-   Clean backend architecture
-   Efficient MongoDB schema design
-   Centralized frontend state management

------------------------------------------------------------------------

# ✨ Features

## 🧩 Core Functionality

-   🔐 JWT-based authentication (Login / Register)
-   📋 Create, edit, and delete project boards
-   🗂️ Multiple customizable lists per board
-   📝 Create, update, delete tasks
-   🔄 Drag & Drop tasks between lists
-   👥 Assign multiple users to tasks
-   ⏰ Due dates & priority levels
-   📜 Activity history tracking
-   🔍 Search functionality
-   📄 Pagination support
-   ⚡ Real-time updates across connected users

------------------------------------------------------------------------

# ⚡ Real-Time Collaboration

TaskCollab uses **WebSocket (`ws`)** to provide instant synchronization.

Whenever a user: - Creates a task - Updates a task - Moves a task -
Deletes a task

The update is broadcast to all connected clients viewing the same board.

------------------------------------------------------------------------

# 🏗️ Tech Stack

## 🖥 Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   WebSocket (`ws`)
-   JWT Authentication
-   bcrypt
-   MVC Architecture (Controllers + Services Pattern)

## 💻 Frontend

-   React 18
-   Vite
-   Zustand (Global State)
-   React Router v6
-   react-beautiful-dnd
-   Axios
-   react-hot-toast


------------------------------------------------------------------------

# ⚙️ Getting Started

## 📌 Prerequisites

-   Node.js (v16+ recommended)
-   MongoDB (Local or Atlas)
-   npm or yarn

------------------------------------------------------------------------

## 1️⃣ Clone Repository

git clone https://github.com/your-username/task-collab-platform.git cd
task-collab-platform

------------------------------------------------------------------------

## 2️⃣ Backend Setup

cd backend npm install cp .env.example .env

### Configure .env

PORT=5000 MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key CLIENT_URL=http://localhost:5173

### Run Backend

npm run dev

Backend runs at: http://localhost:5000

------------------------------------------------------------------------

## 3️⃣ Frontend Setup

cd frontend npm install npm run dev

Frontend runs at: http://localhost:5173

------------------------------------------------------------------------

# 🔐 Security Implementation

-   bcrypt password hashing
-   JWT-based authentication
-   Protected API routes
-   Role-based access validation
-   Input validation middleware
-   MongoDB indexing for performance
-   TTL indexes for automatic activity log cleanup
-   CORS configuration
-   NoSQL injection prevention
-   Basic XSS protection

------------------------------------------------------------------------

# 🧠 Architecture Highlights

### Backend Design

-   MVC + Service Layer pattern
-   Business logic separated from controllers
-   Scalable folder structure
-   WebSocket event broadcasting system
-   MongoDB indexing for optimized queries

### Frontend Design

-   Zustand centralized global store
-   Optimistic UI updates for smooth UX
-   Modular component architecture
-   Clean separation between API services & UI

------------------------------------------------------------------------

# 🚀 Future Improvements

-   Role-based permissions (Admin, Member, Viewer)
-   File attachments for tasks
-   Comments system
-   Email notifications
-   Redis for WebSocket scaling
-   Docker containerization
-   CI/CD pipeline

------------------------------------------------------------------------

# 📄 License

MIT License © 2026

------------------------------------------------------------------------

# 👨‍💻 Author

Prince Pandey\
B.Tech CSE IIIT KOTA | Full Stack Developer
