// ============================================================
// pages/Signup.jsx – Simple Signup (no OTP required)
// ============================================================
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import PageHero from '../components/PageHero'

const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      showToast('Name, email, phone, and password are required.', 'error')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      showToast('Enter a valid email address.', 'error')
      return
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      showToast('Phone must be a 10-digit number.', 'error')
      return
    }
    if (form.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error')
      return
    }
    if (form.password !== form.confirm) {
      showToast('Passwords do not match.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        password: form.password,
      })

      if (res.data.success) {
        login({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          token: res.data.token,
        })
        showToast('Account created! Welcome to Sairaj Transport.', 'success')
        navigate('/')
      } else {
        showToast(res.data.message || 'Signup failed.', 'error')
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Signup failed. Try again.', 'error')
    }
    setLoading(false)
  }

  return (
    <>
      <PageHero title="Create Account" subtitle="Sign up to book trucks and track your shipments." />
      <section className="section-sm">
        <div className="container" style={{ maxWidth: 500 }}>
          <div className="auth-card">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" value={form.name}
                  onChange={handleChange} required placeholder="John Doe" />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" name="email" className="form-input" value={form.email}
                  onChange={handleChange} required placeholder="you@example.com" />
              </div>

              <div className="form-group">
                <label className="form-label">Phone (10 digits)</label>
                <input type="tel" name="phone" className="form-input" value={form.phone}
                  onChange={handleChange} required placeholder="9876543210" maxLength="10" />
              </div>

              <div className="form-group">
                <label className="form-label">Company (optional)</label>
                <input type="text" name="company" className="form-input" value={form.company}
                  onChange={handleChange} placeholder="Your company name" />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-password-wrap">
                  <input type={showPw ? 'text' : 'password'} name="password" className="form-input"
                    value={form.password} onChange={handleChange} required placeholder="Min. 6 characters" />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-password-wrap">
                  <input type={showCf ? 'text' : 'password'} name="confirm" className="form-input"
                    value={form.confirm} onChange={handleChange} required placeholder="Re-enter password" />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowCf(v => !v)} tabIndex={-1}
                    aria-label={showCf ? 'Hide password' : 'Show password'}>
                    {showCf ? <EyeOpen /> : <EyeOff />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                {loading
                  ? <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg> Creating Account…</>
                  : 'Create Account'
                }
              </button>
            </form>
            <div className="auth-links">
              <span>Already have an account? <Link to="/login">Login</Link></span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
