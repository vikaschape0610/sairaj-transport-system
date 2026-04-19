// ============================================================
// pages/BookingHistory.jsx – My Bookings (Secured)
// Fetches from /bookings/user — email read from JWT on backend
// ============================================================

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import PageHero from "../components/PageHero";

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          el.classList.remove("hidden");
        } else {
          el.classList.remove("revealed");
          el.classList.add("hidden");
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealCard({ children, delay = 0 }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className="bh-card scroll-reveal reveal-up"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function BookingHistory() {
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      // ✅ No email in URL — backend reads it from JWT
      // api instance automatically attaches the Authorization header
      const res = await api.get("/bookings/user");
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        // 401 is handled by axios interceptor (redirect to login)
        console.error("Failed to fetch bookings:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  // Real-time booking status updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    // ✅ UPDATE EVENT
    const handleUpdated = (data) => {
      console.log("📡 USER received update:", data);

      if (!data || !data.bookingId) return;

      showToast(`Booking ${data.bookingId} updated: ${data.status}`, "info");

      fetchBookings();
    };

    // ✅ DELETE EVENT
    const handleDeleted = (data) => {
      console.log("🗑️ USER received delete:", data);

      if (!data || !data.bookingId) return;

      showToast(`Booking ${data.bookingId} deleted`, "warning");

      fetchBookings();
    };

    socket.on("bookingUpdated", handleUpdated);
    socket.on("bookingDeleted", handleDeleted);

    return () => {
      socket.off("bookingUpdated", handleUpdated);
      socket.off("bookingDeleted", handleDeleted);
    };
  }, [socket]);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const statusConfig = {
    Pending: {
      color: "var(--yellow-500)",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    Confirmed: {
      color: "var(--blue-500)",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    "In Transit": {
      color: "var(--purple-500)",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    Delivered: {
      color: "var(--green-500)",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    Cancelled: {
      color: "var(--red-500)",
      icon: (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  };

  return (
    <>
      <PageHero
        title="My Bookings"
        subtitle="View, track and manage your full booking history."
      />
      <section className="section-sm">
        <div className="container">
          {loading ? (
            <div className="loading-text">Loading your bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gray-300)"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 style={{ marginBottom: 8, color: "var(--gray-700)" }}>
                No bookings yet
              </h3>
              <p>Start by booking your first truck and it will appear here.</p>
              <Link
                to="/book"
                className="btn btn-primary"
                style={{ marginTop: 20 }}
              >
                Book Your First Truck
              </Link>
            </div>
          ) : (
            <>
              <div className="bh-summary">
                <span>
                  {bookings.length} booking{bookings.length !== 1 ? "s" : ""}{" "}
                  found
                </span>
              </div>
              <div className="bookings-list">
                {bookings.map((b, idx) => {
                  const cfg = statusConfig[b.status] || statusConfig.Pending;
                  return (
                    <RevealCard key={b.booking_id} delay={idx * 40}>
                      <div
                        className={`bh-card-accent bh-card-${(b.status || "").replace(/\s+/g, "-").toLowerCase()}-accent`}
                      />
                      <div className="bh-card-body">
                        <div className="bh-card-top">
                          <div className="bh-card-id">
                            <div
                              className="bh-status-icon"
                              style={{
                                color: cfg.color,
                                background: `${cfg.color}18`,
                              }}
                            >
                              {cfg.icon}
                            </div>
                            <div>
                              <h3>{b.booking_id}</h3>
                              <span className="bh-date">
                                Booked on{" "}
                                {formatDate(b.created_at || b.pickup_date)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`status-badge status-${(b.status || "").replace(/\s+/g, "-")}`}
                          >
                            {b.status}
                          </span>
                        </div>

                        <div className="bh-route">
                          <div className="bh-route-point">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="var(--blue-500)"
                              stroke="none"
                            >
                              <circle cx="12" cy="12" r="6" />
                            </svg>
                            <span>{b.pickup_location}</span>
                          </div>
                          <div className="bh-route-line" />
                          <div className="bh-route-point">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--green-600)"
                              strokeWidth="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{b.destination}</span>
                          </div>
                        </div>

                        <div className="bh-chips">
                          <span className="bh-chip">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                            </svg>
                            {b.goods_type}
                          </span>
                          <span className="bh-chip">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            {b.weight_tons}T
                          </span>
                          <span className="bh-chip">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatDate(b.pickup_date)}
                          </span>
                          {b.truck_number && (
                            <span className="bh-chip bh-chip-truck">
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="1"
                                  y="3"
                                  width="15"
                                  height="13"
                                  rx="2"
                                />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                              </svg>
                              {b.truck_number}
                            </span>
                          )}
                        </div>

                        <div className="bh-actions">
                          <Link
                            to={`/track/${b.booking_id}`}
                            className="btn btn-sm btn-primary"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            Track
                          </Link>
                          {b.status === "Pending" && (
                            <Link
                              to={`/edit-booking/${b.booking_id}`}
                              className="btn btn-sm btn-outline"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Edit
                            </Link>
                          )}
                        </div>
                      </div>
                    </RevealCard>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
