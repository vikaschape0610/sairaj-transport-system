import { useState, useEffect } from 'react'
import { adminApi } from '../../api/axios'
import { useToast } from '../../context/ToastContext'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchDrivers = async () => {
    try {
      const res = await adminApi.get('/drivers')
      if (res.data.success) setDrivers(res.data.data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchDrivers() }, [])

  const openAdd = () => setModal({ mode: 'add', data: { name: '', phone: '', license_number: '' } })
  const openEdit = (d) => setModal({ mode: 'edit', data: { ...d } })

  const handleChange = (e) => setModal({ ...modal, data: { ...modal.data, [e.target.name]: e.target.value } })

  const handleSave = async () => {
    setSaving(true)
    try {
      let res
      if (modal.mode === 'add') {
        res = await adminApi.post('/drivers', modal.data)
      } else {
        res = await adminApi.put(`/drivers/${modal.data.id}`, modal.data)
      }
      if (res.data.success) { showToast(modal.mode === 'add' ? 'Driver added!' : 'Driver updated!', 'success'); setModal(null); fetchDrivers() }
      else showToast(res.data.message, 'error')
    } catch (err) { showToast(err.response?.data?.message || 'Failed.', 'error') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this driver?')) return
    try {
      const res = await adminApi.delete(`/drivers/${id}`)
      if (res.data.success) { showToast('Driver removed!', 'success'); fetchDrivers() }
      else showToast(res.data.message, 'error')
    } catch (err) { showToast('Delete failed.', 'error') }
  }

  return (
    <div className="page-scroll">
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/>
            <path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          Manage Drivers
        </h1>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Driver
        </button>
      </div>

      {loading ? <div className="loading-text">Loading drivers...</div> : (
        <div className="admin-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>License</th><th>Status</th><th>Assigned Truck</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.phone}</td>
                    <td>{d.license_number || '—'}</td>
                    <td><span className={`status-badge status-${(d.status || '').replace(/\s+/g, '-')}`}>{d.status}</span></td>
                    <td>{d.assigned_truck_number || '—'}</td>
                    <td className="table-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => openEdit(d)} title="Edit">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d.id)} title="Delete">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.mode === 'add' ? 'Add New Driver' : 'Edit Driver'}</h2>
            <div className="form-group"><label className="form-label">Full Name</label><input type="text" name="name" className="form-input" value={modal.data.name} onChange={handleChange} required placeholder="Driver Name" /></div>
            <div className="form-group"><label className="form-label">Phone (10 digits)</label><input type="tel" name="phone" className="form-input" value={modal.data.phone} onChange={handleChange} required placeholder="9876543210" maxLength="10" /></div>
            <div className="form-group"><label className="form-label">License Number</label><input type="text" name="license_number" className="form-input" value={modal.data.license_number || ''} onChange={handleChange} placeholder="MH01 20230001234" /></div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Saving...</>
                ) : 'Save Driver'}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
