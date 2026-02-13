import { useEffect, useState } from "react";
import axios from "axios";
import { deleteMenuItem } from "../api/api";

export default function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    isVeg: false,
    isBestSeller: false
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMethod, setUploadMethod] = useState("file"); // "file" or "url"
  const [errors, setErrors] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/restaurants/my", {
        withCredentials: true
      })
      .then(res =>
        axios.get(`http://localhost:5000/api/menu/${res.data._id}`)
      )
      .then(res => {
        setMenu(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (url) => {
    setForm({ ...form, imageUrl: url });
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, imageUrl: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Item name is required";
    }

    if (!form.price) {
      newErrors.price = "Price is required";
    } else if (isNaN(form.price) || parseFloat(form.price) <= 0) {
      newErrors.price = "Enter a valid price";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = async () => {
    if (!validateForm()) return;

    setAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);
      formData.append("isVeg", form.isVeg);
      formData.append("isBestSeller", form.isBestSeller);

      // If file is uploaded, append it
      if (uploadMethod === "file" && imageFile) {
        formData.append("image", imageFile);
      } else if (uploadMethod === "url" && form.imageUrl) {
        // If URL is provided, send it as body field
        formData.append("image", form.imageUrl);
      }

      const res = await axios.post(
        "http://localhost:5000/api/menu/add",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMenu([...menu, res.data]);
      setForm({ 
        name: "", 
        price: "", 
        description: "", 
        imageUrl: "",
        isVeg: false,
        isBestSeller: false
      });
      setImageFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      setErrors({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to add item. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const removeItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteMenuItem(id);
      setMenu(menu.filter(m => m._id !== id));
    } catch (error) {
      alert("Failed to delete item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading menu...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Menu Manager</h1>
            <p style={styles.subtitle}>{menu.length} items in your menu</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            <svg style={styles.addIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>Add New Item</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setForm({ 
                    name: "", 
                    price: "", 
                    description: "", 
                    imageUrl: "",
                    isVeg: false,
                    isBestSeller: false
                  });
                  setImageFile(null);
                  setImagePreview(null);
                  setErrors({});
                }}
                style={styles.closeButton}
              >
                <svg style={styles.closeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={styles.formBody}>
              {/* Image Upload Section */}
              <div style={styles.imageSection}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Dish Image (Optional)
                </label>

                {/* Upload Method Tabs */}
                <div style={styles.uploadTabs}>
                  <button
                    onClick={() => {
                      setUploadMethod("file");
                      setForm({ ...form, imageUrl: "" });
                      setImagePreview(imageFile ? URL.createObjectURL(imageFile) : null);
                    }}
                    style={{
                      ...styles.uploadTab,
                      ...(uploadMethod === "file" ? styles.uploadTabActive : {})
                    }}
                  >
                    <svg style={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </button>
                  <button
                    onClick={() => {
                      setUploadMethod("url");
                      setImageFile(null);
                      setImagePreview(form.imageUrl || null);
                    }}
                    style={{
                      ...styles.uploadTab,
                      ...(uploadMethod === "url" ? styles.uploadTabActive : {})
                    }}
                  >
                    <svg style={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Image URL
                  </button>
                </div>

                {/* Image Preview or Upload Area */}
                <div style={styles.imageUploadArea}>
                  {imagePreview ? (
                    <div style={styles.imagePreviewContainer}>
                      <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                      <button
                        onClick={clearImage}
                        style={styles.removeImageButton}
                        type="button"
                      >
                        <svg style={styles.removeImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      {uploadMethod === "file" ? (
                        <label style={styles.uploadLabel}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            style={styles.fileInput}
                          />
                          <div style={styles.uploadPlaceholder}>
                            <svg style={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p style={styles.uploadText}>Click to upload image</p>
                            <p style={styles.uploadSubtext}>PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </label>
                      ) : (
                        <div style={styles.urlInputContainer}>
                          <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={form.imageUrl}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            style={styles.urlInput}
                          />
                          <button
                            onClick={() => handleImageUrlChange(form.imageUrl)}
                            style={styles.previewUrlButton}
                            type="button"
                          >
                            Preview
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Item Name */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Item Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Margherita Pizza"
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

              {/* Price */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 299"
                  value={form.price}
                  onChange={e => {
                    setForm({ ...form, price: e.target.value });
                    if (errors.price) setErrors({ ...errors, price: "" });
                  }}
                  style={{
                    ...styles.input,
                    ...(errors.price ? styles.inputError : {})
                  }}
                  min="0"
                  step="0.01"
                />
                {errors.price && <span style={styles.errorText}>{errors.price}</span>}
              </div>

              {/* Description */}
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <svg style={styles.labelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description *
                </label>
                <textarea
                  placeholder="Describe your dish..."
                  value={form.description}
                  onChange={e => {
                    setForm({ ...form, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: "" });
                  }}
                  style={{
                    ...styles.textarea,
                    ...(errors.description ? styles.inputError : {})
                  }}
                  rows="3"
                />
                {errors.description && <span style={styles.errorText}>{errors.description}</span>}
              </div>

              {/* Checkbox Group */}
              <div style={styles.checkboxGroup}>
                {/* Veg/Non-Veg Toggle */}
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={e => setForm({ ...form, isVeg: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <div style={styles.checkboxContent}>
                    <div style={styles.checkboxIconWrapper}>
                      <svg style={styles.checkboxIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div style={styles.checkboxTitle}>Vegetarian</div>
                      <div style={styles.checkboxSubtext}>Mark this item as vegetarian</div>
                    </div>
                  </div>
                </label>

                {/* Best Seller Toggle */}
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.isBestSeller}
                    onChange={e => setForm({ ...form, isBestSeller: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <div style={styles.checkboxContent}>
                    <div style={styles.checkboxIconWrapper}>
                      <svg style={styles.checkboxIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <div style={styles.checkboxTitle}>Best Seller</div>
                      <div style={styles.checkboxSubtext}>Highlight as a popular item</div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={addItem}
                disabled={adding}
                style={{
                  ...styles.submitButton,
                  ...(adding ? styles.buttonDisabled : {})
                }}
              >
                {adding ? (
                  <>
                    <div style={styles.buttonSpinner}></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg style={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Menu
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Menu Items */}
        {menu.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No menu items yet</h3>
            <p style={styles.emptyText}>Start by adding your first dish to the menu</p>
          </div>
        ) : (
          <div style={styles.menuGrid}>
            {menu.map(item => (
              <div key={item._id} style={styles.menuCard}>
                {/* Item Image */}
                {item.image ? (
                  <div style={styles.menuItemImage}>
                    <img src={item.image} alt={item.name} style={styles.menuImage} />
                    {/* Badges Overlay */}
                    <div style={styles.badgeContainer}>
                      {item.isVeg && (
                        <div style={styles.vegBadge}>
                          <div style={styles.vegDot}></div>
                        </div>
                      )}
                      {item.isBestSeller && (
                        <div style={styles.bestSellerBadge}>
                          <svg style={styles.starIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={styles.menuItemImagePlaceholder}>
                    <svg style={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {/* Badges Overlay for placeholder */}
                    <div style={styles.badgeContainer}>
                      {item.isVeg && (
                        <div style={styles.vegBadge}>
                          <div style={styles.vegDot}></div>
                        </div>
                      )}
                      {item.isBestSeller && (
                        <div style={styles.bestSellerBadge}>
                          <svg style={styles.starIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div style={styles.menuCardContent}>
                  <div style={styles.menuInfo}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <p style={styles.itemDescription}>{item.description}</p>
                  </div>
                  <div style={styles.menuActions}>
                    <div style={styles.priceTag}>
                      <span style={styles.currency}>₹</span>
                      <span style={styles.price}>{item.price}</span>
                    </div>
                    <button
                      onClick={() => removeItem(item._id)}
                      style={styles.deleteButton}
                      title="Delete item"
                    >
                      <svg style={styles.deleteIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
  content: {
    maxWidth: "900px",
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  subtitle: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 2px 8px rgba(45, 55, 72, 0.2)"
  },
  addIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2.5
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    border: "2px solid #e9ecef"
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px"
  },
  formTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2d3748",
    margin: 0
  },
  closeButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "#f8f9fa",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  closeIcon: {
    width: "18px",
    height: "18px",
    color: "#6c757d",
    strokeWidth: 2
  },
  formBody: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  imageSection: {
    marginBottom: "8px"
  },
  uploadTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px"
  },
  uploadTab: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    border: "2px solid #e9ecef",
    borderRadius: "10px",
    backgroundColor: "white",
    color: "#6c757d",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  uploadTabActive: {
    backgroundColor: "#2d3748",
    color: "white",
    borderColor: "#2d3748"
  },
  tabIcon: {
    width: "18px",
    height: "18px",
    strokeWidth: 2
  },
  imageUploadArea: {
    minHeight: "200px",
    position: "relative"
  },
  uploadLabel: {
    display: "block",
    cursor: "pointer"
  },
  fileInput: {
    display: "none"
  },
  uploadPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    border: "2px dashed #e9ecef",
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    transition: "all 0.2s"
  },
  uploadIcon: {
    width: "48px",
    height: "48px",
    color: "#6c757d",
    strokeWidth: 1.5,
    marginBottom: "12px"
  },
  uploadText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  uploadSubtext: {
    fontSize: "13px",
    color: "#6c757d",
    margin: 0
  },
  urlInputContainer: {
    display: "flex",
    gap: "8px"
  },
  urlInput: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "#f8f9fa",
    color: "#2d3748"
  },
  previewUrlButton: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    backgroundColor: "#f8f9fa",
    border: "2px solid #e9ecef",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid #e9ecef"
  },
  imagePreview: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    display: "block"
  },
  removeImageButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "36px",
    height: "36px",
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  removeImageIcon: {
    width: "20px",
    height: "20px",
    color: "white",
    strokeWidth: 2.5
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column"
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
    padding: "12px 16px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "10px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "#f8f9fa",
    color: "#2d3748",
    boxSizing: "border-box"
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "10px",
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
  checkboxGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    backgroundColor: "#f8f9fa",
    padding: "16px",
    borderRadius: "12px",
    border: "2px solid #e9ecef"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    cursor: "pointer",
    padding: "12px",
    backgroundColor: "white",
    borderRadius: "10px",
    border: "2px solid #e9ecef",
    transition: "all 0.2s"
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    marginTop: "2px",
    accentColor: "#2d3748"
  },
  checkboxContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    flex: 1
  },
  checkboxIconWrapper: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxIcon: {
    width: "24px",
    height: "24px",
    color: "#6c757d",
    strokeWidth: 2
  },
  checkboxTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "2px"
  },
  checkboxSubtext: {
    fontSize: "13px",
    color: "#6c757d"
  },
  submitButton: {
    width: "100%",
    padding: "14px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#2d3748",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s",
    marginTop: "8px"
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
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
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
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px"
  },
  menuCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.2s",
    border: "1px solid #f1f3f5"
  },
  menuItemImage: {
    width: "100%",
    height: "180px",
    overflow: "hidden",
    position: "relative"
  },
  menuImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  menuItemImagePlaceholder: {
    width: "100%",
    height: "180px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  placeholderIcon: {
    width: "60px",
    height: "60px",
    color: "white",
    strokeWidth: 1.5
  },
  badgeContainer: {
    position: "absolute",
    top: "12px",
    left: "12px",
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  vegBadge: {
    width: "28px",
    height: "28px",
    backgroundColor: "white",
    borderRadius: "4px",
    border: "2px solid #10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  vegDot: {
    width: "12px",
    height: "12px",
    backgroundColor: "#10b981",
    borderRadius: "50%"
  },
  bestSellerBadge: {
    padding: "6px 10px",
    backgroundColor: "#fbbf24",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  starIcon: {
    width: "16px",
    height: "16px",
    color: "white"
  },
  menuCardContent: {
    padding: "20px"
  },
  menuInfo: {
    flex: 1,
    marginBottom: "16px"
  },
  itemName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0 0 8px 0"
  },
  itemDescription: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0,
    lineHeight: "1.5"
  },
  menuActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid #f1f3f5"
  },
  priceTag: {
    display: "flex",
    alignItems: "baseline",
    gap: "2px"
  },
  currency: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2d3748"
  },
  price: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3748"
  },
  deleteButton: {
    width: "40px",
    height: "40px",
    backgroundColor: "#fff5f5",
    border: "1px solid #fee",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  deleteIcon: {
    width: "20px",
    height: "20px",
    color: "#dc3545",
    strokeWidth: 2
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus, textarea:focus {
    border-color: #2d3748 !important;
    background-color: white !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  label:hover > div {
    border-color: #2d3748 !important;
    background-color: white !important;
  }
  
  button[style*="previewUrlButton"]:hover {
    background-color: #e9ecef !important;
    border-color: #2d3748 !important;
  }
  
  button[style*="removeImageButton"]:hover {
    background-color: rgba(220, 53, 69, 1) !important;
    transform: scale(1.1);
  }
  
  label[style*="checkboxLabel"]:hover {
    border-color: #2d3748 !important;
    background-color: #fafafa !important;
  }
`;
document.head.appendChild(styleSheet);