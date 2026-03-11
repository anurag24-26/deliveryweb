import { useEffect, useState } from "react";

const sections = [
  {
    icon: "🏪",
    title: "About Our Platform",
    content: [
      "Barhalganj Food Delivery is an online food listing and discovery platform operating in Barhalganj, Gorakhpur, Uttar Pradesh.",
      "We provide a marketplace where customers can browse restaurant menus and place food orders.",
      "We are strictly a listing and facilitation service — we do not manufacture, prepare, package, or deliver food ourselves.",
      "All restaurants listed on our platform are independent third-party businesses. We merely provide them a digital storefront.",
      "By using our platform, you acknowledge and agree to these Terms of Service in their entirety."
    ]
  },
  {
    icon: "⚠️",
    title: "Limitation of Liability",
    content: [
      "Barhalganj Food Delivery shall not be held liable for the quality, taste, hygiene, quantity, or freshness of food items ordered through our platform.",
      "We are not responsible for delivery delays, incorrect orders, missing items, or any harm caused by food consumption.",
      "The restaurant partner is solely responsible for food preparation, packaging, and dispatch.",
      "We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of our platform.",
      "Our maximum liability in any dispute shall not exceed the amount paid by the user for the specific order in question.",
      "We do not guarantee uninterrupted or error-free service at all times."
    ]
  },
  {
    icon: "👤",
    title: "User Responsibilities",
    content: [
      "You must be at least 18 years old or have parental consent to use this platform.",
      "You are responsible for maintaining the confidentiality of your account login credentials.",
      "You agree not to use the platform for any unlawful, fraudulent, or harmful purposes.",
      "You must provide accurate delivery address and contact information to ensure successful order fulfillment.",
      "You agree not to misuse reviews, ratings, or complaint systems for personal gain or to harm restaurants unfairly.",
      "Any abuse, harassment, or threatening behavior toward restaurant staff or our team is strictly prohibited and may result in account suspension."
    ]
  },
  {
    icon: "🍽️",
    title: "Restaurant Partner Terms",
    content: [
      "Restaurant partners are independent businesses and are solely responsible for the food they prepare and serve.",
      "Partners must comply with all applicable food safety laws, FSSAI regulations, and local health standards.",
      "Barhalganj Food Delivery reserves the right to remove any restaurant that consistently receives poor reviews or violates standards.",
      "Pricing, discounts, and menu accuracy are the sole responsibility of the restaurant partner.",
      "We act only as a technology intermediary and do not guarantee the accuracy of restaurant-provided information."
    ]
  },
  {
    icon: "🔐",
    title: "Account & Access",
    content: [
      "You must register with valid details to place orders on our platform.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
      "You may delete your account at any time by contacting us at barhalganjdelivery@gmail.com.",
      "We may update or discontinue features of the platform at any time without prior notice.",
      "Accounts found using bots, scripts, or automated tools to manipulate the platform will be permanently banned."
    ]
  },
  {
    icon: "💳",
    title: "Payments",
    content: [
      "Payments made on our platform are processed securely through third-party payment gateways.",
      "We do not store your full card or payment details on our servers.",
      "Any payment disputes or failed transactions should be reported within 7 days of the incident.",
      "Prices displayed are inclusive of applicable taxes unless stated otherwise.",
      "We reserve the right to modify pricing or introduce platform fees with prior notice to users."
    ]
  },
  {
    icon: "📝",
    title: "Intellectual Property",
    content: [
      "All content on this platform including logos, text, graphics, and software is owned by or licensed to Barhalganj Food Delivery.",
      "You may not copy, reproduce, or distribute our content without written permission.",
      "Restaurant menus, photos, and descriptions are the intellectual property of the respective restaurant partners.",
      "User-generated content such as reviews may be used by us for promotional or quality improvement purposes."
    ]
  },
  {
    icon: "⚖️",
    title: "Governing Law",
    content: [
      "These Terms are governed by the laws of India, specifically applicable in Gorakhpur, Uttar Pradesh.",
      "Any disputes shall be subject to the exclusive jurisdiction of courts in Gorakhpur, Uttar Pradesh.",
      "We encourage users to resolve issues amicably by contacting our support team before pursuing legal action.",
      "These Terms constitute the entire agreement between you and Barhalganj Food Delivery regarding use of the platform."
    ]
  }
];

export default function TermsOfService() {
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    document.title = "Terms of Service | Barhalganj Food Delivery";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Read the Terms of Service for Barhalganj Food Delivery. Understand your rights, our limitations as a listing platform, and usage rules.");
    setMeta("robots", "index, follow");
  }, []);

  const toggle = idx => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .acc-body { animation: fadeIn 0.2s ease; }
        @media (max-width: 520px) { .page-title { font-size: 22px !important; } }
      `}</style>
      <div style={styles.content}>

        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <img src="/Delivery.png" alt="Logo" style={styles.logoImg}
              onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<span style="font-size:34px">🍱</span>'; }} />
          </div>
          <h1 style={styles.title} className="page-title">Terms of Service</h1>
          <p style={styles.subtitle}>Barhalganj Food Delivery</p>
          <div style={styles.dateBadge}>Last updated: June 2025</div>
        </div>

        <div style={styles.introCard}>
          <p style={styles.introText}>
            Please read these Terms of Service carefully before using the Barhalganj Food Delivery platform.
            By accessing or placing an order, you agree to be bound by these terms.
          </p>
        </div>

        {/* Key Disclaimer */}
        <div style={styles.disclaimerBanner}>
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
          <p style={styles.disclaimerText}>
            <strong>Disclaimer:</strong> We are only a food listing platform. We do not prepare, package, or deliver food.
            All food-related issues are the responsibility of the respective restaurant.
          </p>
        </div>

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

        <h2 style={styles.sectionTitle}>Contact Us</h2>
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>For queries on these Terms</p>
              <a href="mailto:barhalganjdelivery@gmail.com" style={styles.linkValue}>barhalganjdelivery@gmail.com</a>
            </div>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: "none", paddingBottom: 0 }}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Phone</p>
              <a href="tel:+917985555982" style={styles.linkValue}>+91 79855 55982</a>
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
  linkValue: { fontSize: "14px", color: "#2d3748", fontWeight: "500", textDecoration: "none" }
};