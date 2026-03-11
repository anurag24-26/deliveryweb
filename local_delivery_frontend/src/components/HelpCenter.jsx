import { useEffect, useState } from "react";

const categories = [
  {
    icon: "🛒",
    title: "Orders",
    faqs: [
      { q: "How do I place an order?", a: "Browse restaurants, select items you want, add them to your cart, fill in your delivery details, and confirm the order. You'll receive a confirmation once it's placed." },
      { q: "Can I modify my order after placing it?", a: "Orders cannot be modified once confirmed. If you need changes, contact us immediately at +91 79855 55982 and we'll try to help before the restaurant starts preparation." },
      { q: "How do I cancel an order?", a: "Contact us immediately after placing your order. Cancellation is only possible if the restaurant has not yet started preparing your food. Call us at +91 79855 55982." },
      { q: "My order is taking too long. What should I do?", a: "Delivery times depend on the restaurant. If your order is significantly delayed, please contact the restaurant directly or reach us at barhalganjdelivery@gmail.com." }
    ]
  },
  {
    icon: "💳",
    title: "Payments",
    faqs: [
      { q: "What payment methods are accepted?", a: "We accept UPI, debit/credit cards, net banking, and popular wallets. Cash on delivery may be available for select restaurants." },
      { q: "My payment failed but money was deducted. What now?", a: "Failed payment deductions typically reverse automatically within 3–5 business days. If not, contact us with your order details and we'll investigate." },
      { q: "Is it safe to pay on this platform?", a: "Yes. All payments are processed through secure, encrypted third-party payment gateways. We do not store your card details." },
      { q: "Can I pay after delivery (COD)?", a: "Cash on Delivery availability depends on the restaurant. Look for the COD option on the checkout page." }
    ]
  },
  {
    icon: "🔄",
    title: "Refunds",
    faqs: [
      { q: "How do I request a refund?", a: "Contact us within 24 hours of your order via call or email with your order ID and issue. We'll review and respond within 24–48 hours." },
      { q: "When will my refund be credited?", a: "Approved refunds are processed within 5–7 business days to your original payment method. UPI refunds may be faster (1–3 days)." },
      { q: "Can I get a refund for bad food quality?", a: "As a listing platform, we are not responsible for food quality. However, contact us and we'll try to mediate with the restaurant on your behalf." },
      { q: "I received the wrong order. What do I do?", a: "Contact us immediately with photos of what you received. If verified, you may be eligible for a refund or replacement depending on the restaurant's response." }
    ]
  },
  {
    icon: "👤",
    title: "Account",
    faqs: [
      { q: "How do I create an account?", a: "Click 'Sign Up' on the homepage, fill in your name, email, and phone number, then verify your email to get started." },
      { q: "I forgot my password. How do I reset it?", a: "Click 'Forgot Password' on the login page and follow the instructions sent to your registered email." },
      { q: "How do I update my delivery address?", a: "Go to your Profile page and update your address details under the 'Delivery Details' section, then save." },
      { q: "How do I delete my account?", a: "Send us an email at barhalganjdelivery@gmail.com requesting account deletion. We'll process it within 7 business days." }
    ]
  },
  {
    icon: "🍽️",
    title: "Restaurants",
    faqs: [
      { q: "How do I list my restaurant on Barhalganj Food Delivery?", a: "Visit the 'List Your Restaurant' page or contact us at barhalganjdelivery@gmail.com with your restaurant details. We'll guide you through the onboarding process." },
      { q: "Is Barhalganj Food Delivery responsible for food quality?", a: "No. We are strictly a food listing platform. Each restaurant is independently responsible for the quality, hygiene, and accuracy of their food." },
      { q: "A restaurant on your platform gave me bad food. What can you do?", a: "We take feedback seriously. Report the issue to us and we'll investigate. Repeated complaints can lead to restaurant removal from our platform." },
      { q: "Can I leave a review for a restaurant?", a: "Yes! After receiving your order, you'll be prompted to rate and review the restaurant. Honest reviews help the community." }
    ]
  }
];

