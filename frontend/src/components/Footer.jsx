import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              SR – Sairaj Roadlines
              <span>Reliable Road Transport Partner</span>
            </div>
          </div>
          <div className="footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Support</a>
            <a href="/#about">About</a>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Sairaj Roadlines. All rights reserved. | Chhatrapati Sambhajinagar, Maharashtra
        </div>
      </div>
    </footer>
  )
}
