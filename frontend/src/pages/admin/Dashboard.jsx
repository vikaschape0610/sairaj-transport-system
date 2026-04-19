import { useState, useEffect } from 'react'
import { adminApi } from '../../api/axios'
import { useSocket } from '../../context/SocketContext'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const socket = useSocket()

  const fetchDashboard = async () => {
    try {
      const res = await adminApi.get('/dashboard')
      if (res.data.success) setData(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchDashboard() }, [])

  // ✅ Fixed: listen to correct socket events ('bookingCreated' not 'newBooking')
  // Also listen to truckUpdated for real-time dashboard refresh
  useEffect(() => {
    if (!socket) return
    const handler = () => fetchDashboard()
    socket.on('bookingCreated', handler)   // ✅ was 'newBooking' (wrong)
    socket.on('bookingUpdated', handler)
    socket.on('truckUpdated', handler)
    return () => {
      socket.off('bookingCreated', handler)
      socket.off('bookingUpdated', handler)
      socket.off('truckUpdated', handler)
    }
  }, [socket])

  if (loading) return <div className="loading-text">Loading dashboard...</div>
  if (!data) return <div className="error-box">Failed to load dashboard.</div>

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  const stats = [
    { label: 'Total Bookings', value: data.totalBookings, color: 'stat-blue', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'Pending', value: data.pendingBookings, color: 'stat-yellow', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'In Transit', value: data.inTransitCount, color: 'stat-orange', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { label: 'Delivered', value: data.deliveredCount, color: 'stat-green', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: 'Total Trucks', value: data.totalTrucks, color: 'stat-purple', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { label: 'Available', value: data.availableTrucks, color: 'stat-teal', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
    { label: 'Maintenance', value: data.maintenanceTrucks ?? 0, color: 'stat-red', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
    { label: 'Drivers', value: data.totalDrivers, color: 'stat-indigo', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  ]

  return (
    <div className="page-scroll">
    <div className="admin-page">
      <h1 className="admin-page-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle',marginRight:6}}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
        Dashboard
      </h1>

      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <div className={`stat-card ${s.color}`} key={i}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle',marginRight:6}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Recent Bookings
        </h2>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th><th>Customer</th><th>Goods</th><th>Route</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentBookings || []).map((b) => (
                <tr key={b.booking_id}>
                  <td><strong>{b.booking_id}</strong></td>
                  <td>{b.user_name || '—'}</td>
                  <td>{b.goods_type}</td>
                  <td>{b.pickup_location} → {b.destination}</td>
                  <td><span className={`status-badge status-${(b.status || '').replace(/\s+/g, '-')}`}>{b.status}</span></td>
                  <td>{formatDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  )
}