const quickLinks = [
  { icon: "📞", label: "Call Us", sub: "+91 79855 55982", href: "tel:+917985555982" },
  { icon: "✉️", label: "Email Us", sub: "barhalganjdelivery@gmail.com", href: "mailto:barhalganjdelivery@gmail.com" },
  { icon: "💬", label: "WhatsApp", sub: "Chat with us", href: "https://wa.me/917985555982" },
  { icon: "🔄", label: "Refund Policy", sub: "View policy", href: "/refunds" }
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState(null); // "catIdx-faqIdx"
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    document.title = "Help Center | Barhalganj Food Delivery";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Get help with orders, payments, refunds, and account issues on Barhalganj Food Delivery. Find answers to frequently asked questions.");
    setMeta("robots", "index, follow");
  }, []);

  const toggle = key => setOpenKey(openKey === key ? null : key);

  const searchLower = search.toLowerCase().trim();
  const filteredCategories = searchLower
    ? categories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(f => f.q.toLowerCase().includes(searchLower) || f.a.toLowerCase().includes(searchLower))
      })).filter(cat => cat.faqs.length > 0)
    : activeCategory !== null
      ? [categories[activeCategory]]
      : categories;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .acc-body { animation: fadeIn 0.2s ease; }
        @media (max-width: 520px) { .page-title { font-size: 22px !important; } }
        .help-cat-btn:hover { background-color: #2d3748 !important; color: white !important; }
        .quick-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important; transform: translateY(-2px); }
        input:focus { border-color: #2d3748 !important; background: white !important; outline: none; }
      `}</style>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <img src="/Delivery.png" alt="Logo" style={styles.logoImg}
              onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<span style="font-size:34px">🍱</span>'; }} />
          </div>
          <h1 style={styles.title} className="page-title">Help Center</h1>
          <p style={styles.subtitle}>How can we help you today?</p>
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search your question..."
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch("")} style={styles.clearBtn}>✕</button>
          )}
        </div>

        {/* Quick Contact */}
        <h2 style={styles.sectionTitle}>Quick Support</h2>
        <div style={styles.quickGrid}>
          {quickLinks.map((q, i) => (
            <a key={i} href={q.href} style={styles.quickCard} className="quick-card"
              target={q.href.startsWith("http") ? "_blank" : undefined}
              rel={q.href.startsWith("http") ? "noopener noreferrer" : undefined}>
              <span style={styles.quickIcon}>{q.icon}</span>
              <p style={styles.quickLabel}>{q.label}</p>
              <p style={styles.quickSub}>{q.sub}</p>
            </a>
          ))}
        </div>

        {/* Category Filter */}
        {!search && (
          <>
            <h2 style={styles.sectionTitle}>Browse by Topic</h2>
            <div style={styles.catRow}>
              <button
                onClick={() => setActiveCategory(null)}
                style={{ ...styles.catBtn, ...(activeCategory === null ? styles.catBtnActive : {}) }}
                className="help-cat-btn"
              >
                All
              </button>
              {categories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(activeCategory === i ? null : i)}
                  style={{ ...styles.catBtn, ...(activeCategory === i ? styles.catBtnActive : {}) }}
                  className="help-cat-btn"
                >
                  {cat.icon} {cat.title}
                </button>
              ))}
            </div>
          </>
        )}

        {/* FAQs */}
        {search && filteredCategories.length === 0 ? (
          <div style={styles.noResults}>
            <span style={{ fontSize: "2.5rem" }}>🔍</span>
            <p style={styles.noResultsText}>No results found for "<strong>{search}</strong>"</p>
            <p style={styles.noResultsSub}>Try different keywords or contact us directly.</p>
          </div>
        ) : (
          filteredCategories.map((cat, catIdx) => (
            <div key={catIdx}>
              <h2 style={styles.catTitle}>{cat.icon} {cat.title}</h2>
              <div style={styles.accordionWrap}>
                {cat.faqs.map((faq, faqIdx) => {
                  const key = `${catIdx}-${faqIdx}`;
                  return (
                    <div key={faqIdx} style={{ ...styles.accItem, ...(openKey === key ? styles.accItemOpen : {}) }}>
                      <button onClick={() => toggle(key)} style={styles.accHeader}>
                        <span style={styles.accTitle}>{faq.q}</span>
                        <span style={{ ...styles.accChevron, ...(openKey === key ? styles.accChevronOpen : {}) }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      {openKey === key && (
                        <p style={styles.accAnswer} className="acc-body">{faq.a}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Still Need Help */}
        <h2 style={styles.sectionTitle}>Still Need Help?</h2>
        <div style={styles.card}>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 16px", lineHeight: "1.6" }}>
            Our support team is available daily from 10:00 AM to 10:00 PM. Don't hesitate to reach out.
          </p>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Call / WhatsApp</p>
              <a href="tel:+917985555982" style={styles.linkValue}>+91 79855 55982</a>
            </div>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: "none", paddingBottom: 0 }}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Email</p>
              <a href="mailto:barhalganjdelivery@gmail.com" style={styles.linkValue}>barhalganjdelivery@gmail.com</a>
            </div>
          </div>
        </div>

        <a href="/contact" style={styles.button}>
          <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Contact Support
        </a>

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
  subtitle: { fontSize: "14px", color: "#6c757d", margin: 0 },
  searchWrap: { position: "relative", marginBottom: "24px" },
  searchIcon: { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "20px", height: "20px", color: "#6c757d" },
  searchInput: { width: "100%", padding: "14px 42px 14px 44px", fontSize: "15px", border: "2px solid #e9ecef", borderRadius: "14px", backgroundColor: "white", color: "#2d3748", boxSizing: "border-box", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  clearBtn: { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#adb5bd", fontSize: "14px", padding: "4px" },
  sectionTitle: { fontSize: "17px", fontWeight: "600", color: "#2d3748", marginBottom: "12px", marginTop: 0 },
  quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" },
  quickCard: { backgroundColor: "white", borderRadius: "14px", padding: "16px 14px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", textDecoration: "none", display: "block", transition: "all 0.2s" },
  quickIcon: { fontSize: "1.8rem", display: "block", marginBottom: "6px" },
  quickLabel: { fontSize: "13px", fontWeight: "600", color: "#2d3748", margin: "0 0 3px" },
  quickSub: { fontSize: "11px", color: "#6c757d", margin: 0, wordBreak: "break-all" },
  catRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" },
  catBtn: { padding: "8px 14px", borderRadius: "100px", border: "2px solid #e9ecef", backgroundColor: "white", color: "#6c757d", fontSize: "13px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  catBtnActive: { backgroundColor: "#2d3748", color: "white", borderColor: "#2d3748" },
  catTitle: { fontSize: "16px", fontWeight: "600", color: "#2d3748", margin: "0 0 10px" },
  accordionWrap: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  accItem: { backgroundColor: "white", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", border: "2px solid transparent" },
  accItemOpen: { border: "2px solid #2d3748" },
  accHeader: { width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", gap: "10px" },
  accTitle: { fontSize: "14px", fontWeight: "600", color: "#2d3748", flex: 1, lineHeight: "1.4" },
  accChevron: { color: "#6c757d", transition: "transform 0.2s", flexShrink: 0 },
  accChevronOpen: { transform: "rotate(180deg)", color: "#2d3748" },
  accAnswer: { padding: "0 16px 14px", fontSize: "13px", color: "#495057", lineHeight: "1.6", margin: 0 },
  noResults: { textAlign: "center", padding: "40px 20px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" },
  noResultsText: { fontSize: "15px", color: "#2d3748", margin: "12px 0 6px" },
  noResultsSub: { fontSize: "13px", color: "#6c757d", margin: 0 },
  card: { backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  infoRow: { display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid #f1f3f5" },
  iconWrapper: { width: "48px", height: "48px", backgroundColor: "#f8f9fa", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { width: "24px", height: "24px", color: "#6c757d" },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px", fontWeight: "500" },
  linkValue: { fontSize: "14px", color: "#2d3748", fontWeight: "500", textDecoration: "none" },
  button: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "16px", fontSize: "16px", fontWeight: "600", color: "white", backgroundColor: "#2d3748", border: "none", borderRadius: "12px", cursor: "pointer", textDecoration: "none", marginBottom: "32px", boxSizing: "border-box", boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)" },
  buttonIcon: { width: "20px", height: "20px" }
};