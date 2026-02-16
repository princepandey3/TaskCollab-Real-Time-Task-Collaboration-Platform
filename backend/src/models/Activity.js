const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "board_created",
        "board_updated",
        "board_deleted",
        "list_created",
        "list_updated",
        "list_deleted",
        "list_moved",
        "task_created",
        "task_updated",
        "task_deleted",
        "task_moved",
        "task_assigned",
        "task_unassigned",
        "member_added",
        "member_removed",
        "comment_added",
        "attachment_added",
      ],
    },
    entity: {
      type: {
        type: String,
        enum: ["board", "list", "task", "comment", "attachment"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
activitySchema.index({ board: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

// TTL index to auto-delete old activities after 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("Activity", activitySchema);
