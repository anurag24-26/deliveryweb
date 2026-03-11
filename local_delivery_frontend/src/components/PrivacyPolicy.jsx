import { useEffect, useState } from "react";

const sections = [
  {
    icon: "📋",
    title: "Information We Collect",
    content: [
      "Personal details such as your name, email address, phone number, and delivery address when you register or place an order.",
      "Location data to help show nearby restaurants and calculate delivery distances.",
      "Device information including IP address, browser type, and operating system for security and analytics.",
      "Order history and preferences to personalize your experience on the platform.",
      "Payment-related information — note that we do not store full card details; payments are processed by third-party gateways."
    ]
  },
  {
    icon: "🔒",
    title: "How We Use Your Information",
    content: [
      "To display your profile, manage your account, and process orders placed through our platform.",
      "To communicate order updates, promotional offers, and service-related notifications.",
      "To improve our platform performance, fix bugs, and enhance user experience.",
      "To comply with legal obligations and prevent fraudulent or unauthorized activity.",
      "We do not sell, rent, or trade your personal information to third parties for their marketing purposes."
    ]
  },
  {
    icon: "🍽️",
    title: "Our Role as a Listing Platform",
    content: [
      "Barhalganj Food Delivery is a food listing and discovery platform. We list restaurants and their menus to help customers find and order food.",
      "We are not the actual food provider or delivery agent. Restaurants listed on our platform are independent businesses.",
      "We are not responsible for the quality, quantity, taste, hygiene, or packaging of food items prepared and delivered by restaurant partners.",
      "Any disputes related to food quality, delivery delays, or incorrect orders should be raised with the respective restaurant directly.",
      "We act as a facilitator and will assist in communication between customers and restaurants wherever possible."
    ]
  },
  {
    icon: "🤝",
    title: "Sharing of Information",
    content: [
      "We share your name, phone number, and address with the restaurant you order from so they can prepare and dispatch your order.",
      "We may share data with analytics providers (e.g., Google Analytics) to understand usage patterns — this data is anonymized.",
      "We may disclose information to law enforcement or government bodies if required by law.",
      "We do not share your data with advertisers or unrelated third parties."
    ]
  },
  {
    icon: "🍪",
    title: "Cookies",
    content: [
      "We use cookies and similar tracking technologies to keep you logged in and remember your preferences.",
      "Cookies also help us analyze website traffic and improve our services.",
      "You can disable cookies through your browser settings, though some features of the platform may not function correctly.",
      "We use only necessary and analytical cookies — no advertising or tracking cookies."
    ]
  },
  {
    icon: "🛡️",
    title: "Data Security",
    content: [
      "We use industry-standard encryption (SSL/TLS) to protect data transmitted between your device and our servers.",
      "Access to personal data is restricted to authorized personnel only.",
      "Despite our security measures, no internet transmission is 100% secure. We encourage you to use strong passwords.",
      "In the event of a data breach, we will notify affected users as required by applicable law."
    ]
  },
  {
    icon: "👤",
    title: "Your Rights",
    content: [
      "You may request access to the personal data we hold about you at any time.",
      "You may request correction of inaccurate data or deletion of your account.",
      "You can opt out of promotional emails by clicking 'Unsubscribe' in any email we send.",
      "To exercise any of these rights, email us at barhalganjdelivery@gmail.com."
    ]
  },
  {
    icon: "📅",
    title: "Policy Updates",
    content: [
      "We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised date.",
      "Continued use of the platform after changes constitutes your acceptance of the updated policy.",
      "For significant changes, we will notify you via email or an in-app notification."
    ]
  }
];

