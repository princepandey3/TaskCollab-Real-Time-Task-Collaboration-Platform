import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store";
import toast from "react-hot-toast";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect") || "/boards";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData);
      toast.success("Welcome back!");
      navigate(redirect);
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-page">
      <div className="auth-visual" aria-hidden>
        <div className="logo-mark">TC</div>
        <h2>Collaborate faster. Build better.</h2>
        <p className="muted">Real-time task collaboration for teams</p>
      </div>

      <main className="auth-panel">
        <div className="auth-card">
          <header className="card-header">
            <div className="brand">
              <div className="brand-logo">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="2"
                    fill="#6C5CE7"
                  />
                  <rect
                    x="13"
                    y="3"
                    width="8"
                    height="8"
                    rx="2"
                    fill="#00B894"
                  />
                  <rect
                    x="3"
                    y="13"
                    width="8"
                    height="8"
                    rx="2"
                    fill="#0984E3"
                  />
                  <rect
                    x="13"
                    y="13"
                    width="8"
                    height="8"
                    rx="2"
                    fill="#FD79A8"
                  />
                </svg>
              </div>
              <div>
                <h1>TaskCollab</h1>
                <p className="muted">Sign in to your account</p>
              </div>
            </div>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-row">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="row between">
              <label className="remember">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot" className="muted small">
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="divider">or</div>

            <div className="socials">
              <button type="button" className="btn btn-ghost">
                Continue with Google
              </button>
            </div>
          </form>

          <footer className="card-footer">
            <p>
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
