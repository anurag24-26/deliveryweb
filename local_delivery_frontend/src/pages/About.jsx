import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "About Us | Barhalganj Food Delivery";

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", "Barhalganj Food Delivery connects you with the best local restaurants in Barhalganj, Gorakhpur, Uttar Pradesh. Fast, fresh, and always on time.");
    setMeta("keywords", "Barhalganj food delivery, Gorakhpur food delivery, local restaurant delivery, online food order Barhalganj");
    setMeta("robots", "index, follow");
    setMeta("og:title", "About Barhalganj Food Delivery", true);
    setMeta("og:description", "Your neighbourhood food delivery service in Barhalganj, Gorakhpur, Uttar Pradesh.", true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", "Barhalganj Food Delivery – About Us");
    setMeta("twitter:description", "Fast, fresh local food delivery in Barhalganj, Gorakhpur.");

    const existing = document.getElementById("about-schema");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "about-schema";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Barhalganj Food Delivery",
      url: window.location.origin,
      description: "Local food delivery platform serving Barhalganj, Gorakhpur, Uttar Pradesh.",
      foundingDate: "2024",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Barhalganj",
        addressRegion: "Gorakhpur, Uttar Pradesh",
        addressCountry: "IN"
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-7985555982",
        contactType: "customer support",
        email: "barhalganjdelivery@gmail.com"
      }
    });
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById("about-schema");
      if (s) s.remove();
    };
  }, []);

  const stats = [
    { value: "500+", label: "Happy Customers", icon: "😊" },
    { value: "50+", label: "Local Restaurants", icon: "🍽️" },
    { value: "30 min", label: "Avg Delivery", icon: "⏱️" },
    { value: "4.8★", label: "App Rating", icon: "⭐" }
  ];

  const values = [
    { icon: "🚀", title: "Fast Delivery", desc: "We prioritize speed so your food arrives hot and fresh at your doorstep in Barhalganj." },
    { icon: "🏘️", title: "Local First", desc: "Supporting local restaurants and dhabas from Barhalganj and nearby Gorakhpur areas." },
    { icon: "✅", title: "Quality Assured", desc: "Every restaurant partner is checked for hygiene, taste, and consistent service." },
    { icon: "💰", title: "Affordable Prices", desc: "No hidden charges. Fair, transparent pricing on every order." }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <img
              src="/Delivery.png"
              alt="Barhalganj Food Delivery Logo"
              style={styles.logoImg}
              onError={e => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = '<span style="font-size:38px">🍱</span>';
              }}
            />
          </div>
          <h1 style={styles.title}>Barhalganj Food Delivery</h1>
          <p style={styles.subtitle}>Your neighbourhood delivery partner in Barhalganj, Gorakhpur, UP</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} style={styles.statCard}>
              <span style={styles.statIcon}>{s.icon}</span>
              <span style={styles.statValue}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <h2 style={styles.sectionTitle}>Our Story</h2>
        <div style={styles.card}>
          <div style={styles.storyRow}>
            <div style={styles.iconWrapper}>
              <span style={{ fontSize: "1.6rem" }}>📖</span>
            </div>
            <div>
              <p style={styles.storyText}>
                Barhalganj Food Delivery was started with a simple dream — to bring the best
                local food from Barhalganj's restaurants and dhabas right to your home.
              </p>
              <p style={{ ...styles.storyText, marginTop: "10px" }}>
                We serve Barhalganj, Gorakhpur and surrounding areas, working closely with
                local restaurant owners to ensure fast and fresh deliveries every single time.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <h2 style={styles.sectionTitle}>Why Choose Us</h2>
        <div style={styles.valuesGrid}>
          {values.map(v => (
            <div key={v.title} style={styles.valueCard}>
              <span style={styles.valueIcon}>{v.icon}</span>
              <div>
                <p style={styles.valueTitle}>{v.title}</p>
                <p style={styles.valueDesc}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Area */}
        <h2 style={styles.sectionTitle}>We Deliver In</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Primary Area</p>
              <p style={styles.value}>Barhalganj, Gorakhpur</p>
              <p style={{ ...styles.label, marginTop: "2px" }}>Uttar Pradesh, India</p>
            </div>
          </div>

          <div style={{ ...styles.infoRow, borderBottom: "none", paddingBottom: 0 }}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Delivery Hours</p>
              <p style={styles.value}>10:00 AM – 10:00 PM</p>
              <p style={{ ...styles.label, marginTop: "2px" }}>All days including holidays</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <a href="/restaurants" style={styles.button}>
          <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Browse Restaurants
        </a>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  content: {
    maxWidth: "480px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
    paddingTop: "12px"
  },
  iconContainer: {
    width: "90px",
    height: "90px",
    margin: "0 auto 16px",
    backgroundColor: "#2d3748",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  logoImg: {
    width: "62px",
    height: "62px",
    objectFit: "contain"
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0,
    lineHeight: "1.5"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "28px"
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "18px 12px",
    textAlign: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  statIcon: { fontSize: "1.5rem" },
  statValue: { fontSize: "20px", fontWeight: "700", color: "#2d3748" },
  statLabel: { fontSize: "12px", color: "#6c757d", fontWeight: "500" },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "12px",
    marginTop: 0
  },
  storyRow: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start"
  },
  storyText: {
    fontSize: "14px",
    color: "#495057",
    lineHeight: "1.7",
    margin: 0
  },
  valuesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px"
  },
  valueCard: {
    backgroundColor: "white",
    borderRadius: "14px",
    padding: "16px 18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    gap: "14px",
    alignItems: "flex-start"
  },
  valueIcon: { fontSize: "1.8rem", flexShrink: 0, marginTop: "2px" },
  valueTitle: { fontSize: "15px", fontWeight: "600", color: "#2d3748", margin: "0 0 4px 0" },
  valueDesc: { fontSize: "13px", color: "#6c757d", margin: 0, lineHeight: "1.5" },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid #f1f3f5"
  },
  iconWrapper: {
    width: "48px",
    height: "48px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  icon: { width: "24px", height: "24px", color: "#6c757d", strokeWidth: 2 },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px 0", fontWeight: "500" },
  value: { fontSize: "16px", color: "#2d3748", margin: 0, fontWeight: "500" },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#2d3748",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    textDecoration: "none",
    marginBottom: "32px",
    boxSizing: "border-box",
    boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)",
    transition: "all 0.2s"
  },
  buttonIcon: { width: "20px", height: "20px", strokeWidth: 2 }
};