export default function PrivacyPolicy() {
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    document.title = "Privacy Policy | Barhalganj Food Delivery";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Read the Privacy Policy of Barhalganj Food Delivery. Learn how we collect, use, and protect your personal information.");
    setMeta("robots", "index, follow");
    setMeta("og:title", "Privacy Policy – Barhalganj Food Delivery", true);
  }, []);

  const toggle = idx => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .acc-body { animation: fadeIn 0.2s ease; }
        @media (max-width: 520px) {
          .policy-header-title { font-size: 22px !important; }
        }
      `}</style>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <img src="/Delivery.png" alt="Logo" style={styles.logoImg}
              onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<span style="font-size:34px">🍱</span>'; }} />
          </div>
          <h1 style={styles.title} className="policy-header-title">Privacy Policy</h1>
          <p style={styles.subtitle}>Barhalganj Food Delivery</p>
          <div style={styles.dateBadge}>Last updated: June 2025</div>
        </div>

        {/* Intro Card */}
        <div style={styles.introCard}>
          <p style={styles.introText}>
            At <strong>Barhalganj Food Delivery</strong>, we respect your privacy and are committed to protecting
            your personal data. This policy explains what information we collect, how we use it, and your rights.
            Please read it carefully before using our platform.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div style={styles.disclaimerBanner}>
          <span style={styles.disclaimerIcon}>⚠️</span>
          <p style={styles.disclaimerText}>
            <strong>Important:</strong> We are a food listing platform — not a food producer or delivery agent.
            We are not responsible for food quality, delivery, or restaurant conduct.
          </p>
        </div>

        {/* Accordion Sections */}
        <div style={styles.accordionWrap}>
          {sections.map((sec, idx) => (
            <div key={idx} style={{ ...styles.accItem, ...(openIdx === idx ? styles.accItemOpen : {}) }}>
              <button onClick={() => toggle(idx)} style={styles.accHeader}>
                <div style={styles.accLeft}>
                  <span style={styles.accIcon}>{sec.icon}</span>
                  <span style={styles.accTitle}>{sec.title}</span>
                </div>
                <span style={{ ...styles.accChevron, ...(openIdx === idx ? styles.accChevronOpen : {}) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openIdx === idx && (
                <ul style={styles.accBody} className="acc-body">
                  {sec.content.map((point, i) => (
                    <li key={i} style={styles.accPoint}>
                      <span style={styles.bullet}>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <h2 style={styles.sectionTitle}>Questions?</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Email Us</p>
              <a href="mailto:barhalganjdelivery@gmail.com" style={styles.value}>barhalganjdelivery@gmail.com</a>
            </div>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: "none", paddingBottom: 0 }}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Call Us</p>
              <a href="tel:+917985555982" style={styles.value}>+91 79855 55982</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  content: { maxWidth: "480px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "20px", paddingTop: "12px" },
  iconContainer: { width: "80px", height: "80px", margin: "0 auto 14px", backgroundColor: "#2d3748", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoImg: { width: "54px", height: "54px", objectFit: "contain" },
  title: { fontSize: "26px", fontWeight: "700", color: "#2d3748", margin: "0 0 6px" },
  subtitle: { fontSize: "14px", color: "#6c757d", margin: "0 0 10px" },
  dateBadge: { display: "inline-block", backgroundColor: "#e9ecef", color: "#6c757d", fontSize: "12px", fontWeight: "500", padding: "4px 12px", borderRadius: "100px" },
  introCard: { backgroundColor: "white", borderRadius: "16px", padding: "18px 20px", marginBottom: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  introText: { fontSize: "14px", color: "#495057", lineHeight: "1.7", margin: 0 },
  disclaimerBanner: { backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-start" },
  disclaimerIcon: { fontSize: "1.2rem", flexShrink: 0, marginTop: "1px" },
  disclaimerText: { fontSize: "13px", color: "#795548", lineHeight: "1.6", margin: 0 },
  accordionWrap: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" },
  accItem: { backgroundColor: "white", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", border: "2px solid transparent" },
  accItemOpen: { border: "2px solid #2d3748" },
  accHeader: { width: "100%", background: "none", border: "none", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" },
  accLeft: { display: "flex", alignItems: "center", gap: "12px" },
  accIcon: { fontSize: "1.3rem", flexShrink: 0 },
  accTitle: { fontSize: "15px", fontWeight: "600", color: "#2d3748" },
  accChevron: { color: "#6c757d", transition: "transform 0.2s", flexShrink: 0 },
  accChevronOpen: { transform: "rotate(180deg)", color: "#2d3748" },
  accBody: { padding: "0 18px 16px", margin: 0, listStyle: "none" },
  accPoint: { display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "10px", fontSize: "13px", color: "#495057", lineHeight: "1.6" },
  bullet: { color: "#2d3748", fontWeight: "700", flexShrink: 0, marginTop: "1px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#2d3748", marginBottom: "12px", marginTop: 0 },
  card: { backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  infoRow: { display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid #f1f3f5" },
  iconWrapper: { width: "48px", height: "48px", backgroundColor: "#f8f9fa", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { width: "24px", height: "24px", color: "#6c757d" },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px", fontWeight: "500" },
  value: { fontSize: "14px", color: "#2d3748", margin: 0, fontWeight: "500", textDecoration: "none" }
};