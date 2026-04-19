//Home.jsx

import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useLocation } from "react-router-dom";

// Bidirectional scroll reveal hook
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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({
  children,
  className = "",
  direction = "up",
  delay = 0,
  ...props
}) {
  const ref = useScrollReveal();
  return (
    <section
      ref={ref}
      className={`${className} scroll-reveal reveal-${direction}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </section>
  );
}

function RevealDiv({
  children,
  className = "",
  direction = "up",
  delay = 0,
  ...props
}) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`${className} scroll-reveal reveal-${direction}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api
      .get("/bookings/stats")
      .then((res) => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionId = params.get("scrollTo");

    if (sectionId) {
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location]);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag animate-fade-in">
              🚚 Maharashtra's Trusted Transport Network
            </div>
            <p
              className="hero-welcome animate-fade-in"
              style={{ animationDelay: ".1s" }}
            >
              Welcome to Sairaj Roadlines – Reliable Truck Transport Services
            </p>
            <h1 className="animate-slide-up" style={{ animationDelay: ".15s" }}>
              Manage your <em>road transport</em> operations in one place
            </h1>
            <p
              className="hero-sub animate-fade-in"
              style={{ animationDelay: ".25s" }}
            >
              Connect with verified transporters, book trucks instantly, and
              track your shipments in real time — all from one powerful
              platform.
            </p>
            <div
              className="hero-buttons animate-fade-in"
              style={{ animationDelay: ".35s" }}
            >
              <Link to="/trucks">
                <button className="btn btn-white btn-lg">
                  <svg
                    width="18"
                    height="18"
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
                  Browse Trucks
                </button>
              </Link>
              <Link to="/book">
                <button className="btn btn-outline btn-lg hero-btn-outline">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 12V22H4V12" />
                    <path d="M22 7H2v5h20V7z" />
                    <path d="M12 22V7" />
                    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
                  </svg>
                  Book a Truck
                </button>
              </Link>
            </div>
            <div
              className="hero-stats animate-fade-in"
              style={{ animationDelay: ".45s" }}
            >
              <div>
                <div className="hero-stat-num">
                  {stats.totalTrucks
                    ? `${Math.max(Number(stats.totalTrucks), 20)}+`
                    : "20+"}
                </div>
                <div className="hero-stat-label">Verified Trucks</div>
              </div>
              <div>
                <div className="hero-stat-num">
                  {stats.totalDelivered
                    ? `${100 + Number(stats.totalDelivered)}+`
                    : "100+"}
                </div>
                <div className="hero-stat-label">Deliveries Done</div>
              </div>
              <div>
                <div className="hero-stat-num">15+</div>
                <div className="hero-stat-label">Cities Across Maharashtra</div>
              </div>
              <div>
                <div className="hero-stat-num">99%</div>
                <div className="hero-stat-label">On-Time Rate</div>
              </div>
            </div>
          </div>
        </div>
        {/* Floating truck visual */}
        <div className="hero-truck-visual">
          <svg
            width="320"
            height="200"
            viewBox="0 0 320 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            opacity="0.12"
          >
            <rect x="10" y="60" width="200" height="100" rx="8" fill="white" />
            <rect x="210" y="85" width="95" height="75" rx="6" fill="white" />
            <path
              d="M210 85 L255 55 L305 55 L305 160"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="55" cy="170" r="22" fill="white" />
            <circle cx="55" cy="170" r="10" fill="rgba(255,255,255,0.3)" />
            <circle cx="255" cy="170" r="22" fill="white" />
            <circle cx="255" cy="170" r="10" fill="rgba(255,255,255,0.3)" />
            <rect
              x="160"
              y="80"
              width="50"
              height="50"
              rx="4"
              fill="rgba(255,255,255,0.6)"
            />
          </svg>
        </div>
      </section>

      {/* SERVICES */}
      <RevealSection className="section" id="services" direction="up">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Our Services</div>
            <div className="divider"></div>
            <h2>Services for shippers &amp; fleet owners</h2>
            <p>
              Everything you need to move goods efficiently across Maharashtra
              and beyond.
            </p>
          </div>
          <div className="services-grid">
            {[
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                ),
                title: "Full Truck Load (FTL)",
                desc: "Dedicated truck services for bulk shipments requiring exclusive vehicle use.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
                title: "Part Load Transport",
                desc: "Cost-effective shared truck solutions for smaller shipment quantities.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3m8 0h3a2 2 0 002-2v-3" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                ),
                title: "Refrigerated Cargo",
                desc: "Temperature-controlled transport for perishable goods and cold chain logistics.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                    <line x1="12" y1="22" x2="12" y2="15.5" />
                    <line x1="22" y1="8.5" x2="12" y2="15.5" />
                    <line x1="2" y1="8.5" x2="12" y2="15.5" />
                  </svg>
                ),
                title: "Industrial Goods",
                desc: "Heavy and oversized cargo transport with specialized equipment and support.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
                title: "Real-Time Tracking",
                desc: "Live shipment status updates from pickup to final delivery destination.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
                title: "Fleet Management",
                desc: "Tools for fleet owners to manage trucks, routes, and bookings seamlessly.",
              },
            ].map((s, i) => (
              <RevealDiv
                className="service-card"
                key={i}
                direction="up"
                delay={i * 60}
              >
                <div className="service-icon-svg">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* WHY CHOOSE US */}
      <RevealSection className="section why-section" direction="up">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Why Choose Us</div>
            <div className="divider"></div>
            <h2>Built for reliable logistics</h2>
            <p>
              We bring transparency and efficiency to every shipment, every
              time.
            </p>
          </div>
          <div className="features-grid">
            {[
              {
                title: "Verified Transport Partners",
                desc: "All truck owners and drivers are verified and background-checked for safety.",
              },
              {
                title: "Reliable Delivery",
                desc: "Consistent on-time delivery backed by a network of trusted transporters.",
              },
              {
                title: "Real-time Shipment Tracking",
                desc: "Track your goods from origin to destination with live status updates.",
              },
              {
                title: "Fast Booking Process",
                desc: "Book a truck in minutes with our streamlined digital booking system.",
              },
              {
                title: "Competitive Pricing",
                desc: "Transparent pricing with no hidden charges or surprise fees after booking.",
              },
              {
                title: "24/7 Customer Support",
                desc: "Dedicated support team available around the clock to assist you.",
              },
            ].map((f, i) => (
              <RevealDiv
                className="feature-item"
                key={i}
                direction={i % 2 === 0 ? "left" : "right"}
                delay={i * 50}
              >
                <div className="feature-check">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* OUR SPECIALITY */}
      <RevealSection className="section speciality-section" direction="up">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Our Speciality</div>
            <div className="divider"></div>
            <h2>What sets us apart</h2>
            <p>
              Our strengths in road freight make Sairaj Roadlines a preferred
              logistics partner.
            </p>
          </div>
          <div className="spec-grid">
            {[
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                ),
                title: "Experienced Transport Network",
                desc: "Years of expertise with a vast network across Maharashtra and neighbouring states.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                title: "Trusted by Businesses",
                desc: "Hundreds of businesses rely on us for consistent and professional transport.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
                    <path d="M22.54 1.46a19 19 0 010 21.08M1.46 1.46a19 19 0 000 21.08" />
                  </svg>
                ),
                title: "Efficient Logistics Management",
                desc: "Optimised routes and fleet management for maximum delivery efficiency.",
              },
              {
                icon: (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-600)"
                    strokeWidth="1.8"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: "Secure Goods Transportation",
                desc: "Your cargo is handled with care and insured throughout the journey.",
              },
            ].map((s, i) => (
              <RevealDiv
                className="spec-card"
                key={i}
                direction="up"
                delay={i * 70}
              >
                <span className="spec-icon-svg">{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </RevealDiv>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ABOUT */}
      <RevealSection
        className="section about-section"
        id="about"
        direction="up"
      >
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <div
                className="section-tag"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "var(--blue-300)",
                  borderColor: "rgba(255,255,255,0.15)",
                }}
              >
                About Us
              </div>
              <div
                className="divider"
                style={{ marginLeft: 0, marginTop: 14 }}
              ></div>
              <h2 style={{ marginTop: 4 }}>About Sairaj Transport</h2>
              <p>
                Sairaj Roadlines is a reliable road transport partner focused on
                the safe and timely movement of goods across Maharashtra and
                beyond. With a growing fleet and a commitment to service
                excellence, we ensure every shipment reaches its destination
                securely.
              </p>
              <p style={{ marginTop: 12 }}>
                Our platform empowers shippers with digital booking, real-time
                tracking, and verified transport partners — making logistics
                simpler and more transparent.
              </p>
              <div className="about-contact-card" style={{ marginTop: 28 }}>
                <h4 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--blue-300)"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.88 19.79 19.79 0 01.22 1.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  Contact Owner
                </h4>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span>
                    <strong style={{ color: "white" }}>Bharat Khese</strong> —
                    Transport Owner
                  </span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.88 19.79 19.79 0 01.22 1.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <span>
                    <a href="tel:9284652405">9284652405</a>
                  </span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <span>
                    <a href="mailto:khesebharat@gmail.com">
                      khesebharat@gmail.com
                    </a>
                  </span>
                </div>
                <div className="contact-item">
                  <div className="contact-icon">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <span>
                    Plot No. E-34 Waluj Trade Center, MIDC Waluj Ranjangaon
                    Phata, Chhatrapati Sambhajinagar
                  </span>
                </div>
              </div>
            </div>
            <div className="about-image-side">
              <RevealDiv className="about-stat-card" direction="up" delay={0}>
                <div className="num">10+</div>
                <div className="label">Years in Business</div>
              </RevealDiv>
              <RevealDiv className="about-stat-card" direction="up" delay={80}>
                <div className="num">50+</div>
                <div className="label">Trucks in Network</div>
              </RevealDiv>
              <RevealDiv className="about-stat-card" direction="up" delay={160}>
                <div className="num">100+</div>
                <div className="label">Happy Clients</div>
              </RevealDiv>
              <RevealDiv
                className="about-stat-card"
                direction="up"
                delay={240}
                style={{
                  background: "rgba(33,118,232,0.2)",
                  borderColor: "rgba(33,118,232,0.3)",
                }}
              >
                <div className="num" style={{ color: "white" }}>
                  MH
                </div>
                <div className="label">Maharashtra &amp; Beyond</div>
              </RevealDiv>
            </div>
          </div>
        </div>
      </RevealSection>
    </>
  );
}
