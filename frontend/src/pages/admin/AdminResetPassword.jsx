// ============================================================
// pages/admin/AdminResetPassword.jsx – Admin Forgot Password
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

// ── Validation helpers ────────────────────────────────────────
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const isValidPassword = (p) => p.length >= 6;

export default function AdminResetPassword() {
  const [stage, setStage] = useState("email"); // 'email' | 'reset'
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");

  const { showToast } = useToast();
  const navigate = useNavigate();
  const otpRefs = useRef([]);
  const emailRef = useRef(null);

  useEffect(() => {
    if (stage === "email") {
      emailRef.current?.focus();
    } else {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [stage]);

  // ── OTP: digit input ──────────────────────────────────────
  const handleOtpChange = useCallback((index, value) => {
    if (!/^\d?$/.test(value)) return;
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  // ── OTP: keyboard navigation ──────────────────────────────
  const handleResetRef = useRef(null);
  const handleOtpKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && otpDigits[index] === "" && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleResetRef.current?.();
      }
    },
    [otpDigits],
  );

  // ── OTP: paste support ────────────────────────────────────
  const handleOtpPaste = useCallback((e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) updated[i] = text[i];
    setOtpDigits(updated);
    otpRefs.current[text.length < 6 ? text.length : 5]?.focus();
  }, []);

  const getOtp = () => otpDigits.join("");

  // ── Send OTP  (POST /api/admin/send-otp) ──────────────────
  const handleSendOtp = async () => {
    setEmailError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // api base is /api — admin routes live under /api/admin/…
      const res = await api.post("/admin/send-otp", { email: trimmed });
      if (res.data.success) {
        showToast("OTP sent to admin email!", "success");
        setStage("reset");
      } else {
        showToast(res.data.message || "Failed to send OTP.", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to send OTP. Try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password (POST /api/admin/reset-password) ───────
  const handleReset = async () => {
    setPwError("");
    const otp = getOtp();

    if (otp.length < 6) {
      showToast("Please enter the complete 6-digit OTP.", "error");
      const firstEmpty = otpDigits.findIndex((d) => d === "");
      otpRefs.current[firstEmpty >= 0 ? firstEmpty : 5]?.focus();
      return;
    }
    if (!isValidPassword(newPassword)) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/reset-password", {
        email: email.trim(),
        otp,
        newPassword,
      });
      if (res.data.success) {
        showToast("Admin password reset! Please log in.", "success");
        navigate("/admin/login");
      } else {
        showToast(
          res.data.message || "Reset failed. Please try again.",
          "error",
        );
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Reset failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Keep handleReset ref up-to-date for OTP keydown usage
  useEffect(() => {
    handleResetRef.current = handleReset;
  });

  const goBack = () => {
    setStage("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setPwError("");
    setShowNew(false);
    setShowConfirm(false);
  };

  // ── Icons ─────────────────────────────────────────────────
  const EyeOpen = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
  const EyeOff = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  const Spinner = () => (
    <svg
      style={{ animation: "arp-spin .75s linear infinite" }}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );

  const otpComplete = getOtp().length === 6;

  return (
    <>
      <style>{`
        @keyframes arp-spin   { to { transform: rotate(360deg); } }
        @keyframes arp-fadein { from { opacity:0; transform:translateY(26px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes arp-shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

        .arp-page {
          min-height: 100vh;
          background: linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #1e3a8a 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 28px 16px; position: relative; overflow: hidden;
        }
        .arp-page::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse at 15% 50%, rgba(99,102,241,.16) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 20%, rgba(37,99,235,.13) 0%, transparent 55%);
        }
        .arp-card {
          position:relative; z-index:1; background:#fff; border-radius:24px;
          width:100%; max-width:448px; padding:44px 40px;
          box-shadow:0 32px 100px rgba(0,0,0,.40), 0 0 0 1px rgba(255,255,255,.1);
          animation:arp-fadein .42s cubic-bezier(.16,1,.3,1) both;
        }
        @media(max-width:500px){ .arp-card{ padding:32px 22px; } }

        .arp-icon {
          width:68px; height:68px;
          background:linear-gradient(135deg,#4f46e5,#1d4ed8);
          border-radius:20px; display:flex; align-items:center; justify-content:center;
          margin:0 auto 20px; box-shadow:0 10px 30px rgba(79,70,229,.4);
        }

        .arp-progress{ display:flex; gap:6px; margin-bottom:26px; }
        .arp-prog-step{ flex:1; height:3px; border-radius:3px; background:#e5e7eb; transition:background .35s; }
        .arp-prog-step.active{ background:#4f46e5; }

        .arp-badge{
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:20px;
          font-size:.75rem; font-weight:600; letter-spacing:.3px; margin-bottom:12px;
        }
        .arp-badge-indigo{ background:#eef2ff; color:#4338ca; border:1px solid #c7d2fe; }
        .arp-badge-green { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }

        .arp-title{ font-size:1.5rem; font-weight:800; color:#0f172a; text-align:center; margin-bottom:6px; letter-spacing:-.4px; }
        .arp-sub{ text-align:center; color:#64748b; font-size:.875rem; line-height:1.55; margin-bottom:28px; }

        .arp-group{ margin-bottom:18px; }
        .arp-label{ display:block; font-size:.82rem; font-weight:600; color:#334155; margin-bottom:7px; }
        .arp-input-wrap{ position:relative; }
        .arp-input{
          width:100%; padding:13px 16px; border:2px solid #e2e8f0;
          border-radius:12px; font-size:.95rem; color:#1e293b;
          background:#f8fafc; font-family:inherit; outline:none;
          transition:border-color .2s, box-shadow .2s, background .2s;
        }
        .arp-input:focus{ border-color:#4f46e5; background:#fff; box-shadow:0 0 0 4px rgba(79,70,229,.1); }
        .arp-input.err{ border-color:#dc2626; }
        .arp-input.with-eye{ padding-right:48px; }
        .arp-field-err{ color:#dc2626; font-size:.78rem; margin-top:5px; display:flex; align-items:center; gap:4px; }

        .arp-eye{
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94a3b8;
          display:flex; align-items:center; padding:5px; border-radius:6px; transition:color .2s;
        }
        .arp-eye:hover{ color:#334155; }
        .arp-eye:focus-visible{ outline:2px solid #4f46e5; outline-offset:2px; }

        .arp-pw-error{
          color:#dc2626; font-size:.8rem; margin-bottom:14px;
          display:flex; align-items:center; gap:5px;
          animation:arp-shake .35s ease;
        }

        .arp-otp-row{ display:flex; gap:10px; justify-content:center; }
        .arp-otp-box{
          width:50px; height:56px; border:2px solid #e2e8f0; border-radius:12px;
          text-align:center; font-size:1.45rem; font-weight:700; color:#4338ca;
          background:#f8fafc; font-family:inherit; outline:none; caret-color:#4f46e5;
          transition:border-color .18s, box-shadow .18s, transform .18s, background .18s;
        }
        .arp-otp-box:focus{ border-color:#4f46e5; background:#eef2ff; box-shadow:0 0 0 4px rgba(79,70,229,.12); transform:scale(1.06); }
        .arp-otp-box.filled{ border-color:#4338ca; background:#eef2ff; }
        @media(max-width:400px){ .arp-otp-box{ width:42px; height:50px; font-size:1.2rem; } .arp-otp-row{ gap:7px; } }

        .arp-btn{
          width:100%; padding:14px; border:none; border-radius:12px;
          font-size:.97rem; font-weight:700; cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:transform .22s, box-shadow .22s, opacity .2s;
        }
        .arp-btn-primary{
          background:linear-gradient(135deg,#4f46e5 0%,#1d4ed8 100%);
          color:#fff; box-shadow:0 6px 20px rgba(79,70,229,.35);
        }
        .arp-btn-primary:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 10px 28px rgba(79,70,229,.42); }
        .arp-btn-primary:active:not(:disabled){ transform:translateY(0); }
        .arp-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none !important; }

        .arp-resend{ text-align:center; margin-top:14px; }
        .arp-resend-btn{
          background:none; border:none; cursor:pointer; color:#4f46e5;
          font-size:.84rem; font-weight:600; font-family:inherit;
          padding:4px 6px; border-radius:6px; transition:color .2s;
        }
        .arp-resend-btn:hover{ color:#4338ca; text-decoration:underline; }
        .arp-resend-btn:disabled{ opacity:.5; cursor:not-allowed; }

        .arp-back{ text-align:center; margin-top:22px; border-top:1px solid #f1f5f9; padding-top:18px; }
        .arp-back a{ color:#94a3b8; font-size:.85rem; font-weight:500; transition:color .2s; }
        .arp-back a:hover{ color:#4f46e5; }
      `}</style>

      <div className="arp-page">
        <div className="arp-card">
          {/* Icon */}
          <div className="arp-icon" aria-hidden="true">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          {/* Progress */}
          <div
            className="arp-progress"
            role="progressbar"
            aria-valuenow={stage === "email" ? 1 : 2}
            aria-valuemin={1}
            aria-valuemax={2}
          >
            <div className="arp-prog-step active" />
            <div
              className={`arp-prog-step${stage === "reset" ? " active" : ""}`}
            />
          </div>

          {/* ════ STAGE 1: Enter admin email ═════════════════ */}
          {stage === "email" && (
            <>
              <span className="arp-badge arp-badge-indigo">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Admin · Step 1 of 2
              </span>
              <h1 className="arp-title">Reset Admin Password</h1>
              <p className="arp-sub">
                Enter your admin email address and we'll send a 6-digit OTP to
                verify your identity.
              </p>

              <div className="arp-group">
                <label htmlFor="arp-email" className="arp-label">
                  Admin Email Address
                </label>
                <input
                  id="arp-email"
                  ref={emailRef}
                  type="email"
                  className={`arp-input${emailError ? " err" : ""}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) handleSendOtp();
                  }}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  aria-describedby={emailError ? "arp-email-err" : undefined}
                  required
                />
                {emailError && (
                  <p id="arp-email-err" className="arp-field-err" role="alert">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              <button
                className="arp-btn arp-btn-primary"
                onClick={handleSendOtp}
                disabled={loading || !email.trim()}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Spinner /> Sending OTP…
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                    </svg>
                    Send OTP
                  </>
                )}
              </button>
            </>
          )}

          {/* ════ STAGE 2: OTP + new password ════════════════ */}
          {stage === "reset" && (
            <>
              <span className="arp-badge arp-badge-green">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                OTP sent · {email}
              </span>
              <h1 className="arp-title">Set New Password</h1>
              <p className="arp-sub">
                Enter the 6-digit OTP from your email, then set your new admin
                password.
              </p>

              {/* OTP boxes */}
              <div className="arp-group">
                <label className="arp-label">6-Digit OTP Code</label>
                <div
                  className="arp-otp-row"
                  onPaste={handleOtpPaste}
                  role="group"
                  aria-label="OTP input"
                >
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={1}
                      className={`arp-otp-box${digit ? " filled" : ""}`}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      aria-label={`OTP digit ${i + 1}`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div className="arp-group">
                <label htmlFor="arp-newpw" className="arp-label">
                  New Password
                </label>
                <div className="arp-input-wrap">
                  <input
                    id="arp-newpw"
                    type={showNew ? "text" : "password"}
                    className="arp-input with-eye"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwError("");
                    }}
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="arp-eye"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    aria-label={showNew ? "Hide" : "Show"}
                  >
                    {showNew ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div
                className="arp-group"
                style={{ marginBottom: pwError ? 4 : 18 }}
              >
                <label htmlFor="arp-confirmpw" className="arp-label">
                  Confirm New Password
                </label>
                <div className="arp-input-wrap">
                  <input
                    id="arp-confirmpw"
                    type={showConfirm ? "text" : "password"}
                    className={`arp-input with-eye${pwError ? " err" : ""}`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPwError("");
                    }}
                    placeholder="Re-enter your password"
                    minLength={6}
                    autoComplete="new-password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) handleReset();
                    }}
                  />
                  <button
                    type="button"
                    className="arp-eye"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide" : "Show"}
                  >
                    {showConfirm ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              {pwError && (
                <p className="arp-pw-error" role="alert">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {pwError}
                </p>
              )}

              <button
                className="arp-btn arp-btn-primary"
                onClick={handleReset}
                disabled={loading || !otpComplete}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Spinner /> Resetting Password…
                  </>
                ) : (
                  <>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Reset Admin Password
                  </>
                )}
              </button>

              <div className="arp-resend">
                <button
                  type="button"
                  className="arp-resend-btn"
                  onClick={goBack}
                  disabled={loading}
                >
                  ← Change email or resend OTP
                </button>
              </div>
            </>
          )}

          <div className="arp-back">
            <Link to="/admin/login">← Back to Admin Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
