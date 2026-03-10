import { useEffect, useState } from "react";
import axios from "axios";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = "Contact Us | Barhalganj Food Delivery";

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

    setMeta("description", "Contact Barhalganj Food Delivery for order support, restaurant partnerships, or any help. Call us at 7985555982 or email barhalganjdelivery@gmail.com.");
    setMeta("keywords", "contact Barhalganj food delivery, food delivery support Gorakhpur, order help, restaurant partnership UP");
    setMeta("robots", "index, follow");
    setMeta("og:title", "Contact Barhalganj Food Delivery", true);
    setMeta("og:description", "Get in touch with us for orders, support, or restaurant partnerships in Barhalganj, Gorakhpur.", true);
    setMeta("og:type", "website", true);

    const existing = document.getElementById("contact-schema");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "contact-schema";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Barhalganj Food Delivery",
      url: window.location.href,
      mainEntity: {
        "@type": "Organization",
        name: "Barhalganj Food Delivery",
        telephone: "+91-7985555982",
        email: "barhalganjdelivery@gmail.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Barhalganj",
          addressRegion: "Gorakhpur, Uttar Pradesh",
          addressCountry: "IN"
        }
      }
    });
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById("contact-schema");
      if (s) s.remove();
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!form.subject) newErrors.subject = "Please select a topic";
    if (!form.message.trim()) newErrors.message = "Message cannot be empty";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setStatus("sending");
    try {
      // Replace with your actual contact API endpoint if available
      await new Promise(r => setTimeout(r, 1200));
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const channels = [
    {
      icon: (
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: "Phone",
      value: "+91 79855 55982",
      sub: "Mon–Sun, 10am–10pm"
    },
    {
      icon: (
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Email",
      value: "barhalganjdelivery@gmail.com",
      sub: "We reply within a few hours"
    },
    {
      icon: (
        <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: "Location",
      value: "Barhalganj, Gorakhpur",
      sub: "Uttar Pradesh, India"
    }
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
          <h1 style={styles.title}>Contact Us</h1>
          <p style={styles.subtitle}>We're here to help with orders, issues, or partnerships</p>
        </div>

        {/* Contact Channels */}
        <h2 style={styles.sectionTitle}>Reach Us Directly</h2>
        <div style={styles.card}>
          {channels.map((c, i) => (
            <div
              key={c.title}
              style={{
                ...styles.infoRow,
                ...(i === channels.length - 1 ? { borderBottom: "none", paddingBottom: 0 } : {})
              }}
            >
              <div style={styles.iconWrapper}>{c.icon}</div>
              <div>
                <p style={styles.label}>{c.title}</p>
                <p style={styles.value}>{c.value}</p>
                <p style={{ ...styles.label, marginTop: "2px" }}>{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div style={styles.quickRow}>
          <a href="tel:+917985555982" style={styles.quickBtn}>
            <svg style={styles.quickIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Now
          </a>
          <a href="mailto:barhalganjdelivery@gmail.com" style={{ ...styles.quickBtn, ...styles.quickBtnOutline }}>
            <svg style={{ ...styles.quickIcon, color: "#2d3748" }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span style={{ color: "#2d3748" }}>Email Us</span>
          </a>
        </div>

        {/* Message Form */}
        <h2 style={styles.sectionTitle}>Send a Message</h2>

        {status === "sent" ? (
          <div style={styles.successCard}>
            <span style={{ fontSize: "2rem" }}>✅</span>
            <div>
              <p style={styles.successTitle}>Message Sent!</p>
              <p style={styles.successSub}>We'll get back to you as soon as possible.</p>
            </div>
          </div>
        ) : (
          <div style={styles.form}>

            {/* Name */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Ramesh Kumar"
                value={form.name}
                onChange={e => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
              />
              {errors.name && <span style={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Email */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g., ramesh@email.com"
                value={form.email}
                onChange={e => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
              />
              {errors.email && <span style={styles.errorText}>{errors.email}</span>}
            </div>

            {/* Subject */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Topic *
              </label>
              <select
                value={form.subject}
                onChange={e => {
                  setForm({ ...form, subject: e.target.value });
                  if (errors.subject) setErrors({ ...errors, subject: "" });
                }}
                style={{ ...styles.input, ...(errors.subject ? styles.inputError : {}) }}
              >
                <option value="">Select a topic</option>
                <option value="order">Order Issue</option>
                <option value="restaurant">Restaurant Partnership</option>
                <option value="delivery">Delivery Problem</option>
                <option value="refund">Refund Request</option>
                <option value="other">Other</option>
              </select>
              {errors.subject && <span style={styles.errorText}>{errors.subject}</span>}
            </div>

            {/* Message */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Message *
              </label>
              <textarea
                rows={5}
                placeholder="Tell us how we can help you..."
                value={form.message}
                onChange={e => {
                  setForm({ ...form, message: e.target.value });
                  if (errors.message) setErrors({ ...errors, message: "" });
                }}
                style={{
                  ...styles.input,
                  resize: "none",
                  ...(errors.message ? styles.inputError : {})
                }}
              />
              {errors.message && <span style={styles.errorText}>{errors.message}</span>}
            </div>

            {status === "error" && (
              <div style={styles.errorBanner}>
                ⚠️ Failed to send message. Please try calling or emailing us directly.
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              style={{
                ...styles.button,
                ...(status === "sending" ? styles.buttonDisabled : {})
              }}
            >
              {status === "sending" ? (
                <>
                  <div style={styles.buttonSpinner}></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Message
                </>
              )}
            </button>

          </div>
        )}

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
  content: { maxWidth: "480px", margin: "0 auto" },
  header: { textAlign: "center", marginBottom: "28px", paddingTop: "12px" },
  iconContainer: {
    width: "90px", height: "90px", margin: "0 auto 16px",
    backgroundColor: "#2d3748", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
  },
  logoImg: { width: "62px", height: "62px", objectFit: "contain" },
  title: { fontSize: "26px", fontWeight: "700", color: "#2d3748", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6c757d", margin: 0, lineHeight: "1.5" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#2d3748", marginBottom: "12px", marginTop: 0 },
  card: {
    backgroundColor: "white", borderRadius: "16px", padding: "20px",
    marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  infoRow: {
    display: "flex", alignItems: "center", gap: "16px",
    padding: "14px 0", borderBottom: "1px solid #f1f3f5"
  },
  iconWrapper: {
    width: "48px", height: "48px", backgroundColor: "#f8f9fa",
    borderRadius: "12px", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0
  },
  icon: { width: "24px", height: "24px", color: "#6c757d", strokeWidth: 2 },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px 0", fontWeight: "500" },
  value: { fontSize: "15px", color: "#2d3748", margin: 0, fontWeight: "500" },
  quickRow: { display: "flex", gap: "12px", marginBottom: "28px" },
  quickBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", padding: "14px", backgroundColor: "#2d3748", color: "white",
    borderRadius: "12px", fontWeight: "600", fontSize: "14px", textDecoration: "none",
    boxShadow: "0 4px 6px rgba(45,55,72,0.2)"
  },
  quickBtnOutline: {
    backgroundColor: "white", border: "2px solid #e9ecef",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  quickIcon: { width: "18px", height: "18px", color: "white", strokeWidth: 2, flexShrink: 0 },
  form: {
    backgroundColor: "white", borderRadius: "16px",
    padding: "24px", marginBottom: "32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  inputGroup: { marginBottom: "20px" },
  inputLabel: {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "14px", fontWeight: "600", color: "#2d3748", marginBottom: "8px"
  },
  inputIcon: { width: "18px", height: "18px", color: "#6c757d", strokeWidth: 2 },
  input: {
    width: "100%", padding: "14px 16px", fontSize: "15px",
    border: "2px solid #e9ecef", borderRadius: "12px", outline: "none",
    backgroundColor: "#f8f9fa", color: "#2d3748", boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: "all 0.2s"
  },
  inputError: { borderColor: "#dc3545", backgroundColor: "#fff5f5" },
  errorText: { display: "block", color: "#dc3545", fontSize: "12px", marginTop: "6px", marginLeft: "4px" },
  errorBanner: {
    backgroundColor: "#fff5f5", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px",
    fontSize: "13px", color: "#dc3545", marginBottom: "16px"
  },
  successCard: {
    backgroundColor: "white", borderRadius: "16px", padding: "28px 24px",
    marginBottom: "32px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex", gap: "16px", alignItems: "center"
  },
  successTitle: { fontSize: "16px", fontWeight: "600", color: "#2d3748", margin: "0 0 4px 0" },
  successSub: { fontSize: "13px", color: "#6c757d", margin: 0 },
  button: {
    width: "100%", padding: "16px", fontSize: "16px", fontWeight: "600",
    color: "white", backgroundColor: "#2d3748", border: "none", borderRadius: "12px",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", marginTop: "8px", transition: "all 0.2s",
    boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)"
  },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  buttonIcon: { width: "20px", height: "20px", strokeWidth: 2 },
  buttonSpinner: {
    width: "18px", height: "18px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white", borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  input:focus, select:focus, textarea:focus {
    border-color: #2d3748 !important;
    background-color: white !important;
  }
  button:hover:not(:disabled) {
    background-color: #1a202c !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(45, 55, 72, 0.3) !important;
  }
`;
document.head.appendChild(styleSheet);