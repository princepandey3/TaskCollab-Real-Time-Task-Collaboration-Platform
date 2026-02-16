# System Architecture

## Overview

TaskCollab is a full-stack, real-time collaboration platform built with a modern microservices-inspired architecture. The system consists of three main layers: Frontend (React SPA), Backend (Node.js/Express API), and Database (MongoDB).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│                     (React + Vite SPA)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐│
│  │  Pages   │  │Components│  │  Store   │  │  Services   ││
│  │          │  │          │  │ (Zustand)│  │ (API/WS)    ││
│  │ -Login   │  │ -Navbar  │  │          │  │             ││
│  │ -Register│  │ -TaskCard│  │ -Auth    │  │ -HTTP Client││
│  │ -Boards  │  │ -Modal   │  │ -Board   │  │ -WebSocket  ││
│  │ -Board   │  │          │  │          │  │             ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘│
│                                                               │
└─────────────────┬──────────────────────┬────────────────────┘
                  │                      │
          HTTP/REST API          WebSocket (ws://)
                  │                      │
┌─────────────────┴──────────────────────┴────────────────────┐
│                      BACKEND LAYER                           │
│               (Node.js + Express.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Routes     │  │ Controllers  │  │   Middleware     │ │
│  │              │  │              │  │                  │ │
│  │ -Auth        │  │ -Auth        │  │ -Authentication │ │
│  │ -Boards      │  │ -Board       │  │ -Authorization  │ │
│  │ -Lists       │  │ -List        │  │ -Error Handler  │ │
│  │ -Tasks       │  │ -Task        │  │ -Validation     │ │
│  │ -Activities  │  │ -Activity    │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Models     │  │  Services    │  │   WebSocket      │ │
│  │              │  │              │  │                  │ │
│  │ -User        │  │ -BoardSvc    │  │ -Connection Mgmt│ │
│  │ -Board       │  │ -TaskSvc     │  │ -Room Management│ │
│  │ -List        │  │ -AuthSvc     │  │ -Event Broadcast│ │
│  │ -Task        │  │              │  │ -Heartbeat      │ │
│  │ -Activity    │  │              │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                    MongoDB Protocol
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     DATABASE LAYER                           │
│                      (MongoDB)                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Collections:                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ users | boards | lists | tasks | activities            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Indexes:                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ - User email (unique)                                   │ │
│  │ - Board owner & members                                 │ │
│  │ - List board & position                                 │ │
│  │ - Task list, board, assignees                          │ │
│  │ - Activity board & timestamp                            │ │
│  │ - Full-text search on tasks                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Navbar (authenticated routes only)
├── Routes
│   ├── Login
│   ├── Register
│   ├── Boards (PrivateRoute)
│   │   └── BoardCard (multiple)
│   └── Board (PrivateRoute)
│       ├── BoardHeader
│       └── DragDropContext
│           ├── List (multiple)
│           │   ├── ListHeader
│           │   ├── Droppable
│           │   │   └── TaskCard (Draggable, multiple)
│           │   └── AddTask
│           └── AddListButton
└── Toaster (notifications)
```

### State Management (Zustand)

**Auth Store**

- User data
- Authentication status
- Login/Register/Logout actions

**Board Store**

- Boards list
- Current board with lists and tasks
- CRUD operations for boards, lists, tasks
- Optimistic updates
- WebSocket event handlers

### Services Layer

**API Service (Axios)**

- HTTP client with interceptors
- Token management
- Error handling
- Request/response transformations

**WebSocket Service**

- Connection management
- Room join/leave
- Event listeners
- Automatic reconnection
- Heartbeat mechanism

## Backend Architecture

### Layered Architecture

1. **Routes Layer**: Defines API endpoints and maps to controllers
2. **Middleware Layer**: Authentication, authorization, validation, error handling
3. **Controller Layer**: Request handling, response formatting
4. **Service Layer**: Business logic (optional, logic in controllers for simplicity)
5. **Model Layer**: Data models and database interactions
6. **WebSocket Layer**: Real-time communication management

### API Design Principles

- RESTful resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format
- JWT token authentication
- Stateless design for scalability

### WebSocket Architecture

**Connection Management**

- Authenticate via JWT token in query params
- Store connections in Map: userId -> Set<WebSocket>
- Handle disconnections and cleanup

**Room Management**

- Board-based rooms: boardId -> Set<userId>
- Users join board rooms when viewing
- Broadcast events only to room members

**Event Broadcasting**

- Task events (created, updated, deleted, moved)
- List events (created, updated, deleted)
- Board events (member added/removed)

### Database Design

**Schema Design Principles**

- Normalized structure with references
- Indexed fields for performance
- Timestamps on all documents
- Soft deletes (isArchived flag)

**Performance Optimizations**

- Compound indexes for common queries
- Text indexes for search
- TTL index for auto-expiring activities
- Pagination for large result sets

## Data Flow

### Create Task Flow

```
1. User clicks "Add Task" in UI
   ↓
2. Frontend creates optimistic UI update
   ↓
3. Frontend sends POST /api/tasks
   ↓
4. Backend authenticates request
   ↓
5. Backend creates task in database
   ↓
6. Backend creates activity log
   ↓
7. Backend broadcasts task_created event via WebSocket
   ↓
8. All connected users in board room receive event
   ↓
9. Frontend updates stores with real task data
   ↓
10. UI reflects confirmed task
```

### Drag & Drop Task Flow

```
1. User drags task to new position/list
   ↓
2. Frontend updates UI immediately (optimistic)
   ↓
3. Frontend sends PUT /api/tasks/:id/move
   ↓
4. Backend recalculates positions
   ↓
5. Backend updates task and related tasks
   ↓
6. Backend broadcasts task_moved event
   ↓
7. Other users see real-time update
   ↓
8. On error, frontend reverts to previous state
```

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token
   ↓
4. Frontend stores token in localStorage
   ↓
5. Frontend includes token in Authorization header
   ↓
6. Backend validates token on each request
   ↓
7. Backend attaches user to request object
```

### Authorization Layers

1. **Route Protection**: Requires valid JWT token
2. **Resource Authorization**: Checks user access to specific resources
3. **Role-Based Access**: Owner/Admin/Member roles for boards

### Security Measures

- Password hashing with bcrypt (10 salt rounds)
- JWT token expiration
- CORS configuration
- Input validation
- SQL injection prevention (NoSQL)
- XSS protection
- Rate limiting (recommended for production)

## Scalability Strategy

### Horizontal Scaling

**Stateless API**

- JWT authentication (no session storage)
- Can run multiple instances behind load balancer

**WebSocket Scaling**

- Currently in-memory (single instance)
- Can be scaled with Redis pub/sub
- Sticky sessions recommended

### Database Scaling

**Current Optimizations**

- Indexes on frequently queried fields
- Connection pooling
- Pagination
- Limited result sets

**Future Considerations**

- Read replicas for read-heavy operations
- Sharding by board_id for large datasets
- Caching layer (Redis) for hot data

### Performance Optimizations

1. **Frontend**
   - Code splitting
   - Lazy loading
   - Memoization of expensive computations
   - Debounced search
   - Virtual scrolling for large lists

2. **Backend**
   - Database query optimization
   - Selective population of references
   - Compression
   - Caching responses
   - Background jobs for heavy operations

3. **WebSocket**
   - Room-based broadcasting
   - Message batching
   - Heartbeat for connection health
   - Automatic reconnection
