import { Calendar } from "lucide-react";
import "../styles/components.css";

export default function TaskCard({ task, onClick, isDragging }) {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "priority-urgent",
      high: "priority-high",
      medium: "priority-medium",
      low: "priority-low",
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div
      className="task-card"
      onClick={() => !isDragging && onClick && onClick(task)}
      onMouseDown={(e) => {
        // Prevent double-click from selecting text and interfering with drag
        if (e.detail > 1) e.preventDefault();
      }}
    >
      {/* Header */}
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>

        {task.priority && (
          <span className={`task-priority ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      {/* Footer Meta */}
      <div className="task-footer">
        {task.dueDate && (
          <span className="task-due-date">
            <Calendar size={14} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {task.assignedTo && task.assignedTo.length > 0 && (
          <div className="task-assignees">
            {task.assignedTo.slice(0, 3).map((user) => (
              <div key={user._id} className="task-avatar" title={user.name}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
            {task.assignedTo.length > 3 && (
              <div className="task-avatar more">
                +{task.assignedTo.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
