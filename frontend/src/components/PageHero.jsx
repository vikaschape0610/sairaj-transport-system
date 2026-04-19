export default function PageHero({ title, subtitle, icon }) {
  return (
    <section className="page-hero">
      <div className="hero-grid"></div>
      <div className="container">
        <div className="page-hero-content">
          <div className="hero-tag">🚚 Maharashtra's Trusted Transport Network</div>
          <p className="hero-welcome">Welcome to Sairaj Transport – Reliable Truck Transport Services</p>
          <h1>{title}</h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        </div>
      </div>
    </section>
  )
}
