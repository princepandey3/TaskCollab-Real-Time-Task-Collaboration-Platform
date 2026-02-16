import { useState } from "react";
import { X, Trash2, Calendar, Flag, Users, AlignLeft } from "lucide-react";
import toast from "react-hot-toast";
import { taskAPI } from "../services/api";
import { useBoardStore } from "../store";
import "../styles/Board.css";

export default function TaskModal({ task, members = [], onClose }) {
  const { updateTask, deleteTask } = useBoardStore();
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(task.priority || "medium");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSaving(true);
    try {
      const { task: updated } = await taskAPI.updateTask(task._id, {
        title,
        description,
        priority,
        dueDate: dueDate || null,
      });
      updateTask(task._id, updated);
      toast.success("Task updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssign = async (userId, isAssigned) => {
    setAssigning(true);
    try {
      if (isAssigned) {
        const { task: updated } = await taskAPI.unassignTask(task._id, userId);
        updateTask(task._id, updated);
        toast.success("Member unassigned");
      } else {
        const { task: updated } = await taskAPI.assignTask(task._id, {
          userId,
        });
        updateTask(task._id, updated);
        toast.success("Member assigned");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to update assignment");
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This action cannot be undone."))
      return;
    try {
      await taskAPI.deleteTask(task._id);
      deleteTask(task._id);
      toast.success("Task deleted successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to delete task");
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e",
    };
    return colors[priority] || colors.medium;
  };

  const assignedMembers = (task.assignedTo || []).map((a) =>
    typeof a === "string" ? a : a._id,
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-modern task-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h2 className="modal-title">Edit Task</h2>
            <p className="modal-subtitle">
              Update task details and assignments
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Title Input */}
          <div className="form-group">
            <label className="form-label">
              <AlignLeft size={16} />
              <span>Task Title</span>
              <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              <AlignLeft size={16} />
              <span>Description</span>
            </label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={4}
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="form-row-grid">
            <div className="form-group">
              <label className="form-label">
                <Flag size={16} />
                <span>Priority</span>
              </label>
              <div className="select-wrapper">
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    borderLeft: `3px solid ${getPriorityColor(priority)}`,
                  }}
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Assigned Members */}
          <div className="form-group">
            <label className="form-label">
              <Users size={16} />
              <span>Assign Members</span>
              <span className="badge badge-count">
                {assignedMembers.length}
              </span>
            </label>

            {members.length === 0 ? (
              <div className="empty-state">
                <Users size={32} className="empty-icon" />
                <p>No members available</p>
              </div>
            ) : (
              <div className="members-grid">
                {members.map((m) => {
                  const userId =
                    typeof m.user === "string" ? m.user : m.user._id;
                  const userName =
                    typeof m.user === "string" ? "User" : m.user.name;
                  const userEmail =
                    typeof m.user === "string" ? "" : m.user.email;
                  const isAssigned = assignedMembers.includes(userId);

                  return (
                    <div
                      key={userId}
                      className={`member-card ${isAssigned ? "member-assigned" : ""}`}
                    >
                      <div className="member-info">
                        <div className="member-avatar">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="member-details">
                          <div className="member-name">{userName}</div>
                          {userEmail && (
                            <div className="member-email">{userEmail}</div>
                          )}
                        </div>
                      </div>
                      <button
                        className={`btn-member-toggle ${isAssigned ? "assigned" : ""}`}
                        onClick={() => toggleAssign(userId, isAssigned)}
                        disabled={assigning}
                      >
                        {isAssigned ? "✓ Assigned" : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={saving || assigning}
          >
            <Trash2 size={16} />
            <span>Delete Task</span>
          </button>
          <div className="modal-footer-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving || assigning}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || assigning || !title.trim()}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-modern {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideUp 0.3s ease-out;
          overflow: hidden;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .modal-header-content {
          flex: 1;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          color: white;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          opacity: 0.9;
          margin: 0;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          flex-shrink: 0;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-label svg {
          color: #6b7280;
        }

        .required {
          color: #ef4444;
          margin-left: 0.125rem;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.9375rem;
          transition: all 0.2s;
          font-family: inherit;
          background: white;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .select-wrapper {
          position: relative;
        }

        .form-select {
          appearance: none;
          cursor: pointer;
          padding-right: 2.5rem;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
        }

        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .form-row-grid {
            grid-template-columns: 1fr;
          }
        }

        .badge-count {
          background: #667eea;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .members-grid {
          display: grid;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .member-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s;
          background: white;
        }

        .member-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .member-card.member-assigned {
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%);
          border-color: #667eea;
        }

        .member-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .member-assigned .member-avatar {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .member-details {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-weight: 600;
          color: #111827;
          font-size: 0.9375rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-email {
          font-size: 0.8125rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-member-toggle {
          padding: 0.5rem 1rem;
          border: 2px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .btn-member-toggle:hover:not(:disabled) {
          background: #667eea;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
        }

        .btn-member-toggle.assigned {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .btn-member-toggle.assigned:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
        }

        .btn-member-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #9ca3af;
        }

        .empty-icon {
          margin: 0 auto 0.5rem;
          opacity: 0.5;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: #f9fafb;
          flex-wrap: wrap;
        }

        .modal-footer-actions {
          display: flex;
          gap: 0.75rem;
          margin-left: auto;
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .btn-danger {
          background: white;
          color: #ef4444;
          border: 2px solid #fee2e2;
        }

        .btn-danger:hover:not(:disabled) {
          background: #fef2f2;
          border-color: #fecaca;
        }

        @media (max-width: 640px) {
          .modal-modern {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
            margin: 0;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-title {
            font-size: 1.25rem;
          }

          .modal-body {
            padding: 1rem;
          }

          .modal-footer {
            padding: 1rem;
            flex-direction: column;
            align-items: stretch;
          }

          .modal-footer-actions {
            width: 100%;
            margin-left: 0;
          }

          .btn {
            flex: 1;
          }

          .btn-danger {
            width: 100%;
          }

          .member-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .btn-member-toggle {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .modal-footer-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
