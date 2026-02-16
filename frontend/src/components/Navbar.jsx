import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import "../styles/components.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Left Section */}
        <Link to="/boards" className="nav-brand">
          <div className="brand-logo">TC</div>
          <div className="brand-text">
            <strong>TaskCollab</strong>
            <span className="brand-tagline">Collaborate better</span>
          </div>
        </Link>

        {/* Desktop User Section */}
        <div className={`nav-right ${mobileOpen ? "open" : ""}`}>
          <div className="nav-user">
            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
            </div>
            <span className="user-name">{user?.name}</span>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
}
