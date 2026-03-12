// Profile.jsx — UPDATED with phone verification
// Changes from original:
//   1. Import PhoneVerification component
//   2. Add `phoneVerified` state
//   3. Add PhoneVerification component below the phone input
//   4. Block save until phone is verified

import { useEffect, useState } from "react";
import axios from "axios";
import LocationPicker from "../components/LocationPicker";
import PhoneVerification from "../components/PhoneVerification"; // 🆕

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    phone: "",
    flat: "",
    area: "",
    locality: "",
    pincode: ""
  });
  const [errors, setErrors] = useState({});
  const [phoneVerified, setPhoneVerified] = useState(false); // 🆕

  useEffect(() => {
    axios
      .get("https://deliverybackend-0i61.onrender.com/api/profile/me", {
        withCredentials: true
      })
      .then(res => {
        setUser(res.data);
        if (res.data.address) {
          setForm({ phone: res.data.phone || "", ...res.data.address });
        } else {
          setForm(prev => ({ ...prev, phone: res.data.phone || "" }));
        }
        // If phone already exists in DB, treat it as pre-verified
        if (res.data.phone) setPhoneVerified(true); // 🆕
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    } else if (!phoneVerified) {              // 🆕
      newErrors.phone = "Please verify your phone number via OTP";
    }
    if (!form.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.pincode)) {
      newErrors.pincode = "Enter valid 6-digit pincode";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfile = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await axios.put(
        "https://deliverybackend-0i61.onrender.com/api/profile/update",
        {
          phone: form.phone,
          address: {
            flat: form.flat,
            area: form.area,
            locality: form.locality,
            pincode: form.pincode
          },
          location
        },
        { withCredentials: true }
      );
      setUser(res.data);
      alert("Profile saved successfully");
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <svg style={styles.userIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={styles.title}>My Profile</h1>
        </div>

        {/* User Info Card */}
        <div style={styles.card}>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Name</p>
              <p style={styles.value}>{user?.name}</p>
            </div>
          </div>
          <div style={styles.infoRow}>
            <div style={styles.iconWrapper}>
              <svg style={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={styles.label}>Email</p>
              <p style={styles.value}>{user?.email}</p>
            </div>
          </div>
        </div>

        <h2 style={styles.sectionTitle}>Delivery Details</h2>

        <div style={styles.form}>

          {/* Phone + OTP Verification */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Phone Number *</label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={e => {
                setForm({ ...form, phone: e.target.value });
                setPhoneVerified(false); // 🆕 reset verification if phone changes
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
              maxLength={10}
            />
            {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}

            {/* 🆕 OTP Verification Component */}
            <PhoneVerification
              phone={form.phone}
              isVerified={phoneVerified}
              onVerified={(verifiedPhone) => {
                setPhoneVerified(true);
                setForm(prev => ({ ...prev, phone: verifiedPhone }));
              }}
            />
          </div>

          {/* Flat */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Flat / House No.</label>
            <input
              type="text"
              placeholder="e.g., 12A, Building 4"
              value={form.flat}
              onChange={e => setForm({ ...form, flat: e.target.value })}
              style={styles.input}
            />
          </div>

          {/* Area */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Area</label>
            <input
              type="text"
              placeholder="e.g., Sector 12"
              value={form.area}
              onChange={e => setForm({ ...form, area: e.target.value })}
              style={styles.input}
            />
          </div>

          {/* Locality */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Locality</label>
            <input
              type="text"
              placeholder="e.g., Dwarka"
              value={form.locality}
              onChange={e => setForm({ ...form, locality: e.target.value })}
              style={styles.input}
            />
          </div>

          {/* Pincode */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Pincode *</label>
            <input
              type="tel"
              placeholder="Enter 6-digit pincode"
              value={form.pincode}
              onChange={e => {
                setForm({ ...form, pincode: e.target.value });
                if (errors.pincode) setErrors({ ...errors, pincode: "" });
              }}
              style={{ ...styles.input, ...(errors.pincode ? styles.inputError : {}) }}
              maxLength={6}
            />
            {errors.pincode && <span style={styles.errorText}>{errors.pincode}</span>}
          </div>

          <h2 style={styles.sectionTitle}>Delivery Location</h2>
          <LocationPicker
            initialLocation={user?.location}
            onSelect={(loc) => setLocation(loc)}
          />

          <button
            onClick={saveProfile}
            disabled={saving}
            style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
          >
            {saving ? (
              <><div style={styles.buttonSpinner}></div>Saving...</>
            ) : (
              <>
                <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles (unchanged from your original) ────────────────────────────────────
const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  content: { maxWidth: "480px", margin: "0 auto" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8f9fa" },
  spinner: { width: "40px", height: "40px", border: "4px solid #e9ecef", borderTop: "4px solid #2d3748", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { marginTop: "16px", color: "#6c757d", fontSize: "14px" },
  header: { textAlign: "center", marginBottom: "32px" },
  iconContainer: { width: "80px", height: "80px", margin: "0 auto 16px", backgroundColor: "#2d3748", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  userIcon: { width: "40px", height: "40px", color: "white", strokeWidth: 2 },
  title: { fontSize: "28px", fontWeight: "700", color: "#2d3748", margin: 0 },
  card: { backgroundColor: "white", borderRadius: "16px", padding: "20px", marginBottom: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  infoRow: { display: "flex", alignItems: "center", gap: "16px", padding: "16px 0", borderBottom: "1px solid #f1f3f5" },
  iconWrapper: { width: "48px", height: "48px", backgroundColor: "#f8f9fa", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  icon: { width: "24px", height: "24px", color: "#6c757d", strokeWidth: 2 },
  label: { fontSize: "12px", color: "#6c757d", margin: "0 0 4px 0", fontWeight: "500" },
  value: { fontSize: "16px", color: "#2d3748", margin: 0, fontWeight: "500" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#2d3748", marginBottom: "16px" },
  form: { backgroundColor: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  inputGroup: { marginBottom: "20px" },
  inputLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#2d3748", marginBottom: "8px" },
  input: { width: "100%", padding: "14px 16px", fontSize: "15px", border: "2px solid #e9ecef", borderRadius: "12px", outline: "none", transition: "all 0.2s", backgroundColor: "#f8f9fa", color: "#2d3748", boxSizing: "border-box" },
  inputError: { borderColor: "#dc3545", backgroundColor: "#fff5f5" },
  errorText: { display: "block", color: "#dc3545", fontSize: "12px", marginTop: "6px", marginLeft: "4px" },
  button: { width: "100%", padding: "16px", fontSize: "16px", fontWeight: "600", color: "white", backgroundColor: "#2d3748", border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", transition: "all 0.2s", boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)" },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  buttonIcon: { width: "20px", height: "20px", strokeWidth: 2.5 },
  buttonSpinner: { width: "18px", height: "18px", border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  input:focus { border-color: #2d3748 !important; background-color: white !important; }
  button:hover:not(:disabled) { background-color: #1a202c !important; transform: translateY(-1px); }
  button:active:not(:disabled) { transform: translateY(0); }
`;
document.head.appendChild(styleSheet);