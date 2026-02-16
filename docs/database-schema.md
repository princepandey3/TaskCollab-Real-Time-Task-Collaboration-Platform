# Database Schema Design

## Overview

The TaskCollab platform uses MongoDB as its primary database. The schema is designed with normalized relationships using references (ObjectIds) while maintaining performance through strategic denormalization where needed.

## Collections

### 1. Users Collection

**Purpose**: Store user account information and authentication details

```javascript
{
  _id: ObjectId,
  name: String (required, max 50 chars),
  email: String (required, unique, lowercase),
  password: String (required, hashed, min 6 chars, select: false),
  avatar: String (URL, nullable),
  isActive: Boolean (default: true),
  lastActive: Date (default: Date.now),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:

- `email`: Unique index for fast lookup and uniqueness constraint
- `createdAt`: For sorting users by join date

**Security**:

- Password is hashed using bcrypt before storage
- Password field excluded from query results by default
- Email validation using regex pattern

**Example Document**:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2b$10$K8Xv3...",
  "avatar": "https://example.com/avatar.jpg",
  "isActive": true,
  "lastActive": "2024-02-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-02-15T10:30:00Z"
}
```

---

### 2. Boards Collection

**Purpose**: Store board information and membership details

```javascript
{
  _id: ObjectId,
  title: String (required, max 100 chars),
  description: String (optional, max 500 chars),
  owner: ObjectId (ref: 'User', required),
  members: [{
    user: ObjectId (ref: 'User'),
    role: String (enum: ['owner', 'admin', 'member'], default: 'member'),
    addedAt: Date (default: Date.now)
  }],
  backgroundColor: String (default: '#0079BF'),
  isArchived: Boolean (default: false),
  listOrder: [ObjectId] (ref: 'List'),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:

- `owner + createdAt`: Compound index for user's boards sorted by date
- `members.user`: Index for finding boards by member
- `isArchived`: For filtering archived boards

**Relationships**:

- `owner`: References Users collection
- `members.user`: References Users collection
- Virtual field `lists`: Populated from Lists collection

**Example Document**:

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Q1 Product Launch",
  "description": "Planning and execution for Q1 launch",
  "owner": "507f1f77bcf86cd799439011",
  "members": [
    {
      "user": "507f1f77bcf86cd799439011",
      "role": "owner",
      "addedAt": "2024-01-01T00:00:00Z"
    },
    {
      "user": "507f1f77bcf86cd799439013",
      "role": "member",
      "addedAt": "2024-01-05T10:00:00Z"
    }
  ],
  "backgroundColor": "#0079BF",
  "isArchived": false,
  "listOrder": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-02-15T10:30:00Z"
}
```

---

### 3. Lists Collection

**Purpose**: Store list information and task ordering

