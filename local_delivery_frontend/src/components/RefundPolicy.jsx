import { useEffect, useState } from "react";

const eligibleCases = [
  { icon: "💰", title: "Payment Deducted, Order Not Placed", desc: "Your money was charged but no order confirmation was received or processed." },
  { icon: "🔁", title: "Duplicate Payment", desc: "You were charged more than once for the same order due to a technical error." },
  { icon: "🚫", title: "Restaurant Cancelled the Order", desc: "The restaurant cancelled your confirmed order and you have already paid online." },
  { icon: "📦", title: "Wrong Order Delivered", desc: "You received a completely different order than what you placed, as confirmed by the restaurant." },
  { icon: "⏱️", title: "Order Never Arrived", desc: "The order was marked delivered but you never received it, and the restaurant confirms dispatch failure." }
];

const notEligibleCases = [
  { icon: "😐", title: "Change of Mind", desc: "You changed your mind after placing and paying for the order." },
  { icon: "🍛", title: "Taste or Quality Complaints", desc: "We are a listing platform — food quality is the restaurant's responsibility. Refunds are not provided for taste-related issues." },
  { icon: "⏰", title: "Delivery Delay by Restaurant", desc: "Delivery time is managed by the restaurant. Delays alone do not qualify for refund." },
  { icon: "🔤", title: "Wrong Address Entered by User", desc: "If incorrect delivery details were provided by you, leading to a failed delivery." },
  { icon: "📵", title: "Unreachable Customer", desc: "If the delivery could not be completed because you were unreachable at the delivery address." }
];

const processSteps = [
  { step: "1", title: "Contact Us", desc: "Reach out within 24 hours of the order via phone or email with your order details." },
  { step: "2", title: "We Verify", desc: "Our team will review your claim with the restaurant and check order records — typically within 24–48 hours." },
  { step: "3", title: "Decision", desc: "If the refund criteria is met, we approve the refund and notify you." },
  { step: "4", title: "Refund Processed", desc: "Approved refunds are processed back to the original payment method within 5–7 business days." }
];

