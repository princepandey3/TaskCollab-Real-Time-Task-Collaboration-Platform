const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'List title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
  taskOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for performance
listSchema.index({ board: 1, position: 1 });

// Virtual for tasks
listSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'list'
});

module.exports = mongoose.model('List', listSchema);
