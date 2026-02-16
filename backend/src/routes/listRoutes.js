const express = require('express');
const router = express.Router();
const {
  createList,
  updateList,
  deleteList,
  moveList
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createList);

router.route('/:id')
  .put(protect, updateList)
  .delete(protect, deleteList);

router.put('/:id/move', protect, moveList);

module.exports = router;
