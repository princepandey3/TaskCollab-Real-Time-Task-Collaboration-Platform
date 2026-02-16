const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Create new list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res) => {
  try {
    const { title, board } = req.body;

    // Get the highest position
    const lastList = await List.findOne({ board }).sort('-position');
    const position = lastList ? lastList.position + 1 : 0;

    const list = await List.create({
      title,
      board,
      position
    });

    // Log activity
    await Activity.create({
      user: req.user.id,
      board,
      action: 'list_created',
      entity: {
        type: 'list',
        id: list._id,
        name: list.title
      }
    });

    res.status(201).json({
      success: true,
      list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating list',
      error: error.message
    });
  }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
exports.updateList = async (req, res) => {
  try {
    let list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    list = await List.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: list.board,
      action: 'list_updated',
      entity: {
        type: 'list',
        id: list._id,
        name: list.title
      },
      details: req.body
    });

    res.status(200).json({
      success: true,
      list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating list',
      error: error.message
    });
  }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    // Delete associated tasks
    await Task.deleteMany({ list: list._id });

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: list.board,
      action: 'list_deleted',
      entity: {
        type: 'list',
        id: list._id,
        name: list.title
      }
    });

    await list.deleteOne();

    res.status(200).json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting list',
      error: error.message
    });
  }
};

// @desc    Move list (reorder)
// @route   PUT /api/lists/:id/move
// @access  Private
exports.moveList = async (req, res) => {
  try {
    const { newPosition } = req.body;
    const list = await List.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }

    const oldPosition = list.position;

    // Get all lists in board
    const lists = await List.find({ board: list.board }).sort('position');

    // Update positions
    if (newPosition > oldPosition) {
      // Moving right
      await List.updateMany(
        {
          board: list.board,
          position: { $gt: oldPosition, $lte: newPosition }
        },
        { $inc: { position: -1 } }
      );
    } else if (newPosition < oldPosition) {
      // Moving left
      await List.updateMany(
        {
          board: list.board,
          position: { $gte: newPosition, $lt: oldPosition }
        },
        { $inc: { position: 1 } }
      );
    }

    list.position = newPosition;
    await list.save();

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: list.board,
      action: 'list_moved',
      entity: {
        type: 'list',
        id: list._id,
        name: list.title
      },
      details: { oldPosition, newPosition }
    });

    res.status(200).json({
      success: true,
      list
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error moving list',
      error: error.message
    });
  }
};