```javascript
{
  _id: ObjectId,
  title: String (required, max 100 chars),
  board: ObjectId (ref: 'Board', required),
  position: Number (required, default: 0),
  taskOrder: [ObjectId] (ref: 'Task'),
  isArchived: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:

- `board + position`: Compound index for ordered lists within a board

**Relationships**:

- `board`: References Boards collection
- Virtual field `tasks`: Populated from Tasks collection

**Example Document**:

```json
{
  "_id": "507f1f77bcf86cd799439014",
  "title": "To Do",
  "board": "507f1f77bcf86cd799439012",
  "position": 0,
  "taskOrder": ["507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017"],
  "isArchived": false,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-02-15T10:30:00Z"
}
```

---

### 4. Tasks Collection

**Purpose**: Store task details, assignments, and metadata

```javascript
{
  _id: ObjectId,
  title: String (required, max 200 chars),
  description: String (optional, text),
  list: ObjectId (ref: 'List', required),
  board: ObjectId (ref: 'Board', required),
  position: Number (required, default: 0),
  assignedTo: [ObjectId] (ref: 'User'),
  createdBy: ObjectId (ref: 'User', required),
  dueDate: Date (optional),
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  labels: [{
    name: String,
    color: String (hex color)
  }],
  checklist: [{
    item: String,
    completed: Boolean (default: false),
    createdAt: Date (default: Date.now)
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: ObjectId (ref: 'User'),
    uploadedAt: Date (default: Date.now)
  }],
  isArchived: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:

- `list + position`: Compound index for ordered tasks within a list
- `board + createdAt`: For finding all tasks in a board sorted by date
- `assignedTo`: For finding tasks assigned to a user
- `title + description`: Text index for full-text search

**Relationships**:

- `list`: References Lists collection
- `board`: References Boards collection (denormalized for faster queries)
- `assignedTo`: References Users collection (array for multi-assignment)
- `createdBy`: References Users collection
- `attachments.uploadedBy`: References Users collection

**Example Document**:

```json
{
  "_id": "507f1f77bcf86cd799439016",
  "title": "Design login screen",
  "description": "Create mockups for the login screen with social auth options",
  "list": "507f1f77bcf86cd799439014",
  "board": "507f1f77bcf86cd799439012",
  "position": 0,
  "assignedTo": ["507f1f77bcf86cd799439013"],
  "createdBy": "507f1f77bcf86cd799439011",
  "dueDate": "2024-03-01T00:00:00Z",
  "priority": "high",
  "labels": [
    {
      "name": "Design",
      "color": "#FF6B6B"
    }
  ],
  "checklist": [
    {
      "item": "Research design patterns",
      "completed": true,
      "createdAt": "2024-02-10T10:00:00Z"
    },
    {
      "item": "Create wireframes",
      "completed": false,
      "createdAt": "2024-02-11T10:00:00Z"
    }
  ],
  "attachments": [],
  "isArchived": false,
  "createdAt": "2024-02-10T09:00:00Z",
  "updatedAt": "2024-02-15T10:30:00Z"
}
```

---

### 5. Activities Collection

**Purpose**: Track all actions and changes for audit and history

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  board: ObjectId (ref: 'Board', required),
  action: String (required, enum: [
    'board_created', 'board_updated', 'board_deleted',
    'list_created', 'list_updated', 'list_deleted', 'list_moved',
    'task_created', 'task_updated', 'task_deleted', 'task_moved',
    'task_assigned', 'task_unassigned',
    'member_added', 'member_removed',
    'comment_added', 'attachment_added'
  ]),
  entity: {
    type: String (enum: ['board', 'list', 'task', 'comment', 'attachment']),
    id: ObjectId,
    name: String
  },
  details: Mixed (optional, JSON object with change details),
  createdAt: Date (auto, TTL: 90 days),
  updatedAt: Date (auto)
}
```

**Indexes**:

- `board + createdAt`: Compound index for board activity history
- `user + createdAt`: For user activity timeline
- `createdAt`: TTL index to auto-delete after 90 days

**TTL Policy**:

- Activities automatically deleted after 90 days to manage storage

**Example Document**:

```json
{
  "_id": "507f1f77bcf86cd799439018",
  "user": "507f1f77bcf86cd799439011",
  "board": "507f1f77bcf86cd799439012",
  "action": "task_created",
  "entity": {
    "type": "task",
    "id": "507f1f77bcf86cd799439016",
    "name": "Design login screen"
  },
  "details": {
    "priority": "high",
    "dueDate": "2024-03-01T00:00:00Z"
  },
  "createdAt": "2024-02-10T09:00:00Z",
  "updatedAt": "2024-02-10T09:00:00Z"
}
```

---

## Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
│  _id (PK)   │
│    email    │
│    name     │
└──────┬──────┘
       │
       │ created (1:N)
       ├──────────────────────────┐
       │                          │
       │ member_of (N:N)          │
       ├──────────┐               │
       │          │               │
┌──────▼──────────▼─┐      ┌─────▼────────┐
│      Boards       │      │  Activities  │
│     _id (PK)      │      │   _id (PK)   │
│      owner        │      │     user     │
│    members[]      │      │    board     │
│   listOrder[]     │      │    action    │
└──────┬────────────┘      └──────────────┘
       │
       │ has (1:N)
       │
┌──────▼───────┐
│    Lists     │
│   _id (PK)   │
│    board     │
│   position   │
│ taskOrder[]  │
└──────┬───────┘
       │
       │ contains (1:N)
       │
┌──────▼───────┐
│    Tasks     │
│   _id (PK)   │
│     list     │
│    board     │──────┐
│  createdBy   │      │
│ assignedTo[] │      │ denormalized
│  position    │      │ for performance
└──────────────┘      │
                      │
       ┌──────────────┘
       │
  (back reference)
```
