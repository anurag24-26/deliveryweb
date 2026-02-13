import { useEffect, useState } from "react";
import axios from "axios";
import LocationPicker from "../components/LocationPicker";

const API = "http://localhost:5000";

export default function RestaurantProfile() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios
      .get(`${API}/api/restaurants/my`, {
        withCredentials: true
      })
      .then(res => {
        setRestaurant(res.data);
        setForm({
          name: res.data.name || "",
          address: res.data.address || "",
          phone: res.data.phone || ""
        });
        if (res.data.location) {
          setLocation(res.data.location);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Restaurant name is required";
    }
    
    if (!form.address || form.address.trim() === "") {
      newErrors.address = "Address is required";
    }
    
    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    }

    if (!location || !location.lat || !location.lng) {
      newErrors.location = "Please select your restaurant location on the map";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRestaurant = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields correctly and select location on map");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/api/restaurants/update`,
        {
          name: form.name,
          address: form.address,
          phone: form.phone,
          location
        },
        { withCredentials: true }
      );

      setRestaurant(res.data);
      alert("Restaurant details saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save restaurant details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading restaurant details...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No Restaurant Found</h3>
            <p style={styles.emptyText}>Please create your restaurant profile first from the dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <svg style={styles.restaurantIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 style={styles.title}>Restaurant Profile</h1>
          <p style={styles.subtitle}>Manage your restaurant information</p>
        </div>

        {/* Location Warning */}
        {!location && (
          <div style={styles.warningBanner}>
            <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 style={styles.warningTitle}>Location Required</h3>
              <p style={styles.warningText}>
                Please set your restaurant location on the map below. This is essential for delivery distance calculation and helping customers find you.
              </p>
            </div>
          </div>
        )}

        {/* Restaurant Details Form */}
        <div style={styles.form}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          {/* Restaurant Name */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Restaurant Name *
            </label>
            <input
              type="text"
              placeholder="Enter restaurant name"
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {})
              }}
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          {/* Address */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address *
            </label>
            <textarea
              placeholder="Enter complete address"
              value={form.address}
              onChange={e => {
                setForm({ ...form, address: e.target.value });
                if (errors.address) setErrors({ ...errors, address: "" });
              }}
              style={{
                ...styles.textarea,
                ...(errors.address ? styles.inputError : {})
              }}
              rows={3}
            />
            {errors.address && <span style={styles.errorText}>{errors.address}</span>}
          </div>

          {/* Phone */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone Number *
            </label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={e => {
                setForm({ ...form, phone: e.target.value });
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              style={{
                ...styles.input,
                ...(errors.phone ? styles.inputError : {})
              }}
              maxLength={10}
            />
            {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
          </div>

          {/* Location Picker Section */}
          <div style={styles.locationSection}>
            <h2 style={styles.sectionTitle}>
              <svg style={styles.inputIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Restaurant Location *
            </h2>
            <p style={styles.locationHelp}>
              Pin your exact restaurant location on the map. This helps customers find you and enables delivery distance calculation.
            </p>
            
            <LocationPicker
              initialLocation={location}
              onSelect={(loc) => {
                setLocation(loc);
                if (errors.location) setErrors({ ...errors, location: "" });
              }}
            />
            {errors.location && <span style={styles.errorText}>{errors.location}</span>}

            {/* Location Status */}
            {location && (
              <div style={styles.locationStatus}>
                <svg style={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={styles.locationStatusText}>
                  Location set: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={saveRestaurant}
            disabled={saving}
            style={{
              ...styles.button,
              ...(saving ? styles.buttonDisabled : {})
            }}
          >
            {saving ? (
              <>
                <div style={styles.buttonSpinner}></div>
                Saving...
              </>
            ) : (
              <>
                <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Restaurant Details
              </>
            )}
          </button>
        </div>

        {/* Info Card */}
        <div style={styles.infoCard}>
          <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 style={styles.infoTitle}>Important</h3>
            <p style={styles.infoText}>
              Your restaurant location is used to calculate delivery distances. Make sure to set the exact location for accurate delivery availability.
            </p>
          </div>
        </div>

        {/* Tips Card */}
        <div style={styles.tipsCard}>
          <h3 style={styles.tipsTitle}>
            <svg style={styles.tipsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Tips for Setting Location
          </h3>
          <ul style={styles.tipsList}>
            <li style={styles.tipsListItem}>Click on the map to set your restaurant's exact location</li>
            <li style={styles.tipsListItem}>Drag the marker to fine-tune the position</li>
            <li style={styles.tipsListItem}>Use the search box to find your address quickly</li>
            <li style={styles.tipsListItem}>Zoom in for better precision</li>
            <li style={styles.tipsListItem}>The more accurate the location, the better delivery experience for customers</li>
          </ul>
        </div>
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
    maxWidth: "600px",
    margin: "0 auto"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e9ecef",
    borderTop: "4px solid #2d3748",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "16px",
    color: "#6c757d",
    fontSize: "14px"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginTop: "40px"
  },
  emptyIcon: {
    width: "80px",
    height: "80px",
    margin: "0 auto 20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  emptyIconSvg: {
    width: "40px",
    height: "40px",
    color: "#6c757d",
    strokeWidth: 2
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  emptyText: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  header: {
    textAlign: "center",
    marginBottom: "32px"
  },
  iconContainer: {
    width: "80px",
    height: "80px",
    margin: "0 auto 16px",
    backgroundColor: "#2d3748",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  restaurantIcon: {
    width: "40px",
    height: "40px",
    color: "white",
    strokeWidth: 2
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  warningBanner: {
    display: "flex",
    gap: "16px",
    backgroundColor: "#fff3cd",
    border: "2px solid #ffc107",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px"
  },
  warningIcon: {
    width: "24px",
    height: "24px",
    color: "#856404",
    strokeWidth: 2,
    flexShrink: 0
  },
  warningTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#856404",
    margin: "0 0 4px 0"
  },
  warningText: {
    fontSize: "13px",
    color: "#856404",
    margin: 0,
    lineHeight: "1.5"
  },
  form: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  inputGroup: {
    marginBottom: "20px"
  },
  inputLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "8px"
  },
  inputIcon: {
    width: "18px",
    height: "18px",
    color: "#6c757d",
    strokeWidth: 2
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "#f8f9fa",
    color: "#2d3748",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "#f8f9fa",
    color: "#2d3748",
    boxSizing: "border-box",
    fontFamily: "inherit",
    resize: "vertical"
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff5f5"
  },
  errorText: {
    display: "block",
    color: "#dc3545",
    fontSize: "12px",
    marginTop: "6px",
    marginLeft: "4px"
  },
  locationSection: {
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "2px solid #e9ecef"
  },
  locationHelp: {
    fontSize: "13px",
    color: "#6c757d",
    margin: "0 0 16px 0",
    lineHeight: "1.5"
  },
  locationStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#d4edda",
    borderRadius: "8px"
  },
  checkIcon: {
    width: "20px",
    height: "20px",
    color: "#28a745",
    strokeWidth: 2.5
  },
  locationStatusText: {
    fontSize: "13px",
    color: "#155724",
    fontWeight: "500"
  },
  button: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#2d3748",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "24px",
    transition: "all 0.2s",
    boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed"
  },
  buttonIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2.5
  },
  buttonSpinner: {
    width: "18px",
    height: "18px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  infoCard: {
    display: "flex",
    gap: "16px",
    backgroundColor: "#f0f0ff",
    border: "2px solid #e0e0ff",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px"
  },
  infoIcon: {
    width: "24px",
    height: "24px",
    color: "#667eea",
    strokeWidth: 2,
    flexShrink: 0
  },
  infoTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#667eea",
    margin: "0 0 4px 0"
  },
  infoText: {
    fontSize: "13px",
    color: "#667eea",
    margin: 0,
    lineHeight: "1.5"
  },
  tipsCard: {
    backgroundColor: "white",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    padding: "20px"
  },
  tipsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  tipsIcon: {
    width: "20px",
    height: "20px",
    color: "#2d3748",
    strokeWidth: 2
  },
  tipsList: {
    margin: 0,
    paddingLeft: "20px",
    listStyle: "none"
  },
  tipsListItem: {
    fontSize: "14px",
    color: "#6c757d",
    marginBottom: "10px",
    paddingLeft: "8px",
    position: "relative",
    lineHeight: "1.5"
  }
};

// Add CSS animation for spinners and interactions
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus,
  textarea:focus {
    border-color: #2d3748 !important;
    background-color: white !important;
  }
  
  button:hover:not(:disabled) {
    background-color: #1a202c !important;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(45, 55, 72, 0.3) !important;
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }

  ul li::before {
    content: "•";
    position: absolute;
    left: -8px;
    color: #2d3748;
    font-weight: bold;
  }
`;
document.head.appendChild(styleSheet);