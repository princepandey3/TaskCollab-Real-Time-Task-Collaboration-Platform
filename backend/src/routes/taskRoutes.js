const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  assignTask,
  unassignTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.put('/:id/move', protect, moveTask);
router.post('/:id/assign', protect, assignTask);
router.delete('/:id/assign/:userId', protect, unassignTask);

module.exports = router;
