const Activity = require('../models/Activity');

// @desc    Get board activity history
// @route   GET /api/activities/board/:boardId
// @access  Private
exports.getBoardActivity = async (req, res) => {
  try {
    const { boardId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ board: boardId })
      .populate('user', 'name email avatar')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Activity.countDocuments({ board: boardId });

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// @desc    Get user activity history
// @route   GET /api/activities/user
// @access  Private
exports.getUserActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ user: req.user.id })
      .populate('board', 'title')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Activity.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};
