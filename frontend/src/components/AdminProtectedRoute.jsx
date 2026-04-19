import { Navigate } from 'react-router-dom'

export default function AdminProtectedRoute({ children }) {
  const token = sessionStorage.getItem('adminToken')
  if (!token) return <Navigate to="/admin/login" replace />

  // Check token expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      sessionStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminEmail')
      return <Navigate to="/admin/login" replace />
    }
  } catch {
    sessionStorage.removeItem('adminToken')
    sessionStorage.removeItem('adminEmail')
    return <Navigate to="/admin/login" replace />
  }

  return children
}