export default function RefundPolicy() {
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "Refund Policy | Barhalganj Food Delivery";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Barhalganj Food Delivery refund policy. Learn when you are eligible for a refund, how to apply, and what to expect.");
    setMeta("robots", "index, follow");
  }, []);

  const faqs = [
    { q: "How long does a refund take?", a: "Once approved, refunds are credited to your original payment method within 5–7 business days. UPI refunds may be faster (1–3 days)." },
    { q: "Can I get a refund in cash?", a: "No. Refunds are always processed to the original payment method used at the time of the order." },
    { q: "What if the restaurant denies responsibility?", a: "We will review available evidence from both sides and make a fair decision. We always try to find a resolution that's fair to the customer." },
    { q: "Can I cancel my order after placing it?", a: "Cancellations depend on whether the restaurant has already started preparing your order. Contact us immediately after placing the order for cancellation requests." },
    { q: "Is refund guaranteed?", a: "Refunds are only processed if the criteria above are clearly met. We do our best to make it easy for you and will guide you through the process." }
  ];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .acc-body { animation: fadeIn 0.2s ease; }
        @media (max-width: 520px) { .page-title { font-size: 22px !important; } }
      `}</style>
      <div style={styles.content}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <img src="/Delivery.png" alt="Logo" style={styles.logoImg}
              onError={e => { e.target.style.display="none"; e.target.parentElement.innerHTML='<span style="font-size:34px">🍱</span>'; }} />
          </div>
          <h1 style={styles.title} className="page-title">Refund Policy</h1>
          <p style={styles.subtitle}>Barhalganj Food Delivery</p>
          <div style={styles.dateBadge}>Last updated: June 2025</div>
        </div>

        {/* Intro */}
        <div style={styles.introCard}>
          <p style={styles.introText}>
            We understand how frustrating a bad order experience can be. While we are a listing platform
            and not directly responsible for food or delivery, we are here to <strong>help you get a fair resolution</strong>.
            If the refund criteria is met, we will work with you to make it easy.
          </p>
        </div>

        {/* Platform Note */}
        <div style={styles.disclaimerBanner}>
          <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚠️</span>
          <p style={styles.disclaimerText}>
            <strong>Note:</strong> Barhalganj Food Delivery is a listing platform. We facilitate orders but are not the food provider or delivery agent.
            Refunds are subject to verification with the restaurant partner.
          </p>
        </div>

        {/* Eligible Cases */}
        <h2 style={styles.sectionTitle}>✅ When You May Get a Refund</h2>
        <div style={styles.caseGrid}>
          {eligibleCases.map((c, i) => (
            <div key={i} style={{ ...styles.caseCard, ...styles.eligibleCard }}>
              <span style={styles.caseIcon}>{c.icon}</span>
              <div>
                <p style={styles.caseTitle}>{c.title}</p>
                <p style={styles.caseDesc}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Not Eligible */}
        <h2 style={styles.sectionTitle}>❌ When Refund Is Not Applicable</h2>
        <div style={styles.caseGrid}>
          {notEligibleCases.map((c, i) => (
            <div key={i} style={{ ...styles.caseCard, ...styles.notEligibleCard }}>
              <span style={styles.caseIcon}>{c.icon}</span>
              <div>
                <p style={styles.caseTitle}>{c.title}</p>
                <p style={styles.caseDesc}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Process */}
        <h2 style={styles.sectionTitle}>📋 How the Refund Process Works</h2>
        <div style={styles.card}>
          {processSteps.map((s, i) => (
            <div key={i} style={{ ...styles.processRow, ...(i === processSteps.length - 1 ? { borderBottom: "none", paddingBottom: 0 } : {}) }}>
              <div style={styles.stepBubble}>{s.step}</div>
              <div>
                <p style={styles.processTitle}>{s.title}</p>
                <p style={styles.processDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Time Limit */}
        <div style={styles.timeBanner}>
          <span style={{ fontSize: "1.4rem" }}>⏳</span>
          <div>
            <p style={styles.timeTitle}>Report Within 24 Hours</p>
            <p style={styles.timeDesc}>Refund requests must be raised within 24 hours of order placement to be considered eligible.</p>
          </div>
        </div>

        {/* FAQs */}
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div style={styles.accordionWrap}>
          {faqs.map((faq, idx) => (
            <div key={idx} style={{ ...styles.accItem, ...(openFaq === idx ? styles.accItemOpen : {}) }}>
              <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={styles.accHeader}>
                <span style={styles.accTitle}>{faq.q}</span>
                <span style={{ ...styles.accChevron, ...(openFaq === idx ? styles.accChevronOpen : {}) }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openFaq === idx && (
                <p style={styles.accAnswer} className="acc-body">{faq.a}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <h2 style={styles.sectionTitle}>Request a Refund</h2>
        <div style={styles.card}>
          <p style={{ fontSize: "13px", color: "#6c757d", margin: "0 0 16px", lineHeight: "1.6" }}>
            Contact us with your order ID, issue description, and any relevant screenshots. We'll review and get back to you promptly.
          </p>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Call us (fastest response)</p>
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
              <p style={styles.label}>Email us</p>
              <a href="mailto:barhalganjdelivery@gmail.com" style={styles.linkValue}>barhalganjdelivery@gmail.com</a>
            </div>
          </div>
        </div>

        <a href="/contact" style={styles.button}>
          <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Submit Refund Request
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
  subtitle: { fontSize: "14px", color: "#6c757d", margin: "0 0 10px" },
  dateBadge: { display: "inline-block", backgroundColor: "#e9ecef", color: "#6c757d", fontSize: "12px", fontWeight: "500", padding: "4px 12px", borderRadius: "100px" },
  introCard: { backgroundColor: "white", borderRadius: "16px", padding: "18px 20px", marginBottom: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  introText: { fontSize: "14px", color: "#495057", lineHeight: "1.7", margin: 0 },
  disclaimerBanner: { backgroundColor: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "flex-start" },
  disclaimerText: { fontSize: "13px", color: "#795548", lineHeight: "1.6", margin: 0 },
  sectionTitle: { fontSize: "17px", fontWeight: "600", color: "#2d3748", marginBottom: "12px", marginTop: 0 },
  caseGrid: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" },
  caseCard: { borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" },
  eligibleCard: { backgroundColor: "#f0fff4", border: "1px solid #c6f6d5" },
  notEligibleCard: { backgroundColor: "#fff5f5", border: "1px solid #fed7d7" },
  caseIcon: { fontSize: "1.5rem", flexShrink: 0, marginTop: "1px" },
  caseTitle: { fontSize: "14px", fontWeight: "600", color: "#2d3748", margin: "0 0 3px" },
  caseDesc: { fontSize: "13px", color: "#6c757d", margin: 0, lineHeight: "1.5" },
  card: { backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  processRow: { display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #f1f3f5" },
  stepBubble: { width: "32px", height: "32px", backgroundColor: "#2d3748", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: "700", flexShrink: 0 },
  processTitle: { fontSize: "14px", fontWeight: "600", color: "#2d3748", margin: "0 0 3px" },
  processDesc: { fontSize: "13px", color: "#6c757d", margin: 0, lineHeight: "1.5" },
  timeBanner: { backgroundColor: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "flex-start" },
  timeTitle: { fontSize: "14px", fontWeight: "600", color: "#2b6cb0", margin: "0 0 3px" },
  timeDesc: { fontSize: "13px", color: "#4a90c4", margin: 0, lineHeight: "1.5" },
  accordionWrap: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" },
  accItem: { backgroundColor: "white", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden", border: "2px solid transparent" },
  accItemOpen: { border: "2px solid #2d3748" },
  accHeader: { width: "100%", background: "none", border: "none", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left", gap: "10px" },
  accTitle: { fontSize: "14px", fontWeight: "600", color: "#2d3748", flex: 1 },
  accChevron: { color: "#6c757d", transition: "transform 0.2s", flexShrink: 0 },
  accChevronOpen: { transform: "rotate(180deg)", color: "#2d3748" },
  accAnswer: { padding: "0 18px 16px", fontSize: "13px", color: "#495057", lineHeight: "1.6", margin: 0 },
  infoRow: { display: "flex", alignItems: "center", gap: "16px", padding: "14px 0", borderBottom: "1px solid #f1f3f5" },
  iconWrapper: { width: "48px", height: "48px", backgroundColor: "#f8f9fa", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { width: "24px", height: "24px", color: "#6c757d" },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px", fontWeight: "500" },
  linkValue: { fontSize: "14px", color: "#2d3748", fontWeight: "500", textDecoration: "none" },
  button: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "16px", fontSize: "16px", fontWeight: "600", color: "white", backgroundColor: "#2d3748", border: "none", borderRadius: "12px", cursor: "pointer", textDecoration: "none", marginBottom: "32px", boxSizing: "border-box", boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)" },
  buttonIcon: { width: "20px", height: "20px" }
};