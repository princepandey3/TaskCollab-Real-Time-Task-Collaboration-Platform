const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Get all boards for user
// @route   GET /api/boards
// @access  Private
exports.getBoards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find boards where user is owner or member
    const boards = await Board.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isArchived: false
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort('-createdAt')
    .limit(limit)
    .skip(skip);

    const total = await Board.countDocuments({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isArchived: false
    });

    res.status(200).json({
      success: true,
      count: boards.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      boards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching boards',
      error: error.message
    });
  }
};

// @desc    Get single board with lists and tasks
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check access
    const hasAccess = board.owner._id.toString() === req.user.id ||
                     board.members.some(m => m.user._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get lists with tasks
    const lists = await List.find({ board: board._id, isArchived: false })
      .sort('position');

    const listsWithTasks = await Promise.all(lists.map(async (list) => {
      const tasks = await Task.find({ list: list._id, isArchived: false })
        .populate('assignedTo', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .sort('position');

      return {
        ...list.toObject(),
        tasks
      };
    }));

    res.status(200).json({
      success: true,
      board: {
        ...board.toObject(),
        lists: listsWithTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching board',
      error: error.message
    });
  }
};

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
exports.createBoard = async (req, res) => {
  try {
    const { title, description, backgroundColor } = req.body;

    const board = await Board.create({
      title,
      description,
      backgroundColor,
      owner: req.user.id,
      members: [{
        user: req.user.id,
        role: 'owner'
      }]
    });

    await board.populate('owner', 'name email avatar');

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: board._id,
      action: 'board_created',
      entity: {
        type: 'board',
        id: board._id,
        name: board.title
      }
    });

    res.status(201).json({
      success: true,
      board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating board',
      error: error.message
    });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
exports.updateBoard = async (req, res) => {
  try {
    let board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check if user is owner or admin
    const isAuthorized = board.owner.toString() === req.user.id ||
                        board.members.some(m => 
                          m.user.toString() === req.user.id && 
                          ['owner', 'admin'].includes(m.role)
                        );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this board'
      });
    }

    board = await Board.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar');

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: board._id,
      action: 'board_updated',
      entity: {
        type: 'board',
        id: board._id,
        name: board.title
      },
      details: req.body
    });

    res.status(200).json({
      success: true,
      board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating board',
      error: error.message
    });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
exports.deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Only owner can delete
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only board owner can delete the board'
      });
    }

    // Delete associated lists and tasks
    await List.deleteMany({ board: board._id });
    await Task.deleteMany({ board: board._id });
    await Activity.deleteMany({ board: board._id });
    
    await board.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting board',
      error: error.message
    });
  }
};

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check authorization
    const isAuthorized = board.owner.toString() === req.user.id ||
                        board.members.some(m => 
                          m.user.toString() === req.user.id && 
                          ['owner', 'admin'].includes(m.role)
                        );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members'
      });
    }

    // Check if already a member
    const isMember = board.members.some(m => m.user.toString() === userId);

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    board.members.push({ user: userId, role });
    await board.save();
    await board.populate('members.user', 'name email avatar');

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: board._id,
      action: 'member_added',
      entity: {
        type: 'board',
        id: board._id,
        name: board.title
      },
      details: { addedUser: userId }
    });

    res.status(200).json({
      success: true,
      board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};

// @desc    Remove member from board
// @route   DELETE /api/boards/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Check authorization
    const isAuthorized = board.owner.toString() === req.user.id ||
                        board.members.some(m => 
                          m.user.toString() === req.user.id && 
                          ['owner', 'admin'].includes(m.role)
                        );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members'
      });
    }

    // Can't remove owner
    if (board.owner.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove board owner'
      });
    }

    board.members = board.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    await board.save();
    await board.populate('members.user', 'name email avatar');

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: board._id,
      action: 'member_removed',
      entity: {
        type: 'board',
        id: board._id,
        name: board.title
      },
      details: { removedUser: req.params.userId }
    });

    res.status(200).json({
      success: true,
      board
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};
