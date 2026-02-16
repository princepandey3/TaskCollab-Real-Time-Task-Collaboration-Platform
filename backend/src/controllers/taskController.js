const Task = require("../models/Task");
const List = require("../models/List");
const Activity = require("../models/Activity");

// @desc    Get tasks with pagination and search
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { board, list, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isArchived: false };

    if (board) query.board = board;
    if (list) query.list = list;

    if (search) {
      query.$text = { $search: search };
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("list", "title")
      .sort(search ? { score: { $meta: "textScore" } } : "position")
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("list", "title")
      .populate("board", "title");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, list, board, dueDate, priority, labels } =
      req.body;

    // Get highest position in list
    const lastTask = await Task.findOne({ list }).sort("-position");
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description,
      list,
      board,
      position,
      createdBy: req.user.id,
      dueDate,
      priority,
      labels,
    });

    await task.populate([
      { path: "createdBy", select: "name email avatar" },
      { path: "list", select: "title" },
    ]);

    // Log activity
    await Activity.create({
      user: req.user.id,
      board,
      action: "task_created",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
    });

    res.status(201).json({
      success: true,
      task,
    });
    // Emit websocket event to board room
    try {
      if (global.wsService && task.board) {
        global.wsService.emitTaskEvent(
          task.board.toString(),
          "created",
          task,
          req.user.id,
        );
      }
    } catch (e) {
      console.error("Failed to emit task created event", e.message);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("list", "title");

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: task.board,
      action: "task_updated",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
      details: req.body,
    });

    res.status(200).json({
      success: true,
      task,
    });
    // Emit websocket event for update
    try {
      if (global.wsService && task.board) {
        global.wsService.emitTaskEvent(
          task.board.toString(),
          "updated",
          task,
          req.user.id,
        );
      }
    } catch (e) {
      console.error("Failed to emit task updated event", e.message);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: task.board,
      action: "task_deleted",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
    });

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
    // Emit websocket event for delete
    try {
      if (global.wsService && task.board) {
        global.wsService.emitTaskEvent(
          task.board.toString(),
          "deleted",
          task,
          req.user.id,
        );
      }
    } catch (e) {
      console.error("Failed to emit task deleted event", e.message);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

// @desc    Move task (drag and drop)
// @route   PUT /api/tasks/:id/move
// @access  Private
exports.moveTask = async (req, res) => {
  try {
    const { newListId, newPosition } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const oldListId = task.list.toString();
    const oldPosition = task.position;

    // Moving within same list
    if (oldListId === newListId) {
      if (newPosition > oldPosition) {
        await Task.updateMany(
          {
            list: oldListId,
            position: { $gt: oldPosition, $lte: newPosition },
          },
          { $inc: { position: -1 } },
        );
      } else if (newPosition < oldPosition) {
        await Task.updateMany(
          {
            list: oldListId,
            position: { $gte: newPosition, $lt: oldPosition },
          },
          { $inc: { position: 1 } },
        );
      }
    } else {
      // Moving to different list
      // Decrease positions in old list
      await Task.updateMany(
        {
          list: oldListId,
          position: { $gt: oldPosition },
        },
        { $inc: { position: -1 } },
      );

      // Increase positions in new list
      await Task.updateMany(
        {
          list: newListId,
          position: { $gte: newPosition },
        },
        { $inc: { position: 1 } },
      );

      task.list = newListId;
    }

    task.position = newPosition;
    await task.save();

    await task.populate([
      { path: "assignedTo", select: "name email avatar" },
      { path: "createdBy", select: "name email avatar" },
      { path: "list", select: "title" },
    ]);

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: task.board,
      action: "task_moved",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
      details: { oldListId, newListId, oldPosition, newPosition },
    });

    res.status(200).json({
      success: true,
      task,
    });
    // Emit websocket event for move
    try {
      if (global.wsService && task.board) {
        const payload = task.toObject ? task.toObject() : task;
        payload.oldListId = oldListId;
        payload.newListId = newListId;
        global.wsService.emitTaskEvent(
          task.board.toString(),
          "moved",
          payload,
          req.user.id,
        );
      }
    } catch (e) {
      console.error("Failed to emit task moved event", e.message);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error moving task",
      error: error.message,
    });
  }
};

// @desc    Assign user to task
// @route   POST /api/tasks/:id/assign
// @access  Private
exports.assignTask = async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Check if already assigned
    if (task.assignedTo.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User already assigned to this task",
      });
    }

    task.assignedTo.push(userId);
    await task.save();

    await task.populate("assignedTo", "name email avatar");

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: task.board,
      action: "task_assigned",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
      details: { assignedUser: userId },
    });

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error assigning task",
      error: error.message,
    });
  }
};

// @desc    Unassign user from task
// @route   DELETE /api/tasks/:id/assign/:userId
// @access  Private
exports.unassignTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.assignedTo = task.assignedTo.filter(
      (id) => id.toString() !== req.params.userId,
    );

    await task.save();
    await task.populate("assignedTo", "name email avatar");

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: task.board,
      action: "task_unassigned",
      entity: {
        type: "task",
        id: task._id,
        name: task.title,
      },
      details: { unassignedUser: req.params.userId },
    });

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unassigning task",
      error: error.message,
    });
  }
};
