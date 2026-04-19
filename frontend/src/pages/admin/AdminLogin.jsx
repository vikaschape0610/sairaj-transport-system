import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import api from '../../api/axios'

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await api.post('/admin/login', { email, password })
      if (res.data.success) {
        // sessionStorage — auto-clears when tab/browser is closed
        sessionStorage.setItem('adminToken', res.data.token)
        sessionStorage.setItem('adminEmail', res.data.admin.email)
        showToast('Admin login successful!', 'success')
        navigate('/admin/dashboard')
      } else { showToast(res.data.message, 'error') }
    } catch (err) { showToast(err.response?.data?.message || 'Login failed.', 'error') }
    setLoading(false)
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="1.8">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1>Sairaj Transport</h1>
          <p>Admin Panel Login</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="admin@sairaj.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <button type="button" className="password-toggle"
                onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOpen /> : <EyeOff />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? (
              <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Logging in...</>
            ) : 'Login to Admin Panel'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/admin/reset-password">Forgot Password?</Link>
          <Link to="/">← Back to Website</Link>
        </div>
      </div>
    </div>
  )
}
