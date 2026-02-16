import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useBoardStore } from "../store";
import { listAPI, taskAPI, boardAPI } from "../services/api";
import wsClient from "../services/websocket";
import toast from "react-hot-toast";
import { Plus, MoreVertical, X } from "lucide-react";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import "../styles/Board.css";

export default function Board() {
  const { id } = useParams();
  const {
    currentBoard,
    fetchBoard,
    addList,
    updateList,
    deleteList,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
  } = useBoardStore();
  const [loading, setLoading] = useState(true);
  const [newListTitle, setNewListTitle] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [newTaskTitles, setNewTaskTitles] = useState({});
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpires, setInviteExpires] = useState(7);
  const [inviteResult, setInviteResult] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadBoard();

    // Setup WebSocket listeners
    const unsubscribeTask = wsClient.on("task_event", handleTaskEvent);
    const unsubscribeList = wsClient.on("list_event", handleListEvent);

    return () => {
      unsubscribeTask();
      unsubscribeList();
    };
  }, [id]);

  const loadBoard = async () => {
    try {
      await fetchBoard(id);
    } catch (error) {
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskEvent = (data) => {
    const { event, task } = data;

    switch (event) {
      case "created":
        addTask(task);
        break;
      case "updated":
        updateTask(task._id, task);
        break;
      case "deleted":
        deleteTask(task._id);
        break;
      case "moved": {
        // payload should include oldListId/newListId/position
        const oldListId = task.oldListId || task.fromList || null;
        const newListId = task.newListId || task.list?._id || task.list || null;
        const newPosition =
          typeof task.position === "number" ? task.position : 0;
        if (oldListId && newListId) {
          moveTask(task._id, oldListId, newListId, newPosition);
        } else {
          // Fallback: reload board to ensure consistency
          loadBoard();
        }
        break;
      }
    }
  };

  const handleListEvent = (data) => {
    const { event, list } = data;

    switch (event) {
      case "created":
        addList(list);
        break;
      case "updated":
        updateList(list._id, list);
        break;
      case "deleted":
        deleteList(list._id);
        break;
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const { list } = await listAPI.createList({
        title: newListTitle,
        board: id,
      });
      addList(list);
      setNewListTitle("");
      setShowNewList(false);
      toast.success("List created");
    } catch (error) {
      toast.error("Failed to create list");
    }
  };

  const handleCreateTask = async (listId) => {
    const title = newTaskTitles[listId];
    if (!title?.trim()) return;

    try {
      const { task } = await taskAPI.createTask({
        title,
        list: listId,
        board: id,
      });
      addTask(task);
      setNewTaskTitles({ ...newTaskTitles, [listId]: "" });
      toast.success("Task created");
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Delete this list and all its tasks?")) return;

    try {
      await listAPI.deleteList(listId);
      deleteList(listId);
      toast.success("List deleted");
    } catch (error) {
      toast.error("Failed to delete list");
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    if (type === "task") {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;
      const taskId = result.draggableId;

      // Optimistically update UI
      moveTask(taskId, sourceListId, destListId, destination.index);

      // Update backend
      try {
        await taskAPI.moveTask(taskId, {
          newListId: destListId,
          newPosition: destination.index,
        });
      } catch (error) {
        toast.error("Failed to move task");
        loadBoard(); // Reload on error
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading board...</div>;
  }

  if (!currentBoard) {
    return <div className="error">Board not found</div>;
  }

  return (
    <div className="board-page">
      {/* HEADER */}
      <div className="board-header-modern">
        <div className="board-header-left">
          <div>
            <h1>{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="board-description">{currentBoard.description}</p>
            )}
          </div>
        </div>

        <div className="board-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setInviteModal(true)}
          >
            Invite
          </button>
        </div>
      </div>

      {/* LISTS */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="lists-wrapper">
          {currentBoard.lists.map((list) => (
            <section key={list._id} className="list-card">
              <div className="list-header-modern">
                <h3>{list.title}</h3>
                <div className="list-header-right">
                  <span className="task-count">{list.tasks.length}</span>
                  <button
                    className="btn btn-icon btn-danger"
                    title="Delete list"
                    onClick={() => handleDeleteList(list._id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <Droppable droppableId={list._id} type="task">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`tasks-area ${
                      snapshot.isDraggingOver ? "drag-active" : ""
                    }`}
                  >
                    {list.tasks.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={task._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`task-drag-wrap ${
                              snapshot.isDragging ? "task-dragging" : ""
                            }`}
                          >
                            <TaskCard
                              task={task}
                              onClick={setSelectedTask}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* ADD TASK */}
              <div className="add-task-modern">
                <input
                  type="text"
                  placeholder="Add a card..."
                  value={newTaskTitles[list._id] || ""}
                  onChange={(e) =>
                    setNewTaskTitles({
                      ...newTaskTitles,
                      [list._id]: e.target.value,
                    })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateTask(list._id)
                  }
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCreateTask(list._id)}
                >
                  Add
                </button>
              </div>
            </section>
          ))}

          {/* ADD LIST */}
          {showNewList ? (
            <div className="list-card new-list-modern">
              <form onSubmit={handleCreateList} className="form-stack">
                <input
                  type="text"
                  placeholder="Enter list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                />

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Add List
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewList(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              className="add-list-modern"
              onClick={() => setShowNewList(true)}
            >
              <Plus size={18} />
              Add another list
            </button>
          )}
        </div>
      </DragDropContext>

      {/* INVITE MODAL */}
      {inviteModal && (
        <div className="modal-overlay" onClick={() => setInviteModal(false)}>
          <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
            <h2>Invite to {currentBoard.title}</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setInviteResult(null);
                  const res = await boardAPI.createInvite(id, {
                    email: inviteEmail,
                    expiresInDays: inviteExpires,
                  });
                  setInviteResult(res.invite);
                  toast.success("Invite created");
                } catch (err) {
                  toast.error(err?.message || "Failed to create invite");
                }
              }}
              className="form-stack"
            >
              <input
                type="email"
                placeholder="invitee@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />

              <input
                type="number"
                min={1}
                value={inviteExpires}
                onChange={(e) => setInviteExpires(Number(e.target.value))}
              />

              <div className="form-row">
                <button type="submit" className="btn btn-primary">
                  Create Invite
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setInviteModal(false)}
                >
                  Close
                </button>
              </div>

              {inviteResult && (
                <div className="invite-result-modern">
                  <input readOnly value={inviteResult.link} />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteResult.link);
                      toast.success("Copied");
                    }}
                  >
                    Copy
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          members={currentBoard.members || []}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
