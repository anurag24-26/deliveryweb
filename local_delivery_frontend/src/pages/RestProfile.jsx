import { useEffect, useState, useRef } from "react";
import axios from "axios";
import LocationPicker from "../components/LocationPicker";
import PhoneVerification from "../components/PhoneVerification";

const API = "https://deliverybackend-0i61.onrender.com";

export default function RestaurantProfile() {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Image states
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API}/api/restaurants/my`, { withCredentials: true })
      .then(res => {
        setRestaurant(res.data);
        setForm({
          name: res.data.name || "",
          address: res.data.address || "",
          phone: res.data.phone || ""
        });
        if (res.data.location) setLocation(res.data.location);
        if (res.data.images) setExistingImages(res.data.images);
        if (res.data.phone) setPhoneVerified(true); // pre-verified if phone exists in DB
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // ── Image handlers ───────────────────────────────────────────────────────

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const total = existingImages.length + newImages.length + files.length;
    if (total > 5) {
      alert(`You can only have 5 images total. Currently have ${existingImages.length + newImages.length}.`);
      return;
    }

    const previews = files.map(f => URL.createObjectURL(f));
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageUrl) => {
    if (existingImages.length <= 1 && newImages.length === 0) {
      alert("You must keep at least 1 image. Upload a new one before deleting this.");
      return;
    }
    if (!window.confirm("Delete this image?")) return;

    setDeletingUrl(imageUrl);
    try {
      await axios.delete(`${API}/api/restaurants/image`, {
        data: { imageUrl },
        withCredentials: true
      });
      setExistingImages(prev => prev.filter(img => img !== imageUrl));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete image");
    } finally {
      setDeletingUrl(null);
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Restaurant name is required";
    if (!form.address?.trim()) newErrors.address = "Address is required";
    if (!form.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Enter valid 10-digit phone number";
    } else if (!phoneVerified) {
      newErrors.phone = "Please verify your phone number via OTP";
    }
    if (!location || !location.lat || !location.lng) {
      newErrors.location = "Please select your restaurant location on the map";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const saveRestaurant = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("address", form.address);
      formData.append("phone", form.phone);
      formData.append("location", JSON.stringify(location));
      newImages.forEach(file => formData.append("images", file));

      const res = await axios.put(`${API}/api/restaurants/update`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      });

      setRestaurant(res.data);
      setExistingImages(res.data.images || []);
      newPreviews.forEach(url => URL.revokeObjectURL(url));
      setNewImages([]);
      setNewPreviews([]);
      alert("Restaurant details saved successfully!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const totalImages = existingImages.length + newImages.length;

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

        {/* Location warning */}
        {!location && (
          <div style={styles.warningBanner}>
            <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 style={styles.warningTitle}>Location Required</h3>
              <p style={styles.warningText}>Please set your restaurant location on the map below.</p>
            </div>
          </div>
        )}

        <div style={styles.form}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>

          {/* Name */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Restaurant Name *</label>
            <input
              type="text"
              placeholder="Enter restaurant name"
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              style={{ ...styles.input, ...(errors.name ? styles.inputError : {}) }}
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          {/* Address */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Address *</label>
            <textarea
              placeholder="Enter complete address"
              value={form.address}
              onChange={e => {
                setForm({ ...form, address: e.target.value });
                if (errors.address) setErrors({ ...errors, address: "" });
              }}
              style={{ ...styles.textarea, ...(errors.address ? styles.inputError : {}) }}
              rows={3}
            />
            {errors.address && <span style={styles.errorText}>{errors.address}</span>}
          </div>

          {/* Phone + OTP Verification */}
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Phone Number *</label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={e => {
                setForm({ ...form, phone: e.target.value });
                setPhoneVerified(false); // reset if phone changes
                if (errors.phone) setErrors({ ...errors, phone: "" });
              }}
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
              maxLength={10}
            />
            {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}

            {/* ✅ OTP Verification Component */}
            <PhoneVerification
              phone={form.phone}
              isVerified={phoneVerified}
              onVerified={(verifiedPhone) => {
                setPhoneVerified(true);
                setForm(prev => ({ ...prev, phone: verifiedPhone }));
              }}
            />
          </div>

          {/* ── IMAGE MANAGEMENT SECTION ── */}
          <div style={styles.imageSection}>
            <h2 style={styles.sectionTitle}>
              📷 Restaurant Images
              <span style={styles.imageCount}>{totalImages}/5</span>
            </h2>
            <p style={styles.locationHelp}>
              Manage your restaurant photos. You must keep at least 1 image.
            </p>

            {/* Existing images from DB */}
            {existingImages.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={styles.imgGroupLabel}>Current Photos</p>
                <div style={styles.previewGrid}>
                  {existingImages.map((url, i) => (
                    <div key={i} style={styles.previewItem}>
                      <img src={url} alt={`restaurant-${i}`} style={styles.previewImg} />
                      <button
                        style={{
                          ...styles.removeImgBtn,
                          ...(deletingUrl === url ? styles.removeImgBtnLoading : {})
                        }}
                        onClick={() => deleteExistingImage(url)}
                        disabled={deletingUrl === url}
                        title="Delete image"
                      >
                        {deletingUrl === url ? "..." : "✕"}
                      </button>
                      {i === 0 && <div style={styles.mainBadge}>Main</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images to be uploaded */}
            {newPreviews.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <p style={styles.imgGroupLabel}>New Photos (will upload on save)</p>
                <div style={styles.previewGrid}>
                  {newPreviews.map((src, i) => (
                    <div key={i} style={styles.previewItem}>
                      <img src={src} alt={`new-${i}`} style={styles.previewImg} />
                      <button
                        style={styles.removeImgBtn}
                        onClick={() => removeNewImage(i)}
                        title="Remove"
                      >
                        ✕
                      </button>
                      <div style={styles.newBadge}>New</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload box */}
            {totalImages < 5 && (
              <div
                style={styles.uploadBox}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleNewImages}
                />
                <div style={styles.uploadInner}>
                  <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p style={styles.uploadText}>Click to add photos</p>
                  <p style={styles.uploadSubText}>{5 - totalImages} slot{5 - totalImages !== 1 ? "s" : ""} remaining · JPG/PNG/WEBP · 5MB max</p>
                </div>
              </div>
            )}

            {totalImages === 5 && (
              <div style={styles.maxReachedNote}>
                ✓ Maximum 5 images reached. Delete one to add another.
              </div>
            )}

            {existingImages.length === 0 && newImages.length === 0 && (
              <div style={styles.noImagesWarning}>
                ⚠️ No images yet. Upload at least 1 photo to attract customers.
              </div>
            )}
          </div>

          {/* Location Picker */}
          <div style={styles.locationSection}>
            <h2 style={styles.sectionTitle}>Restaurant Location *</h2>
            <p style={styles.locationHelp}>
              Pin your exact restaurant location on the map.
            </p>
            <LocationPicker
              initialLocation={location}
              onSelect={(loc) => {
                setLocation(loc);
                if (errors.location) setErrors({ ...errors, location: "" });
              }}
            />
            {errors.location && <span style={styles.errorText}>{errors.location}</span>}
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
            style={{ ...styles.button, ...(saving ? styles.buttonDisabled : {}) }}
          >
            {saving ? (
              <><div style={styles.buttonSpinner}></div> Saving...</>
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
            <h3 style={styles.infoTitle}>How images work</h3>
            <p style={styles.infoText}>
              Deleting a photo removes it immediately. New photos are uploaded when you click Save. The first image is shown as your main cover photo.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", backgroundColor: "#f8f9fa", padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  content: { maxWidth: "600px", margin: "0 auto" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8f9fa" },
  spinner: { width: "40px", height: "40px", border: "4px solid #e9ecef", borderTop: "4px solid #2d3748", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText: { marginTop: "16px", color: "#6c757d", fontSize: "14px" },
  emptyState: { textAlign: "center", padding: "60px 20px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: "40px" },
  emptyTitle: { fontSize: "20px", fontWeight: "600", color: "#2d3748", margin: "0 0 8px 0" },
  emptyText: { fontSize: "14px", color: "#6c757d", margin: 0 },
  header: { textAlign: "center", marginBottom: "32px" },
  iconContainer: { width: "80px", height: "80px", margin: "0 auto 16px", backgroundColor: "#2d3748", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  restaurantIcon: { width: "40px", height: "40px", color: "white", strokeWidth: 2 },
  title: { fontSize: "28px", fontWeight: "700", color: "#2d3748", margin: "0 0 8px 0" },
  subtitle: { fontSize: "14px", color: "#6c757d", margin: 0 },
  warningBanner: { display: "flex", gap: "16px", backgroundColor: "#fff3cd", border: "2px solid #ffc107", borderRadius: "12px", padding: "16px", marginBottom: "20px" },
  warningIcon: { width: "24px", height: "24px", color: "#856404", strokeWidth: 2, flexShrink: 0 },
  warningTitle: { fontSize: "16px", fontWeight: "600", color: "#856404", margin: "0 0 4px 0" },
  warningText: { fontSize: "13px", color: "#856404", margin: 0, lineHeight: "1.5" },
  form: { backgroundColor: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "20px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "#2d3748", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" },
  imageCount: { marginLeft: "auto", fontSize: "13px", fontWeight: "500", color: "#6c757d", backgroundColor: "#f8f9fa", padding: "2px 10px", borderRadius: "20px", border: "1px solid #e9ecef" },
  inputGroup: { marginBottom: "20px" },
  inputLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "600", color: "#2d3748", marginBottom: "8px" },
  inputIcon: { width: "18px", height: "18px", color: "#6c757d", strokeWidth: 2 },
  input: { width: "100%", padding: "14px 16px", fontSize: "15px", border: "2px solid #e9ecef", borderRadius: "12px", outline: "none", transition: "all 0.2s", backgroundColor: "#f8f9fa", color: "#2d3748", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "14px 16px", fontSize: "15px", border: "2px solid #e9ecef", borderRadius: "12px", outline: "none", transition: "all 0.2s", backgroundColor: "#f8f9fa", color: "#2d3748", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" },
  inputError: { borderColor: "#dc3545", backgroundColor: "#fff5f5" },
  errorText: { display: "block", color: "#dc3545", fontSize: "12px", marginTop: "6px", marginLeft: "4px" },
  imageSection: { marginTop: "28px", paddingTop: "24px", borderTop: "2px solid #e9ecef" },
  imgGroupLabel: { fontSize: "12px", fontWeight: "600", color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px 0" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px", marginBottom: "4px" },
  previewItem: { position: "relative", borderRadius: "10px", overflow: "hidden", aspectRatio: "1", border: "2px solid #e9ecef" },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  removeImgBtn: { position: "absolute", top: "4px", right: "4px", width: "22px", height: "22px", borderRadius: "50%", border: "none", backgroundColor: "rgba(220,53,69,0.85)", color: "white", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", zIndex: 2 },
  removeImgBtnLoading: { backgroundColor: "rgba(0,0,0,0.5)", cursor: "not-allowed" },
  mainBadge: { position: "absolute", bottom: "4px", left: "4px", backgroundColor: "rgba(45,55,72,0.85)", color: "white", fontSize: "9px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" },
  newBadge: { position: "absolute", bottom: "4px", left: "4px", backgroundColor: "rgba(40,167,69,0.85)", color: "white", fontSize: "9px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" },
  uploadBox: { border: "2px dashed #dee2e6", borderRadius: "12px", padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", backgroundColor: "#f8f9fa", marginTop: "8px" },
  uploadInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  uploadIcon: { width: "36px", height: "36px", color: "#adb5bd", strokeWidth: 1.5 },
  uploadText: { fontSize: "14px", fontWeight: "600", color: "#495057", margin: 0 },
  uploadSubText: { fontSize: "12px", color: "#6c757d", margin: 0 },
  maxReachedNote: { padding: "12px 16px", backgroundColor: "#d4edda", borderRadius: "8px", fontSize: "13px", color: "#155724", fontWeight: "500", marginTop: "8px" },
  noImagesWarning: { padding: "12px 16px", backgroundColor: "#fff3cd", borderRadius: "8px", fontSize: "13px", color: "#856404", marginTop: "8px" },
  locationSection: { marginTop: "32px", paddingTop: "24px", borderTop: "2px solid #e9ecef" },
  locationHelp: { fontSize: "13px", color: "#6c757d", margin: "0 0 16px 0", lineHeight: "1.5" },
  locationStatus: { display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "12px", backgroundColor: "#d4edda", borderRadius: "8px" },
  checkIcon: { width: "20px", height: "20px", color: "#28a745", strokeWidth: 2.5 },
  locationStatusText: { fontSize: "13px", color: "#155724", fontWeight: "500" },
  button: { width: "100%", padding: "16px", fontSize: "16px", fontWeight: "600", color: "white", backgroundColor: "#2d3748", border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "24px", transition: "all 0.2s", boxShadow: "0 4px 6px rgba(45, 55, 72, 0.2)" },
  buttonDisabled: { opacity: 0.6, cursor: "not-allowed" },
  buttonIcon: { width: "20px", height: "20px", strokeWidth: 2.5 },
  buttonSpinner: { width: "18px", height: "18px", border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  infoCard: { display: "flex", gap: "16px", backgroundColor: "#f0f0ff", border: "2px solid #e0e0ff", borderRadius: "12px", padding: "16px", marginBottom: "20px" },
  infoIcon: { width: "24px", height: "24px", color: "#667eea", strokeWidth: 2, flexShrink: 0 },
  infoTitle: { fontSize: "14px", fontWeight: "600", color: "#667eea", margin: "0 0 4px 0" },
  infoText: { fontSize: "13px", color: "#667eea", margin: 0, lineHeight: "1.5" },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  input:focus, textarea:focus { border-color: #2d3748 !important; background-color: white !important; }
  button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  button:active:not(:disabled) { transform: translateY(0); }
`;
document.head.appendChild(styleSheet);