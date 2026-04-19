import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import WhatsAppButton from './WhatsAppButton'

export default function WebsiteLayout() {
  return (
    <div className="site-wrapper">
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
