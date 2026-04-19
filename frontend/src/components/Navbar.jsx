//navbar.jsx

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation();

  // ✅ FIRST THIS
  const handleNavClick = (path) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ✅ THEN THIS
  const handleAboutClick = () => {
    if (location.pathname !== "/") {
      window.location.href = "/?scrollTo=about";
    } else {
      const section = document.getElementById("about");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };
  const dropdownRef = useRef(null)

  const isActive = (path) => location.pathname === path ? 'active' : ''

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location])

  return (
    <nav className="navbar">
      <div className="container nav-flex">
        <Link to="/" className="logo" onClick={() => handleNavClick("/")}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--blue-600)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          Sairaj Roadlines
        </Link>

        <ul className="nav-links">
          <li>
            <Link
              to="/"
              className={isActive("/")}
              onClick={() => handleNavClick("/")}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/trucks"
              className={isActive("/trucks")}
              onClick={() => handleNavClick("/trucks")}
            >
              Trucks
            </Link>
          </li>
          <li>
            <Link
              to="/book"
              className={isActive("/book")}
              onClick={() => handleNavClick("/book")}
            >
              Book Truck
            </Link>
          </li>
          <li>
            <Link
              to="/track"
              className={isActive("/track")}
              onClick={() => handleNavClick("/track")}
            >
              Track Shipment
            </Link>
          </li>
          <li>
            <button
              onClick={handleAboutClick}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              About Us
            </button>
          </li>
        </ul>

        <div className="nav-right">
          {isLoggedIn ? (
            <div className="user-menu" ref={dropdownRef}>
              <div
                className="user-box"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {user.name}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              {dropdownOpen && (
                <div className="dropdown show">
                  <Link
                    to="/booking-history"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    My Bookings
                  </Link>
                  <a
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/signup" className="btn-signup">
                Sign Up
              </Link>
            </>
          )}
          {/* Hide admin login when user is logged in */}
          {!isLoggedIn && (
            <Link to="/admin/login" className="btn-admin-login">
              Admin
            </Link>
          )}
          <div
            className="menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>

        {/* ── Nav links ── */}
        <Link to="/" onClick={() => { handleNavClick('/'); setMobileOpen(false); }}>Home</Link>
        <Link to="/trucks" onClick={() => { handleNavClick('/trucks'); setMobileOpen(false); }}>Trucks</Link>
        <Link to="/book" onClick={() => { handleNavClick('/book'); setMobileOpen(false); }}>Book Truck</Link>
        <Link to="/track" onClick={() => { handleNavClick('/track'); setMobileOpen(false); }}>Track Shipment</Link>
        <button onClick={handleAboutClick}>About Us</button>

        {isLoggedIn ? (
          <>
            <Link to="/booking-history" onClick={() => setMobileOpen(false)}>My Bookings</Link>
            <a onClick={() => { logout(); setMobileOpen(false); }} style={{ cursor: 'pointer' }}>Logout</a>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
            <Link to="/signup" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            <Link to="/admin/login" onClick={() => setMobileOpen(false)}>Admin Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}
