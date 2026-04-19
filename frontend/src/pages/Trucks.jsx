import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import PageHero from '../components/PageHero'

const WA_NUMBER = '919284652405'

// Derive production backend URL from VITE_API_URL (strip /api suffix)
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://sairaj-transport-system.onrender.com/api').replace('/api', '')

// Handle both old /uploads/ paths and new base64 data URLs
const getImageSrc = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;  // base64 — use as-is
  return `${BACKEND_URL}${imageUrl}`;                  // old disk path
}

// Scroll reveal hook (bidirectional)
function useScrollReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          el.classList.remove('hidden')
        } else {
          el.classList.remove('revealed')
          el.classList.add('hidden')
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function TruckCard({ truck, onWhatsApp }) {
  const ref = useScrollReveal()
  return (
    <div ref={ref} className="truck-card scroll-reveal reveal-up">
      <div className="truck-card-image">
        {truck.image_url ? (
          <img src={getImageSrc(truck.image_url)} alt={truck.truck_number} />
        ) : (
          <div className="truck-card-no-image">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--blue-300)" strokeWidth="1.2">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            <span>{truck.truck_number}</span>
          </div>
        )}
        <span className={`truck-status-badge ${truck.status === 'Available' ? 'available' : 'busy'}`}>
          {truck.status}
        </span>
      </div>
      <div className="truck-card-body">
        <h3>{truck.truck_number}</h3>
        <div className="truck-card-meta">
          <div className="truck-meta-row">
            <span className="truck-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              </svg>
              {truck.type}
            </span>
            <span className="truck-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              {truck.capacity_tons}T Capacity
            </span>
          </div>
          <div className="truck-meta-row">
            {truck.base_location && (
              <span className="truck-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {truck.base_location}
              </span>
            )}
            {truck.year && (
              <span className="truck-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {truck.year}
              </span>
            )}
          </div>
        </div>
        <div className="truck-card-actions">
          <button className="btn btn-whatsapp-inquiry btn-sm" onClick={() => onWhatsApp(truck)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Inquiry
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Trucks() {
  const { isLoggedIn } = useAuth()
  const [trucks, setTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', capacity: '' })

  const fetchTrucks = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.type) params.type = filters.type
      if (filters.capacity) params.capacity = filters.capacity
      const res = await api.get('/trucks', { params })
      if (res.data.success) setTrucks(res.data.data)
    } catch (err) {
      console.error('Failed to load trucks')
    }
    setLoading(false)
  }

  useEffect(() => { fetchTrucks() }, [filters])

  // ✅ Real-time: refetch when admin adds/edits/deletes a truck
  const socket = useSocket()
  useEffect(() => {
    if (!socket) return
    const handler = () => fetchTrucks()
    socket.on('truckUpdated', handler)
    return () => socket.off('truckUpdated', handler)
  }, [socket, filters])

  const handleWhatsApp = (truck) => {
    const msg = encodeURIComponent(`Hello, I want to inquire about truck: ${truck.truck_number} (${truck.type}, ${truck.capacity_tons}T)`)
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <>
      <PageHero
        title="Our Truck Fleet"
        subtitle="Browse our verified fleet of trucks available for booking across Maharashtra."
      />

      <section className="section-sm">
        <div className="container">
          {/* Filters */}
          <div className="truck-filters">
            <select className="form-input form-select" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All Types</option>
              <option value="Container">Container</option>
              <option value="Open Body">Open Body</option>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Trailer">Trailer</option>
            </select>
            <select className="form-input form-select" value={filters.capacity} onChange={(e) => setFilters(f => ({ ...f, capacity: e.target.value }))}>
              <option value="">All Capacities</option>
              <option value="upto12">Up to 12 Tons</option>
              <option value="12to20">12 – 20 Tons</option>
              <option value="20plus">20+ Tons</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-text">Loading trucks...</div>
          ) : trucks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h3 style={{marginBottom:8,color:'var(--gray-700)'}}>No trucks found</h3>
              <p>No trucks match your current filters. Try adjusting them.</p>
            </div>
          ) : (
            <div className="trucks-grid">
              {trucks.map((truck) => (
                <TruckCard key={truck.id} truck={truck} onWhatsApp={handleWhatsApp} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
