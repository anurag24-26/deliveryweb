import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState(null);

  const handleSubscribe = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubStatus("loading");
    await new Promise(r => setTimeout(r, 1000));
    setSubStatus("done");
    setEmail("");
  };

  const links = [
    {
      heading: "Quick Links",
      items: [
        { label: "Restaurants", href: "/restaurants" },
        { label: "My Orders", href: "/orders" },
        { label: "Cart", href: "/cart" },
        { label: "My Profile", href: "/profile" }
      ]
    },
    {
      heading: "Company",
      items: [
        { label: "About Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "List Your Restaurant", href: "/restaurant-management" },
        { label: "Become a Delivery Partner", href: "/delivery-partner" }
      ]
    },
    {
      heading: "Support",
      items: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refunds" },
        { label: "Help Center", href: "/help" }
      ]
    }
  ];

  return (
    <>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .footer-newsletter-btn:hover { background-color: #1a202c !important; }
        .footer-link:hover { color: #2d3748 !important; }
        .footer-social:hover { background-color: #e9ecef !important; }
        .footer-subscribe-input:focus { border-color: #2d3748 !important; background: white !important; outline: none; }
      `}</style>

      <footer style={styles.footer}>
        <div style={styles.content}>

          {/* Brand Block */}
          <div style={styles.brandBlock}>
            <div style={styles.brandRow}>
              <div style={styles.logoWrap}>
                <img
                  src="/Delivery.png"
                  alt="Barhalganj Food Delivery"
                  style={styles.logoImg}
                  onError={e => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = '<span style="font-size:28px">🍱</span>';
                  }}
                />
              </div>
              <div>
                <p style={styles.brandName}>Barhalganj Food Delivery</p>
                <p style={styles.brandTagline}>Barhalganj, Gorakhpur, UP</p>
              </div>
            </div>
            <p style={styles.brandDesc}>
              Fast, fresh, and local food delivery serving Barhalganj and surrounding areas.
              Supporting local restaurants and bringing great food to your doorstep.
            </p>

            {/* Social */}
            <div style={styles.socialRow}>
              <a
                href="tel:+917985555982"
                style={styles.socialBtn}
                className="footer-social"
                aria-label="Call us"
                title="Call +91 79855 55982"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
              <a
                href="mailto:barhalganjdelivery@gmail.com"
                style={styles.socialBtn}
                className="footer-social"
                aria-label="Email us"
                title="Email barhalganjdelivery@gmail.com"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              <a
                href="https://wa.me/917985555982"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialBtn}
                className="footer-social"
                aria-label="WhatsApp us"
                title="WhatsApp us"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#2d3748">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Links Grid */}
          <div style={styles.linksGrid}>
            {links.map(col => (
              <div key={col.heading}>
                <p style={styles.colHeading}>{col.heading}</p>
                <ul style={styles.colList}>
                  {col.items.map(item => (
                    <li key={item.label} style={{ marginBottom: "10px" }}>
                      <a href={item.href} style={styles.colLink} className="footer-link">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

          {/* Newsletter */}
          <div style={styles.newsletterBlock}>
            <p style={styles.newsletterTitle}>🍔 Get Deals & Updates</p>
            <p style={styles.newsletterSub}>Enter your email to get exclusive discounts and new restaurant alerts.</p>
            {subStatus === "done" ? (
              <p style={styles.successText}>✅ Subscribed! Keep an eye on your inbox.</p>
            ) : (
              <div style={styles.newsletterRow}>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.newsletterInput}
                  className="footer-subscribe-input"
                  onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={subStatus === "loading"}
                  style={{
                    ...styles.newsletterBtn,
                    ...(subStatus === "loading" ? { opacity: 0.6 } : {})
                  }}
                  className="footer-newsletter-btn"
                >
                  {subStatus === "loading" ? "..." : "Subscribe"}
                </button>
              </div>
            )}
          </div>

          <div style={styles.divider} />

          {/* Contact Info Row */}
          <div style={styles.contactRow}>
            <div style={styles.contactItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href="tel:+917985555982" style={styles.contactLink}>+91 79855 55982</a>
            </div>
            <div style={styles.contactItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:barhalganjdelivery@gmail.com" style={styles.contactLink}>barhalganjdelivery@gmail.com</a>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Bottom Bar */}
          <div style={styles.bottomBar}>
            <p style={styles.copyright}>
              © {new Date().getFullYear()} Barhalganj Food Delivery. All rights reserved.
            </p>
            <p style={styles.madeWith}>Made with ❤️ in Barhalganj, Gorakhpur</p>
          </div>

        </div>
      </footer>
    </>
  );
}

const styles = {
  footer: {
    backgroundColor: "white",
    borderTop: "1px solid #e9ecef",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    marginTop: "40px"
  },
  content: { maxWidth: "480px", margin: "0 auto", padding: "28px 20px 20px" },

  // Brand
  brandBlock: { marginBottom: "4px" },
  brandRow: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" },
  logoWrap: {
    width: "52px", height: "52px", backgroundColor: "#2d3748",
    borderRadius: "14px", display: "flex", alignItems: "center",
    justifyContent: "center", overflow: "hidden", flexShrink: 0
  },
  logoImg: { width: "36px", height: "36px", objectFit: "contain" },
  brandName: { fontSize: "15px", fontWeight: "700", color: "#2d3748", margin: "0 0 2px 0" },
  brandTagline: { fontSize: "12px", color: "#6c757d", margin: 0 },
  brandDesc: { fontSize: "13px", color: "#6c757d", lineHeight: "1.6", margin: "0 0 16px 0" },
  socialRow: { display: "flex", gap: "10px" },
  socialBtn: {
    width: "38px", height: "38px", backgroundColor: "#f8f9fa",
    borderRadius: "10px", border: "1px solid #e9ecef",
    display: "flex", alignItems: "center", justifyContent: "center",
    textDecoration: "none", transition: "background 0.2s"
  },

  // Divider
  divider: { height: "1px", backgroundColor: "#f1f3f5", margin: "20px 0" },

  // Links
  linksGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
  colHeading: { fontSize: "12px", fontWeight: "700", color: "#2d3748", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.05em" },
  colList: { listStyle: "none", padding: 0, margin: 0 },
  colLink: { fontSize: "13px", color: "#6c757d", textDecoration: "none", transition: "color 0.15s" },

  // Newsletter
  newsletterBlock: { backgroundColor: "#f8f9fa", borderRadius: "14px", padding: "18px" },
  newsletterTitle: { fontSize: "15px", fontWeight: "600", color: "#2d3748", margin: "0 0 4px 0" },
  newsletterSub: { fontSize: "13px", color: "#6c757d", margin: "0 0 14px 0", lineHeight: "1.5" },
  newsletterRow: { display: "flex", gap: "8px" },
  newsletterInput: {
    flex: 1, padding: "11px 14px", fontSize: "13px",
    border: "2px solid #e9ecef", borderRadius: "10px", outline: "none",
    backgroundColor: "white", color: "#2d3748", transition: "all 0.2s",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  newsletterBtn: {
    padding: "11px 18px", backgroundColor: "#2d3748", color: "white",
    border: "none", borderRadius: "10px", fontWeight: "600",
    fontSize: "13px", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap"
  },
  successText: { fontSize: "13px", color: "#28a745", fontWeight: "500", margin: 0 },

  // Contact Row
  contactRow: { display: "flex", flexDirection: "column", gap: "8px" },
  contactItem: { display: "flex", alignItems: "center", gap: "8px" },
  contactLink: { fontSize: "13px", color: "#6c757d", textDecoration: "none" },

  // Bottom
  bottomBar: { textAlign: "center" },
  copyright: { fontSize: "12px", color: "#adb5bd", margin: "0 0 4px 0" },
  madeWith: { fontSize: "12px", color: "#adb5bd", margin: 0 }
};