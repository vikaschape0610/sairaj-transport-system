// ============================================================
// pages/ForgotPassword.jsx – User Forgot Password (Single Screen)
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

// ── Validation helpers ────────────────────────────────────────
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isValidPassword = (pw) => pw.length >= 6;

export default function ForgotPassword() {
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

  // Auto-focus email on mount; first OTP box on stage change
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
    if (!/^\d?$/.test(value)) return; // numbers only
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus(); // advance to next box
    }
  }, []);

  // ── OTP: keyboard navigation ──────────────────────────────
  const handleOtpKeyDown = useCallback(
    (index, e) => {
      if (e.key === "Backspace" && otpDigits[index] === "" && index > 0) {
        otpRefs.current[index - 1]?.focus(); // go back on empty backspace
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
    const focusIdx = text.length < 6 ? text.length : 5;
    otpRefs.current[focusIdx]?.focus();
  }, []);

  // Combine OTP digits → single string
  const getOtp = () => otpDigits.join("");

  // ── Send OTP ──────────────────────────────────────────────
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
      const res = await api.post("/auth/send-otp", { email: trimmed });
      if (res.data.success) {
        showToast("OTP sent! Check your email inbox.", "success");
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

  // ── Reset Password ────────────────────────────────────────
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
      // STEP 1: Verify OTP
      await api.post("/auth/verify-otp", {
        email: email.trim(),
        otp,
      });

      // STEP 2: Reset password
      const res = await api.post("/auth/reset-password", {
        email: email.trim(),
        otp,
        newPassword,
      });
      if (res.data.success) {
        showToast("Password reset successful! Please log in.", "success");
        navigate("/login");
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

  // Keep handleReset in a ref so OTP keydown can always call the latest version
  const handleResetRef = useRef(handleReset);
  useEffect(() => {
    handleResetRef.current = handleReset;
  });

  // ── Back to email stage ───────────────────────────────────
  const goBack = () => {
    setStage("email");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmPassword("");
    setPwError("");
    setShowNew(false);
    setShowConfirm(false);
  };

  // ── Inline SVG icons ──────────────────────────────────────
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
      style={{ animation: "fp-spin .75s linear infinite" }}
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

  // ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes fp-spin   { to { transform: rotate(360deg); } }
        @keyframes fp-fadein { from { opacity:0; transform:translateY(26px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes fp-shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }

        .fp-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0d1b3e 0%, #1d4ed8 55%, #1e3a8a 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 28px 16px; position: relative; overflow: hidden;
        }
        .fp-page::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(ellipse at 18% 30%, rgba(96,165,250,.18) 0%, transparent 55%),
            radial-gradient(ellipse at 82% 75%, rgba(99,102,241,.14) 0%, transparent 55%);
        }
        .fp-card {
          position:relative; z-index:1; background:#fff; border-radius:24px;
          width:100%; max-width:448px; padding:44px 40px;
          box-shadow:0 24px 80px rgba(0,0,0,.30), 0 0 0 1px rgba(255,255,255,.12);
          animation:fp-fadein .42s cubic-bezier(.16,1,.3,1) both;
        }
        @media(max-width:500px){ .fp-card{ padding:32px 22px; } }

        .fp-icon {
          width:64px; height:64px;
          background:linear-gradient(135deg,#2563eb,#1d4ed8);
          border-radius:18px; display:flex; align-items:center; justify-content:center;
          margin:0 auto 20px; box-shadow:0 8px 24px rgba(37,99,235,.35);
        }

        .fp-progress{ display:flex; gap:6px; margin-bottom:26px; }
        .fp-prog-step{ flex:1; height:3px; border-radius:3px; background:#e5e7eb; transition:background .35s; }
        .fp-prog-step.active{ background:#2563eb; }

        .fp-badge{
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:20px;
          font-size:.75rem; font-weight:600; letter-spacing:.3px; margin-bottom:12px;
        }
        .fp-badge-blue{ background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
        .fp-badge-green{ background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }

        .fp-title{ font-size:1.5rem; font-weight:800; color:#0f1d44; text-align:center; margin-bottom:6px; letter-spacing:-.4px; }
        .fp-sub{ text-align:center; color:#6b7280; font-size:.875rem; line-height:1.55; margin-bottom:28px; }

        .fp-group{ margin-bottom:18px; }
        .fp-label{ display:block; font-size:.82rem; font-weight:600; color:#374151; margin-bottom:7px; }
        .fp-input-wrap{ position:relative; }
        .fp-input{
          width:100%; padding:13px 16px; border:2px solid #e5e7eb;
          border-radius:12px; font-size:.95rem; color:#1f2937;
          background:#f9fafb; font-family:inherit; outline:none;
          transition:border-color .2s, box-shadow .2s, background .2s;
        }
        .fp-input:focus{ border-color:#2563eb; background:#fff; box-shadow:0 0 0 4px rgba(37,99,235,.1); }
        .fp-input.err{ border-color:#dc2626; }
        .fp-input.with-eye{ padding-right:48px; }
        .fp-field-err{ color:#dc2626; font-size:.78rem; margin-top:5px; display:flex; align-items:center; gap:4px; }

        .fp-eye{
          position:absolute; right:13px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#9ca3af;
          display:flex; align-items:center; padding:5px; border-radius:6px; transition:color .2s;
        }
        .fp-eye:hover{ color:#374151; }
        .fp-eye:focus-visible{ outline:2px solid #2563eb; outline-offset:2px; }

        .fp-pw-error{
          color:#dc2626; font-size:.8rem; margin-bottom:14px;
          display:flex; align-items:center; gap:5px;
          animation:fp-shake .35s ease;
        }

        .fp-otp-row{ display:flex; gap:10px; justify-content:center; }
        .fp-otp-box{
          width:50px; height:56px; border:2px solid #e5e7eb; border-radius:12px;
          text-align:center; font-size:1.45rem; font-weight:700; color:#1d4ed8;
          background:#f9fafb; font-family:inherit; outline:none; caret-color:#2563eb;
          transition:border-color .18s, box-shadow .18s, transform .18s, background .18s;
        }
        .fp-otp-box:focus{ border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 4px rgba(37,99,235,.12); transform:scale(1.06); }
        .fp-otp-box.filled{ border-color:#1d4ed8; background:#eff6ff; }
        @media(max-width:400px){ .fp-otp-box{ width:42px; height:50px; font-size:1.2rem; } .fp-otp-row{ gap:7px; } }

        .fp-btn{
          width:100%; padding:14px; border:none; border-radius:12px;
          font-size:.97rem; font-weight:700; cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:transform .22s, box-shadow .22s, opacity .2s;
        }
        .fp-btn-primary{
          background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
          color:#fff; box-shadow:0 6px 20px rgba(37,99,235,.35);
        }
        .fp-btn-primary:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 10px 28px rgba(37,99,235,.42); }
        .fp-btn-primary:active:not(:disabled){ transform:translateY(0); }
        .fp-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none !important; }

        .fp-resend{ text-align:center; margin-top:14px; }
        .fp-resend-btn{
          background:none; border:none; cursor:pointer; color:#2563eb;
          font-size:.84rem; font-weight:600; font-family:inherit;
          padding:4px 6px; border-radius:6px; transition:color .2s;
        }
        .fp-resend-btn:hover{ color:#1d4ed8; text-decoration:underline; }
        .fp-resend-btn:focus-visible{ outline:2px solid #2563eb; outline-offset:2px; }
        .fp-resend-btn:disabled{ opacity:.5; cursor:not-allowed; }

        .fp-back{ text-align:center; margin-top:22px; border-top:1px solid #f3f4f6; padding-top:18px; }
        .fp-back a{ color:#9ca3af; font-size:.85rem; font-weight:500; transition:color .2s; }
        .fp-back a:hover{ color:#2563eb; }
      `}</style>

      <div className="fp-page">
        <div className="fp-card">
          {/* Icon */}
          <div className="fp-icon" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* Progress */}
          <div
            className="fp-progress"
            role="progressbar"
            aria-valuenow={stage === "email" ? 1 : 2}
            aria-valuemin={1}
            aria-valuemax={2}
          >
            <div className="fp-prog-step active" />
            <div
              className={`fp-prog-step${stage === "reset" ? " active" : ""}`}
            />
          </div>

          {/* ════ STAGE 1: Enter email ════════════════════════ */}
          {stage === "email" && (
            <>
              <span className="fp-badge fp-badge-blue">
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
                Step 1 of 2
              </span>
              <h1 className="fp-title">Forgot Password?</h1>
              <p className="fp-sub">
                Enter your registered email address and we'll send a 6-digit OTP
                to reset your password.
              </p>

              <div className="fp-group">
                <label htmlFor="fp-email" className="fp-label">
                  Email Address
                </label>
                <input
                  id="fp-email"
                  ref={emailRef}
                  type="email"
                  className={`fp-input${emailError ? " err" : ""}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) handleSendOtp();
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-describedby={emailError ? "fp-email-err" : undefined}
                  required
                />
                {emailError && (
                  <p id="fp-email-err" className="fp-field-err" role="alert">
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
                className="fp-btn fp-btn-primary"
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
                    Send OTP to Email
                  </>
                )}
              </button>
            </>
          )}

          {/* ════ STAGE 2: OTP + new password ════════════════ */}
          {stage === "reset" && (
            <>
              <span className="fp-badge fp-badge-green">
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
              <h1 className="fp-title">Reset Password</h1>
              <p className="fp-sub">
                Enter the 6-digit code from your email, then choose a new
                password.
              </p>

              {/* OTP boxes */}
              <div className="fp-group">
                <label className="fp-label">One-Time Password (OTP)</label>
                <div
                  className="fp-otp-row"
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
                      className={`fp-otp-box${digit ? " filled" : ""}`}
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
              <div className="fp-group">
                <label htmlFor="fp-newpw" className="fp-label">
                  New Password
                </label>
                <div className="fp-input-wrap">
                  <input
                    id="fp-newpw"
                    type={showNew ? "text" : "password"}
                    className="fp-input with-eye"
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
                    className="fp-eye"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div
                className="fp-group"
                style={{ marginBottom: pwError ? 4 : 18 }}
              >
                <label htmlFor="fp-confirmpw" className="fp-label">
                  Confirm New Password
                </label>
                <div className="fp-input-wrap">
                  <input
                    id="fp-confirmpw"
                    type={showConfirm ? "text" : "password"}
                    className={`fp-input with-eye${pwError ? " err" : ""}`}
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
                    className="fp-eye"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              {pwError && (
                <p className="fp-pw-error" role="alert">
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
                className="fp-btn fp-btn-primary"
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
                    Reset Password
                  </>
                )}
              </button>

              <div className="fp-resend">
                <button
                  type="button"
                  className="fp-resend-btn"
                  onClick={goBack}
                  disabled={loading}
                >
                  ← Change email or resend OTP
                </button>
              </div>
            </>
          )}

          <div className="fp-back">
            <Link to="/login">← Back to Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
