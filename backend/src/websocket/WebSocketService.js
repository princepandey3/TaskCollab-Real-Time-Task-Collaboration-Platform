const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> Set of WebSocket connections
    this.boardRooms = new Map(); // Map of boardId -> Set of userIds
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('WebSocket server initialized');
  }

  async handleConnection(ws, req) {
    try {
      // Parse query parameters for authentication
      const parameters = url.parse(req.url, true);
      const token = parameters.query.token;

      if (!token) {
        ws.close(1008, 'No token provided');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Store connection
      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId).add(ws);

      // Set user ID on WebSocket instance
      ws.userId = userId;
      ws.isAlive = true;

      console.log(`User ${userId} connected`);

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle incoming messages
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      // Send welcome message
      this.sendToUser(userId, {
        type: 'connected',
        message: 'Connected to WebSocket server'
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join_board':
          this.joinBoard(ws.userId, data.boardId);
          break;
        case 'leave_board':
          this.leaveBoard(ws.userId, data.boardId);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  handleDisconnection(ws) {
    const userId = ws.userId;

    if (!userId) return;

    // Remove from user connections
    if (this.clients.has(userId)) {
      this.clients.get(userId).delete(ws);
      if (this.clients.get(userId).size === 0) {
        this.clients.delete(userId);
      }
    }

    // Remove from all board rooms
    this.boardRooms.forEach((users, boardId) => {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) {
          this.boardRooms.delete(boardId);
        }
      }
    });

    console.log(`User ${userId} disconnected`);
  }

  joinBoard(userId, boardId) {
    if (!this.boardRooms.has(boardId)) {
      this.boardRooms.set(boardId, new Set());
    }
    this.boardRooms.get(boardId).add(userId);

    console.log(`User ${userId} joined board ${boardId}`);

    // Notify user
    this.sendToUser(userId, {
      type: 'board_joined',
      boardId
    });
  }

  leaveBoard(userId, boardId) {
    if (this.boardRooms.has(boardId)) {
      this.boardRooms.get(boardId).delete(userId);
      if (this.boardRooms.get(boardId).size === 0) {
        this.boardRooms.delete(boardId);
      }
    }

    console.log(`User ${userId} left board ${boardId}`);
  }

  // Send message to specific user (all their connections)
  sendToUser(userId, data) {
    if (!this.clients.has(userId)) return;

    const connections = this.clients.get(userId);
    const message = JSON.stringify(data);

    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Broadcast to all users in a board
  broadcastToBoard(boardId, data, excludeUserId = null) {
    if (!this.boardRooms.has(boardId)) return;

    const users = this.boardRooms.get(boardId);
    const message = JSON.stringify(data);

    users.forEach((userId) => {
      if (userId !== excludeUserId && this.clients.has(userId)) {
        const connections = this.clients.get(userId);
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    });
  }

  // Broadcast to all connected users
  broadcast(data, excludeUserId = null) {
    const message = JSON.stringify(data);

    this.clients.forEach((connections, userId) => {
      if (userId !== excludeUserId) {
        connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    });
  }

  // Emit board events
  emitBoardEvent(boardId, event, data, userId = null) {
    this.broadcastToBoard(boardId, {
      type: 'board_event',
      event,
      data,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Emit task events
  emitTaskEvent(boardId, event, task, userId = null) {
    this.broadcastToBoard(boardId, {
      type: 'task_event',
      event,
      task,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Emit list events
  emitListEvent(boardId, event, list, userId = null) {
    this.broadcastToBoard(boardId, {
      type: 'list_event',
      event,
      list,
      timestamp: new Date().toISOString()
    }, userId);
  }

  // Start heartbeat interval to check connection health
  startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((connections) => {
        connections.forEach((ws) => {
          if (ws.isAlive === false) {
            return ws.terminate();
          }

          ws.isAlive = false;
          ws.ping();
        });
      });
    }, 30000); // 30 seconds
  }
}

module.exports = new WebSocketService();
