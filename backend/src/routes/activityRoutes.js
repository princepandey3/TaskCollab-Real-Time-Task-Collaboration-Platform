const express = require('express');
const router = express.Router();
const {
  getBoardActivity,
  getUserActivity
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/board/:boardId', protect, getBoardActivity);
router.get('/user', protect, getUserActivity);

module.exports = router;
