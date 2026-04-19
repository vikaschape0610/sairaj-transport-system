import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useSocket } from '../context/SocketContext'
import PageHero from '../components/PageHero'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Track() {
  const { bookingId: paramId } = useParams()
  const navigate = useNavigate()
  const [inputId, setInputId] = useState('')
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const socket = useSocket()
  const resultRef = useRef(null)
  const hasParam = !!paramId

  // Auto-fetch when we have a URL param
  useEffect(() => {
    if (paramId) {
      fetchTracking(paramId)
    }
  }, [paramId])

  // Real-time updates
  useEffect(() => {
    if (socket && booking) {
      const handler = (data) => {
        if (data.bookingId === booking.booking_id) fetchTracking(booking.booking_id)
      }
      socket.on('bookingUpdated', handler)
      return () => socket.off('bookingUpdated', handler)
    }
  }, [socket, booking])

  const fetchTracking = async (id) => {
    const trackId = id || inputId.trim()
    if (!trackId) return
    setLoading(true)
    setError('')
    setBooking(null)
    try {
      const res = await api.get(`/bookings/track/${trackId}`)
      if (res.data.success) {
        setBooking(res.data.data)
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      } else {
        setError(res.data.message || 'Booking not found.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track booking.')
    }
    setLoading(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputId.trim()) {
      navigate(`/track/${inputId.trim().toUpperCase()}`)
    }
  }

  // PDF Download
  const downloadReport = () => {
    const b = booking
    const doc = new jsPDF()
    const statusColors = {
      Pending: [245, 158, 11], Confirmed: [37, 99, 235],
      'In Transit': [139, 92, 246], Delivered: [22, 163, 74], Cancelled: [220, 38, 38],
    }
    const sc = statusColors[b.status] || [107, 114, 128]

    // Header
    doc.setFillColor(30, 58, 138)
    doc.rect(0, 0, 210, 38, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Sairaj Transport', 14, 18)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Delivery Report', 14, 26)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(b.booking_id, 196, 19, { align: 'right' })
    // Status pill
    doc.setFillColor(sc[0], sc[1], sc[2])
    doc.setFontSize(10)
    const textWidth = doc.getTextWidth(b.status)
    const badgeWidth = textWidth + 10
    const badgeX = 197 - badgeWidth
    const badgeY = 22

    doc.setFillColor(sc[0], sc[1], sc[2])
    doc.roundedRect(badgeX, badgeY, badgeWidth, 8, 4, 4, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text(b.status, badgeX + badgeWidth / 2, badgeY + 5.5, { align: 'center' })

    // Details table
    doc.setTextColor(31, 41, 55)
    const details = [
      ['Pickup Location', b.pickup_location],
      ['Destination', b.destination],
      ['Goods Type', b.goods_type],
      ['Weight', `${b.weight_tons} tons`],
      ['Pickup Date', formatDate(b.pickup_date)],
      ['Delivery Date', formatDate(b.display_delivery_date)],
    ]
    if (b.truck_number) details.push(['Truck', `${b.truck_number} (${b.truck_type || ''})`])
    if (b.driver_name) details.push(['Driver', `${b.driver_name} (${b.driver_phone || ''})`])
    if (b.notes) details.push(['Notes', b.notes])

    autoTable(doc, {
    startY: 46,
    head: [['Field', 'Details']],
    body: details,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [107, 114, 128] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
    })

    // Footer
    const y = doc.lastAutoTable.finalY + 16
    doc.setDrawColor(229, 231, 235)
    doc.line(14, y, 196, y)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 105, y + 8, { align: 'center' })
    doc.text('Sairaj Transport • Chhatrapati Sambhajinagar, Maharashtra', 105, y + 14, { align: 'center' })

    try {
      doc.save(`delivery_Report_${b.booking_id}.pdf`)
    } catch (e) {
      // Fallback: open in new tab
      window.open(doc.output('bloburl'), '_blank')
    }
  }

  const statusSteps = ['Pending', 'Confirmed', 'In Transit', 'Delivered']
  const statusIdx = booking ? statusSteps.indexOf(booking.status) : -1
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  return (
    <>
      <PageHero
        title="Track Your Shipment"
        subtitle={hasParam
          ? `Showing tracking details for booking ${paramId}`
          : 'Enter your booking ID to get real-time shipment status updates.'}
      />

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 760 }}>

          {/* Show search input ONLY when no URL param */}
          {!hasParam && (
            <div className="track-search-card reveal-anim">
              <form onSubmit={handleSubmit} className="track-form">
                <div className="track-input-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="text"
                    className="track-input"
                    placeholder="Enter Booking ID (e.g. BK543620)"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-track" disabled={loading}>
                  {loading ? (
                    <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Tracking...</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Track Shipment</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Loading state for auto-fetch */}
          {hasParam && loading && (
            <div className="track-loading-box">
              <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <p>Fetching tracking details for <strong>{paramId}</strong>...</p>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          {booking && (
            <div className="track-result" ref={resultRef}>
              {/* Header */}
              <div className="track-header">
                <div>
                  <div className="track-id-label">Booking ID</div>
                  <h2>{booking.booking_id}</h2>
                  <p className="track-header-sub">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign:'middle',marginRight:4}}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {booking.pickup_location} → {booking.destination}
                  </p>
                </div>
                <div className="track-header-right">
                  <span className={`status-badge status-badge-lg status-${(booking.status || '').replace(/\s+/g, '-')}`}>
                    {booking.status}
                  </span>
                  {/* Download Report ONLY when Delivered */}
                  {booking.status === 'Delivered' && (
                    <button className="btn btn-sm btn-download" onClick={downloadReport}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Report
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {booking.status !== 'Cancelled' && (
                <div className="track-progress-wrap">
                  <div className="track-progress">
                    <div className="track-progress-line">
                      <div className="track-progress-fill" style={{ width: `${statusIdx >= 0 ? (statusIdx / (statusSteps.length - 1)) * 100 : 0}%` }}></div>
                    </div>
                    {statusSteps.map((step, i) => (
                      <div key={step} className={`track-step ${i <= statusIdx ? 'active' : ''} ${i === statusIdx ? 'current' : ''}`}>
                        <div className="track-step-dot">
                          {i <= statusIdx && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="track-step-label">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking.status === 'Cancelled' && (
                <div className="track-cancelled">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red-500)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  This booking has been cancelled.
                </div>
              )}

              {/* Details grid */}
              <div className="track-section-title">Shipment Details</div>
              <div className="track-details-grid">
                <div className="track-detail">
                  <span className="track-label">Pickup Location</span>
                  <span className="track-value">{booking.pickup_location}</span>
                </div>
                <div className="track-detail">
                  <span className="track-label">Destination</span>
                  <span className="track-value">{booking.destination}</span>
                </div>
                <div className="track-detail">
                  <span className="track-label">Goods Type</span>
                  <span className="track-value">{booking.goods_type}</span>
                </div>
                <div className="track-detail">
                  <span className="track-label">Weight</span>
                  <span className="track-value">{booking.weight_tons} tons</span>
                </div>
                <div className="track-detail">
                  <span className="track-label">Pickup Date</span>
                  <span className="track-value">{formatDate(booking.pickup_date)}</span>
                </div>
                <div className="track-detail">
                  <span className="track-label">Expected Delivery</span>
                  <span className="track-value">{formatDate(booking.display_delivery_date)}</span>
                </div>
                {booking.truck_number && (
                  <div className="track-detail">
                    <span className="track-label">Truck Assigned</span>
                    <span className="track-value">{booking.truck_number} {booking.truck_type ? `(${booking.truck_type})` : ''}</span>
                  </div>
                )}
                {booking.driver_name && (
                  <div className="track-detail">
                    <span className="track-label">Driver</span>
                    <span className="track-value">{booking.driver_name} {booking.driver_phone ? `· ${booking.driver_phone}` : ''}</span>
                  </div>
                )}
              </div>

              {booking.notes && (
                <div className="track-notes">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue-500)" strokeWidth="2" style={{verticalAlign:'middle',marginRight:6}}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <strong>Notes:</strong> {booking.notes}
                </div>
              )}

              {/* Back to bookings */}
              {hasParam && (
                <div className="track-back">
                  <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate("/booking-history")}
                      >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5m7-7l-7 7 7 7"/>
                    </svg>
                    Back to My Bookings
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
