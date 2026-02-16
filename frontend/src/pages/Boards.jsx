import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoardStore, useAuthStore } from "../store";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import "../styles/Boards.css";

export default function Boards() {
  const navigate = useNavigate();
  const { boards, fetchBoards, createBoard, deleteBoard } = useBoardStore();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    backgroundColor: "#0079BF",
  });

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const board = await createBoard(formData);
      toast.success("Board created!");
      navigate(`/boards/${board._id}`);
    } catch (error) {
      toast.error("Failed to create board");
    }
  };

  return (
    <div className="boards-page">
      {/* HEADER */}
      <div className="boards-header-modern">
        <div>
          <h1>Your Boards</h1>
          <p className="boards-subtitle">
            Quick access to the boards you collaborate on
          </p>
        </div>

        <button
          className="btn btn-primary create-board-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Create Board
        </button>
      </div>

      {/* GRID */}
      <div className="boards-grid-modern">
        {boards.map((board) => (
          <article
            key={board._id}
            className="board-card-modern"
            onClick={() => navigate(`/boards/${board._id}`)}
          >
            <div
              className="board-cover-modern"
              style={{ backgroundColor: board.backgroundColor }}
            />

            <div className="board-content">
              <h3>
                {board.title}
                {board.owner && user && board.owner._id === user._id && (
                  <button
                    className="btn btn-icon btn-danger"
                    title="Delete board"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (
                        !window.confirm("Delete this board and all its data?")
                      )
                        return;
                      try {
                        await deleteBoard(board._id);
                        toast.success("Board deleted");
                      } catch (err) {
                        toast.error(err?.message || "Failed to delete board");
                      }
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </h3>
              {board.description && (
                <p className="board-desc">{board.description}</p>
              )}
            </div>
          </article>
        ))}

        {/* ADD BOARD TILE */}
        <div
          className="board-card-modern add-board-tile"
          onClick={() => setShowModal(true)}
        >
          <Plus size={28} />
          <span>Create new board</span>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-modern" onClick={(e) => e.stopPropagation()}>
            <h2>Create Board</h2>

            <form onSubmit={handleCreate} className="form-stack">
              <input
                type="text"
                placeholder="Board title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <div className="color-picker">
                <span>Background:</span>
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      backgroundColor: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-row">
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
