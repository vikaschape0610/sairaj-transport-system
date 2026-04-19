import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHero from "../components/PageHero";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in — must be in useEffect, not render body
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        // AuthContext.login() saves token as 'userToken' — no need to save again
        login({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone,
          token: res.data.token,
        });
        showToast("Login successful!", "success");
        navigate("/");
      } else {
        showToast(res.data.message || "Login failed.", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Login failed.", "error");
    }
    setLoading(false);
  };

  return (
    <>
      <PageHero
        title="Login to Your Account"
        subtitle="Access your Sairaj Roadlines account to manage bookings and track shipments."
      />
      <section className="section-sm">
        <div className="container" style={{ maxWidth: 460 }}>
          <div className="auth-card">
            <h2>Welcome Back</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="spin"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>{" "}
                    Logging in...
                  </>
                ) : (
                  <>Login</>
                )}
              </button>
            </form>
            <div className="auth-links">
              <Link to="/forgot-password">Forgot Password?</Link>
              <span>
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
