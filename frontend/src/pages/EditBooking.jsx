import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import PageHero from '../components/PageHero'

// Same goods options as BookTruck.jsx
const GOODS_OPTIONS = [
  'Agricultural Products',
  'Industrial Machinery',
  'Construction Materials',
  'Food & Beverages',
  'Chemicals',
  'Textiles',
  'Electronics',
]

export default function EditBooking() {
  const { bookingId } = useParams()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    pickup_location: '', destination: '', goods_type: '', custom_goods: '',
    weight_tons: '', pickup_date: '', delivery_date: '', notes: '',
  })

  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(res => {
      if (res.data.success) {
        const b = res.data.data
        const knownGoods = GOODS_OPTIONS.includes(b.goods_type)
        setForm({
          pickup_location: b.pickup_location || '',
          destination: b.destination || '',
          goods_type: knownGoods ? b.goods_type : 'other',
          custom_goods: knownGoods ? '' : (b.goods_type || ''),
          weight_tons: b.weight_tons || '',
          pickup_date: b.pickup_date ? b.pickup_date.split('T')[0] : '',
          delivery_date: b.delivery_date ? b.delivery_date.split('T')[0] : '',
          notes: b.notes || '',
        })
      }
      setLoading(false)
    }).catch(() => { showToast('Failed to load booking.', 'error'); setLoading(false) })
  }, [bookingId])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const goods_type = form.goods_type === 'other' ? form.custom_goods : form.goods_type
      const res = await api.put(`/bookings/${bookingId}`, { ...form, goods_type })
      if (res.data.success) { showToast('Booking updated!', 'success'); navigate('/booking-history') }
      else showToast(res.data.message, 'error')
    } catch (err) { showToast(err.response?.data?.message || 'Update failed.', 'error') }
    setSaving(false)
  }

  if (loading) return (
    <>
      <PageHero title="Edit Booking" subtitle={`Modifying booking ${bookingId}`} />
      <div className="loading-text" style={{ padding: '60px 0' }}>Loading booking details...</div>
    </>
  )

  return (
    <>
      <PageHero title={`Edit Booking`} subtitle={`Modifying pending booking ${bookingId}`} />
      <section className="section-sm">
        <div className="container" style={{ maxWidth: 660 }}>
          <div className="book-form-card">
            <div className="book-form-header">
              <h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" strokeWidth="2" style={{verticalAlign:'middle', marginRight:8}}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                {bookingId}
              </h2>
              <p>Update the details below. Only pending bookings can be edited.</p>
            </div>
            <div className="book-form-body">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Pickup Location</label>
                    <input type="text" name="pickup_location" className="form-input" value={form.pickup_location} onChange={handleChange} required placeholder="e.g. Chha. SambhajiNagar, MH" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input type="text" name="destination" className="form-input" value={form.destination} onChange={handleChange} required placeholder="e.g. Mumbai, MH" />
                  </div>

                  {/* ✅ FIX: goods_type is now a dropdown (was plain text input) */}
                  <div className="form-group">
                    <label className="form-label">Goods Type</label>
                    <select name="goods_type" className="form-input form-select" value={form.goods_type} onChange={handleChange} required>
                      <option value="" disabled>Select goods type</option>
                      {GOODS_OPTIONS.map(g => <option key={g}>{g}</option>)}
                      <option value="other">Other</option>
                    </select>
                    {form.goods_type === 'other' && (
                      <input type="text" name="custom_goods" className="form-input" placeholder="Specify goods type" value={form.custom_goods} onChange={handleChange} required style={{ marginTop: 10 }} />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (tons)</label>
                    <input type="number" name="weight_tons" className="form-input" value={form.weight_tons} onChange={handleChange} step="0.5" min="0.5" max="40" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pickup Date</label>
                    <input type="date" name="pickup_date" className="form-input" value={form.pickup_date} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Delivery Date</label>
                    <input type="date" name="delivery_date" className="form-input" value={form.delivery_date} onChange={handleChange} min={form.pickup_date} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Notes (optional)</label>
                    <textarea name="notes" className="form-input" rows="3" value={form.notes} onChange={handleChange} placeholder="Any special requirements..."></textarea>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={saving}>
                    {saving ? (
                      <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving...</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v14a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes</>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => navigate('/booking-history')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5m7-7l-7 7 7 7"/>
                    </svg>
                    Back
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
