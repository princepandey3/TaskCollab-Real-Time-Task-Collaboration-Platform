const Invite = require("../models/Invite");
const Board = require("../models/Board");
const Activity = require("../models/Activity");
const { v4: uuidv4 } = require("uuid");

// POST /api/boards/:id/invite
exports.createInvite = async (req, res) => {
  try {
    const boardId = req.params.id;
    const { email, expiresInDays = 7 } = req.body;

    const board = await Board.findById(boardId);
    if (!board)
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });

    // Only members (checked by middleware) can create invites
    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const invite = await Invite.create({
      token,
      board: boardId,
      inviter: req.user.id,
      email,
      expiresAt,
    });

    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontend}/invite/${invite.token}`;

    res
      .status(201)
      .json({
        success: true,
        invite: { token: invite.token, link, expiresAt },
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating invite",
        error: error.message,
      });
  }
};

// GET /api/invites/:token
exports.getInvite = async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token }).populate(
      "board",
      "title owner",
    );
    if (!invite)
      return res
        .status(404)
        .json({ success: false, message: "Invite not found" });
    if (invite.expiresAt && invite.expiresAt < new Date())
      return res
        .status(410)
        .json({ success: false, message: "Invite expired" });
    if (invite.used)
      return res
        .status(400)
        .json({ success: false, message: "Invite already used" });

    res.status(200).json({ success: true, invite });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching invite",
        error: error.message,
      });
  }
};

// POST /api/invites/:token/accept
exports.acceptInvite = async (req, res) => {
  try {
    // Requires authentication so we know which user accepts
    const invite = await Invite.findOne({ token: req.params.token });
    if (!invite)
      return res
        .status(404)
        .json({ success: false, message: "Invite not found" });
    if (invite.expiresAt && invite.expiresAt < new Date())
      return res
        .status(410)
        .json({ success: false, message: "Invite expired" });
    if (invite.used)
      return res
        .status(400)
        .json({ success: false, message: "Invite already used" });

    const board = await Board.findById(invite.board);
    if (!board)
      return res
        .status(404)
        .json({ success: false, message: "Board not found" });

    // Check if user already a member
    const alreadyMember =
      board.owner.toString() === req.user.id ||
      board.members.some((m) => m.user.toString() === req.user.id);
    if (alreadyMember) {
      invite.used = true;
      await invite.save();
      return res
        .status(200)
        .json({ success: true, message: "Already a member", board });
    }

    board.members.push({ user: req.user.id, role: "member" });
    await board.save();

    // Mark invite used
    invite.used = true;
    await invite.save();

    // Log activity
    await Activity.create({
      user: req.user.id,
      board: board._id,
      action: "member_added",
      entity: { type: "board", id: board._id, name: board.title },
      details: { invitedBy: invite.inviter },
    });

    // Notify via WebSocket
    if (global.wsService) {
      global.wsService.emitBoardEvent(board._id.toString(), "member_added", {
        userId: req.user.id,
        name: req.user.name || null,
      });
    }

    res.status(200).json({ success: true, board });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error accepting invite",
        error: error.message,
      });
  }
};
