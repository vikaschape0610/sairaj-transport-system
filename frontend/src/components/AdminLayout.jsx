import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useToast } from '../context/ToastContext'
import { useEffect, useState } from 'react'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const socket = useSocket()
  const { showToast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const adminEmail = sessionStorage.getItem('adminEmail') || 'Admin'

  const isActive = (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link'

  // Join admin room for real-time events
  useEffect(() => {
    if (socket) {
      socket.emit('joinAdmin')
      socket.on('newBooking', (data) => {
        showToast(`New booking: ${data.bookingId} from ${data.customerName}`, 'info', 6000)
      })
      return () => {
        socket.off('newBooking')
      }
    }
  }, [socket, showToast])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [location])

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    sessionStorage.removeItem('adminEmail')
    navigate('/admin/login')
  }

  return (
    <div className="admin-wrapper">
      {/* Hamburger — hidden when sidebar is open (avoids overlapping sidebar brand) */}
      <button
        className={`hamburger${sidebarOpen ? ' hamburger-hidden' : ''}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-inner">
            <div className="sidebar-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue-400)" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Sairaj Transport
            </div>
            <div className="sidebar-sub">Admin Panel</div>
          </div>
          {/* Close button — replaces hamburger X to avoid text overlap */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={isActive('/admin/dashboard')} >
            <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
            Dashboard
          </Link>
          <Link to="/admin/bookings" className={isActive('/admin/bookings')} >
            <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Bookings
          </Link>
          <Link to="/admin/trucks" className={isActive('/admin/trucks')} >
            <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Trucks
          </Link>
          <Link to="/admin/drivers" className={isActive('/admin/drivers')} >
            <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Drivers
          </Link>
          <Link to="/admin/reports" className={isActive('/admin/reports')} >
            <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Reports
          </Link>
        </nav>
        <div className="sidebar-footer">
          {/* View Website link */}
          <a href="/" target="_blank" rel="noopener noreferrer" className="sidebar-website-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Website
          </a>
          <div className="sidebar-admin-email">{adminEmail}</div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
