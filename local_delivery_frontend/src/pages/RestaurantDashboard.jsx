import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import LocationPicker from "../components/LocationPicker";

const API = "http://localhost:5000";

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch owner's restaurant
  useEffect(() => {
    axios
      .get(`${API}/api/restaurants/my`, {
        withCredentials: true
      })
      .then(res => {
        setRestaurant(res.data);
        if (res.data.location) {
          setLocation(res.data.location);
        }
        setLoading(false);
      })
      .catch(() => {
        setRestaurant(null);
        setLoading(false);
      });
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Restaurant name is required";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    }

    if (!location || !location.lat || !location.lng) {
      newErrors.location = "Please select your restaurant location on the map";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRestaurant = async () => {
    if (!validateForm()) {
      alert("Please fill all required fields and select location on the map");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await axios.post(
        `${API}/api/restaurants/create`,
        {
          ...form,
          location
        },
        { withCredentials: true }
      );
      setRestaurant(res.data);
      alert("Restaurant created successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create restaurant");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your restaurant...</p>
      </div>
    );
  }

  // Create Restaurant View
  if (!restaurant) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Header */}
          <div style={styles.createHeader}>
            <div style={styles.iconContainer}>
              <svg style={styles.headerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 style={styles.createTitle}>Create Your Restaurant</h1>
            <p style={styles.createSubtitle}>Set up your restaurant profile to start accepting orders</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={styles.errorBanner}>
              <svg style={styles.errorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Create Form */}
          <div style={styles.formCard}>
            <div style={styles.formBody}>
              <h2 style={styles.sectionTitle}>Basic Information</h2>

              {/* Restaurant Name */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Bella Italia"
                  value={form.name}
                  onChange={e => {
                    setForm({ ...form, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                  }}
                  style={{
                    ...styles.input,
                    ...(formErrors.name ? styles.inputError : {})
                  }}
                />
                {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
              </div>

              {/* Address */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address *
                </label>
                <textarea
                  placeholder="Enter your restaurant's full address"
                  value={form.address}
                  onChange={e => {
                    setForm({ ...form, address: e.target.value });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: "" });
                  }}
                  style={{
                    ...styles.textarea,
                    ...(formErrors.address ? styles.inputError : {})
                  }}
                  rows="3"
                />
                {formErrors.address && <span style={styles.errorText}>{formErrors.address}</span>}
              </div>

              {/* Phone */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                  }}
                  style={{
                    ...styles.input,
                    ...(formErrors.phone ? styles.inputError : {})
                  }}
                  maxLength={10}
                />
                {formErrors.phone && <span style={styles.errorText}>{formErrors.phone}</span>}
              </div>

              {/* Location Picker Section */}
              <div style={styles.locationSection}>
                <h2 style={styles.sectionTitle}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                    if (formErrors.location) setFormErrors({ ...formErrors, location: "" });
                  }}
                />
                {formErrors.location && <span style={styles.errorText}>{formErrors.location}</span>}
              </div>

              {/* Submit Button */}
              <button
                onClick={createRestaurant}
                disabled={creating}
                style={{
                  ...styles.submitButton,
                  ...(creating ? styles.buttonDisabled : {})
                }}
              >
                {creating ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Restaurant
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div style={styles.infoCard}>
            <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 style={styles.infoTitle}>Important</h3>
              <p style={styles.infoText}>
                Make sure to set your exact restaurant location on the map. This is crucial for calculating delivery distances and helping customers find you.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Existing Restaurant View
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Restaurant Header */}
        <div style={styles.restaurantHeader}>
          <div style={styles.restaurantIconContainer}>
            <svg style={styles.restaurantIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 style={styles.restaurantName}>{restaurant.name}</h1>
          <div style={styles.statusBadge}>
            <div style={styles.statusDot}></div>
            Active
          </div>
        </div>

        {/* Location Warning */}
        {!restaurant.location && (
          <div style={styles.warningBanner}>
            <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 style={styles.warningTitle}>Location Not Set</h3>
              <p style={styles.warningText}>
                Please update your restaurant profile and set your location on the map. This is required for delivery distance calculation.
              </p>
              <Link to="/restaurant-profile" style={styles.warningLink}>
                Update Location →
              </Link>
            </div>
          </div>
        )}

        {/* Restaurant Info Card */}
        <div style={styles.infoCardDashboard}>
          <h2 style={styles.sectionTitle}>Restaurant Details</h2>
          
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <div style={styles.infoIconWrapper}>
                <svg style={styles.infoIconSmall} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p style={styles.infoLabel}>Restaurant Name</p>
                <p style={styles.infoValue}>{restaurant.name}</p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoIconWrapper}>
                <svg style={styles.infoIconSmall} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p style={styles.infoLabel}>Address</p>
                <p style={styles.infoValue}>{restaurant.address}</p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoIconWrapper}>
                <svg style={styles.infoIconSmall} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p style={styles.infoLabel}>Phone</p>
                <p style={styles.infoValue}>{restaurant.phone}</p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <div style={styles.infoIconWrapper}>
                <svg style={styles.infoIconSmall} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <p style={styles.infoLabel}>Location Status</p>
                <p style={styles.infoValue}>
                  {restaurant.location ? (
                    <span style={styles.locationSet}>
                      <svg style={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Location Set
                    </span>
                  ) : (
                    <span style={styles.locationNotSet}>Not Set</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Link */}
          <Link to="/restaurant-profile" style={styles.editButton}>
            <svg style={styles.editIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Restaurant Profile
          </Link>
        </div>

        {/* Quick Actions */}
        <div style={styles.actionsCard}>
          <h2 style={styles.sectionTitle}>Quick Actions</h2>
          
          <div style={styles.actionGrid}>
            <Link to="/addmenu" style={styles.actionLink}>
              <div style={styles.actionCard}>
                <div style={styles.actionIconContainer}>
                  <svg style={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div style={styles.actionContent}>
                  <h3 style={styles.actionTitle}>Manage Menu</h3>
                  <p style={styles.actionDescription}>Add, edit, or remove menu items</p>
                </div>
                <svg style={styles.actionArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
   <Link to="/manage" style={styles.actionLink}>
            <div style={styles.actionCard}>
              <div style={styles.actionIconContainer}>
                <svg style={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div style={styles.actionContent}>
                <h3 style={styles.actionTitle}>View Orders</h3>
                <p style={styles.actionDescription}>Track and manage incoming orders</p>
              </div>
              
            </div>
</Link>
            <div style={styles.actionCardDisabled}>
              <div style={styles.actionIconContainer}>
                <svg style={styles.actionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div style={styles.actionContent}>
                <h3 style={styles.actionTitle}>Analytics</h3>
                <p style={styles.actionDescription}>View sales and performance metrics</p>
              </div>
              <div style={styles.comingSoonBadge}>Coming Soon</div>
            </div>
          </div>
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
    maxWidth: "800px",
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
  // Create Restaurant Styles
  createHeader: {
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
  headerIcon: {
    width: "40px",
    height: "40px",
    color: "white",
    strokeWidth: 2
  },
  createTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  createSubtitle: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#fff5f5",
    border: "2px solid #feb2b2",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "20px",
    color: "#c53030",
    fontSize: "14px"
  },
  errorIcon: {
    width: "24px",
    height: "24px",
    strokeWidth: 2,
    flexShrink: 0
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  },
  formBody: {
    padding: "24px"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  inputGroup: {
    marginBottom: "20px"
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "8px"
  },
  labelIcon: {
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
  submitButton: {
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
    padding: "16px"
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
  // Existing Restaurant Styles
  restaurantHeader: {
    textAlign: "center",
    marginBottom: "32px"
  },
  restaurantIconContainer: {
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
  restaurantName: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 12px 0"
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#d4edda",
    color: "#155724",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#28a745",
    borderRadius: "50%",
    animation: "pulse 2s infinite"
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
    margin: "0 0 8px 0",
    lineHeight: "1.5"
  },
  warningLink: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#856404",
    textDecoration: "none",
    transition: "all 0.2s"
  },
  infoCardDashboard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "20px"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "20px"
  },
  infoItem: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px"
  },
  infoIconWrapper: {
    width: "40px",
    height: "40px",
    backgroundColor: "white",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  infoIconSmall: {
    width: "20px",
    height: "20px",
    color: "#2d3748",
    strokeWidth: 2
  },
  infoLabel: {
    fontSize: "12px",
    color: "#6c757d",
    margin: "0 0 4px 0",
    fontWeight: "500"
  },
  infoValue: {
    fontSize: "15px",
    color: "#2d3748",
    margin: 0,
    fontWeight: "600"
  },
  locationSet: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "#28a745"
  },
  locationNotSet: {
    color: "#dc3545"
  },
  checkIcon: {
    width: "16px",
    height: "16px",
    strokeWidth: 2.5
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    backgroundColor: "#f8f9fa",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.2s",
    cursor: "pointer"
  },
  editIcon: {
    width: "18px",
    height: "18px",
    strokeWidth: 2
  },
  actionsCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  actionGrid: {
    display: "grid",
    gap: "12px"
  },
  actionLink: {
    textDecoration: "none"
  },
  actionCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    transition: "all 0.2s",
    cursor: "pointer",
    border: "2px solid transparent"
  },
  actionCardDisabled: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    opacity: 0.6,
    cursor: "not-allowed",
    border: "2px solid transparent"
  },
  actionIconContainer: {
    width: "48px",
    height: "48px",
    backgroundColor: "white",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  actionIcon: {
    width: "24px",
    height: "24px",
    color: "#2d3748",
    strokeWidth: 2
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  actionDescription: {
    fontSize: "13px",
    color: "#6c757d",
    margin: 0
  },
  actionArrow: {
    width: "20px",
    height: "20px",
    color: "#6c757d",
    strokeWidth: 2
  },
  comingSoonBadge: {
    padding: "6px 12px",
    backgroundColor: "#e9ecef",
    color: "#6c757d",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "6px"
  }
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
  
  a[href]:hover .actionCard {
    background-color: white !important;
    border-color: #2d3748 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }
  
  .editButton:hover {
    background-color: white !important;
    border-color: #2d3748 !important;
    transform: translateY(-1px);
  }
  
  .warningLink:hover {
    text-decoration: underline !important;
  }
`;
document.head.appendChild(styleSheet);

