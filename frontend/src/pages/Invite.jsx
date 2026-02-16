import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { inviteAPI } from "../services/api";
import { useAuthStore } from "../store";
import toast from "react-hot-toast";
import "../styles/Auth.css";

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await inviteAPI.getInvite(token);
        setInvite(res.invite);
      } catch (err) {
        toast.error(err?.message || "Invalid invite");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await inviteAPI.acceptInvite(token);
      toast.success("You have joined the board");
      navigate(`/boards/${res.board._id}`);
    } catch (err) {
      toast.error(err?.message || "Failed to accept invite");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page invite-page">
        <div className="invite-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="auth-page invite-page">
        <div className="invite-card error-card">
          <div className="error-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Invite Not Found</h2>
          <p className="muted">This invite link is invalid or has expired</p>
          <Link to="/boards" className="btn btn-primary">
            Go to Boards
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page invite-page">
      <div className="invite-card">
        <div className="invite-header">
          <div className="board-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="3" width="8" height="8" rx="2" fill="#0079bf" />
              <rect
                x="13"
                y="3"
                width="8"
                height="8"
                rx="2"
                fill="#0079bf"
                opacity="0.7"
              />
              <rect
                x="3"
                y="13"
                width="8"
                height="8"
                rx="2"
                fill="#0079bf"
                opacity="0.5"
              />
              <rect
                x="13"
                y="13"
                width="8"
                height="8"
                rx="2"
                fill="#0079bf"
                opacity="0.3"
              />
            </svg>
          </div>
          <h1>Board Invitation</h1>
        </div>

        <div className="invite-content">
          <h2>You're invited to join</h2>
          <div className="board-name">"{invite.board.title}"</div>
          <p className="muted">
            {invite.inviter ? (
              <>
                Invited by <strong>{invite.inviter}</strong>
              </>
            ) : (
              "Join this board to collaborate with the team"
            )}
          </p>
        </div>

        <div className="invite-actions">
          {isAuthenticated ? (
            <button
              className="btn btn-primary btn-large"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? "Joining..." : "Accept Invitation"}
            </button>
          ) : (
            <>
              <p className="auth-prompt">
                Sign in or create an account to join this board
              </p>
              <div className="action-buttons">
                <Link
                  to={`/login?redirect=/invite/${token}`}
                  className="btn btn-primary btn-large"
                >
                  Sign In
                </Link>
                <Link
                  to={`/register?redirect=/invite/${token}`}
                  className="btn btn-secondary btn-large"
                >
                  Create Account
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
