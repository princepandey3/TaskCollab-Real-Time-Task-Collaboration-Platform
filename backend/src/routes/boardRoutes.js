const express = require("express");
const router = express.Router();
const {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember,
} = require("../controllers/boardController");
const { createInvite } = require("../controllers/inviteController");
const { protect, isBoardMember } = require("../middleware/auth");

router.route("/").get(protect, getBoards).post(protect, createBoard);

router
  .route("/:id")
  .get(protect, isBoardMember, getBoard)
  .put(protect, isBoardMember, updateBoard)
  .delete(protect, deleteBoard);

// Create invite link for a board
router.post("/:id/invite", protect, isBoardMember, createInvite);

router.route("/:id/members").post(protect, isBoardMember, addMember);

router
  .route("/:id/members/:userId")
  .delete(protect, isBoardMember, removeMember);

module.exports = router;
