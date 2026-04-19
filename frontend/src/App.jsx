import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Trucks from './pages/Trucks'
import BookTruck from './pages/BookTruck'
import Track from './pages/Track'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import BookingHistory from './pages/BookingHistory'
import EditBooking from './pages/EditBooking'
import AdminLogin from './pages/admin/AdminLogin'
import AdminResetPassword from './pages/admin/AdminResetPassword'
import Dashboard from './pages/admin/Dashboard'
import Bookings from './pages/admin/Bookings'
import ManageTrucks from './pages/admin/ManageTrucks'
import Drivers from './pages/admin/Drivers'
import Reports from './pages/admin/Reports'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AdminLayout from './components/AdminLayout'
import WebsiteLayout from './components/WebsiteLayout'

function App() {
  return (
    <Routes>
      {/* Public Website Routes */}
      <Route element={<WebsiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trucks" element={<Trucks />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:bookingId" element={<Track />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Protected user routes */}
        <Route path="/book" element={<ProtectedRoute><BookTruck /></ProtectedRoute>} />
        <Route path="/booking-history" element={<ProtectedRoute><BookingHistory /></ProtectedRoute>} />
        <Route path="/edit-booking/:bookingId" element={<ProtectedRoute><EditBooking /></ProtectedRoute>} />
      </Route>

      {/* Admin Auth Routes (no sidebar) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      {/* Admin Protected Routes (with sidebar) */}
      <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="trucks" element={<ManageTrucks />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  )
}

export default App
