const express = require("express");
const router = express.Router();
const { getInvite, acceptInvite } = require("../controllers/inviteController");
const { protect } = require("../middleware/auth");

router.get("/:token", getInvite);
router.post("/:token/accept", protect, acceptInvite);

module.exports = router;
