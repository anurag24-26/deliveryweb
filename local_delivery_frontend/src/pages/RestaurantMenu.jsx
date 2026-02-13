import { useEffect, useState } from "react";
import { getMenu } from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import { calculateDistance } from "../utils/distance";
import { useAuth } from "../context/AuthContext";

export default function RestaurantMenu() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");
  const [cart, setCart] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterBestSeller, setFilterBestSeller] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [distance, setDistance] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${id}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart:", error);
        localStorage.removeItem(`cart_${id}`);
      }
    }
  }, [id]);

 useEffect(() => {
  getMenu(id)
    .then(res => {
      console.log("🔍 API Response:", res.data[0]?.restaurant);

      setMenu(res.data);

      if (res.data.length > 0 && res.data[0].restaurant) {
        setRestaurantName(res.data[0].restaurant.name || "Restaurant");
      }

      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
}, [id]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem(`cart_${id}`, JSON.stringify(cart));
    } else {
      localStorage.removeItem(`cart_${id}`);
    }
  }, [cart, id]);

  // Calculate distance - CORRECTED VERSION
  useEffect(() => {
    // Check if user has location set
    if (!user?.location?.lat || !user?.location?.lng) {
      console.log("User location not set");
      setIsOutOfRange(true); // Consider out of range if user hasn't set location
      return;
    }

    // Check if menu is loaded and has restaurant data
    if (menu.length === 0 || !menu[0]?.restaurant?.location) {
      console.log("Restaurant location not available");
      return;
    }

    const userLoc = user.location;
    const restLoc = menu[0].restaurant.location;

    // Validate that we have all required coordinates
    if (!restLoc.lat || !restLoc.lng) {
      console.log("Restaurant coordinates incomplete");
      return;
    }

    const d = calculateDistance(
      userLoc.lat,
      userLoc.lng,
      restLoc.lat,
      restLoc.lng
    );

    console.log("Distance calculated:", d, "km");
    setDistance(d);
    setIsOutOfRange(d > 5);
  }, [menu, user]);

  const categories = ["All", ...new Set(menu.map(item => item.category).filter(Boolean))];
  
  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesVeg = !filterVeg || item.isVeg === true;
    const matchesBestSeller = !filterBestSeller || item.isBestSeller === true;
    
    return matchesSearch && matchesCategory && matchesVeg && matchesBestSeller;
  });

  const addToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
      const item = menu.find(m => m._id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  const hasVegItems = menu.some(item => item.isVeg);
  const hasBestSellerItems = menu.some(item => item.isBestSeller);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading delicious menu...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <svg style={styles.backIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>{restaurantName || "Menu"}</h1>
            <div style={styles.subtitleContainer}>
              <p style={styles.subtitle}>{menu.length} items available</p>
              {distance !== null && (
                <>
                  <span style={styles.subtitleDot}>•</span>
                  <p style={{
                    ...styles.subtitle,
                    ...(isOutOfRange ? styles.distanceOutOfRange : styles.distanceInRange)
                  }}>
                    {distance.toFixed(1)} km away
                    {isOutOfRange && " (Out of delivery range)"}
                  </p>
                </>
              )}
              {!user?.location && (
                <>
                  <span style={styles.subtitleDot}>•</span>
                  <p style={styles.noLocationWarning}>
                    Please set your delivery location
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Distance Warning Banner */}
          {isOutOfRange && (
            <div style={styles.warningBanner}>
              <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div style={styles.warningContent}>
                <strong style={styles.warningTitle}>
                  {!user?.location ? "Location Not Set" : "Delivery Unavailable"}
                </strong>
                <p style={styles.warningText}>
                  {!user?.location 
                    ? "Please set your delivery location in your profile to check delivery availability."
                    : `This restaurant is ${distance.toFixed(1)} km away. We only deliver within 5 km.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearButton}>
              <svg style={styles.clearIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={styles.filterSection}>
          {/* Category Filter */}
          {categories.length > 1 && (
            <div style={styles.categoryContainer}>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    ...styles.categoryButton,
                    ...(selectedCategory === category ? styles.categoryButtonActive : {})
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Veg & Best Seller Filters */}
          <div style={styles.quickFilters}>
            {hasVegItems && (
              <button
                onClick={() => setFilterVeg(!filterVeg)}
                style={{
                  ...styles.filterButton,
                  ...(filterVeg ? styles.filterButtonActive : {})
                }}
              >
                <div style={styles.vegIndicator}>
                  <div style={styles.vegDotSmall}></div>
                </div>
                Veg Only
              </button>
            )}
            
            {hasBestSellerItems && (
              <button
                onClick={() => setFilterBestSeller(!filterBestSeller)}
                style={{
                  ...styles.filterButton,
                  ...(filterBestSeller ? styles.filterButtonActive : {})
                }}
              >
                <svg style={styles.starIconSmall} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Best Sellers
              </button>
            )}
          </div>
        </div>

        {/* Menu Items */}
        {filteredMenu.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No items found</h3>
            <p style={styles.emptyText}>
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search.`
                : "This menu doesn't have any items matching your filters."}
            </p>
            {(filterVeg || filterBestSeller) && (
              <button
                onClick={() => {
                  setFilterVeg(false);
                  setFilterBestSeller(false);
                }}
                style={styles.clearFiltersButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.menuGrid}>
            {filteredMenu.map(item => {
              const quantity = cart[item._id] || 0;
              
              return (
                <div key={item._id} style={styles.menuCard}>
                  {/* Item Image */}
                  <div style={styles.menuImage}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={styles.itemImageImg}
                      />
                    ) : (
                      <div style={styles.noImagePlaceholder}>
                        <svg style={styles.noImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Badges Overlay */}
                    <div style={styles.badgeContainer}>
                      {item.isVeg && (
                        <div style={styles.vegBadge} title="Vegetarian">
                          <div style={styles.vegDot}></div>
                        </div>
                      )}
                      {item.isBestSeller && (
                        <div style={styles.bestSellerBadge} title="Best Seller">
                          <svg style={styles.starIcon} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div style={styles.itemContent}>
                    <div style={styles.itemHeader}>
                      <div style={styles.itemTitleRow}>
                        <h3 style={styles.itemName}>{item.name}</h3>
                        {/* Inline badges for small screens */}
                        <div style={styles.inlineBadges}>
                          {item.isVeg && (
                            <div style={styles.vegBadgeInline} title="Vegetarian">
                              <div style={styles.vegDotInline}></div>
                            </div>
                          )}
                          {item.isBestSeller && (
                            <svg style={styles.starIconInline} viewBox="0 0 24 24" fill="currentColor" title="Best Seller">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      {item.category && (
                        <span style={styles.categoryBadge}>{item.category}</span>
                      )}
                    </div>

                    <p style={styles.itemDescription}>{item.description}</p>

                    <div style={styles.itemFooter}>
                      <div style={styles.priceContainer}>
                        <span style={styles.currency}>₹</span>
                        <span style={styles.price}>{item.price}</span>
                      </div>

                      {/* Add to Cart Controls */}
                      {quantity === 0 ? (
                        <button
                          disabled={isOutOfRange}
                          onClick={() => addToCart(item._id)}
                          style={{
                            ...styles.addButton,
                            ...(isOutOfRange && styles.disabledButton)
                          }}
                          title={isOutOfRange ? "Restaurant is out of delivery range or location not set" : "Add to cart"}
                        >
                          {isOutOfRange ? "Out of Range" : "Add"}
                        </button>
                      ) : (
                        <div style={styles.quantityControl}>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            style={styles.quantityButton}
                          >
                            <svg style={styles.quantityIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span style={styles.quantity}>{quantity}</span>
                          <button
                            onClick={() => addToCart(item._id)}
                            style={styles.quantityButton}
                          >
                            <svg style={styles.quantityIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Cart Button */}
        {getTotalItems() > 0 && !isOutOfRange && (
          <div style={styles.floatingCart}>
            <div style={styles.cartInfo}>
              <div style={styles.cartItems}>
                <svg style={styles.cartIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span style={styles.cartCount}>{getTotalItems()} items</span>
              </div>
              <div style={styles.cartTotal}>₹{getTotalPrice()}</div>
            </div>
            <button 
              onClick={() => navigate(`/cart/${id}`)}
              style={styles.checkoutButton}
            >
              <span>View Cart</span>
              <svg style={styles.checkoutIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
    paddingBottom: "100px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px"
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
    marginBottom: "24px"
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "white",
    border: "1px solid #e9ecef",
    borderRadius: "10px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "16px"
  },
  backIcon: {
    width: "18px",
    height: "18px",
    strokeWidth: 2
  },
  headerInfo: {
    marginBottom: "8px"
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 4px 0"
  },
  subtitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap"
  },
  subtitle: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  subtitleDot: {
    color: "#6c757d",
    fontSize: "14px"
  },
  distanceInRange: {
    color: "#10b981",
    fontWeight: "600"
  },
  distanceOutOfRange: {
    color: "#ef4444",
    fontWeight: "600"
  },
  noLocationWarning: {
    fontSize: "14px",
    color: "#f59e0b",
    fontWeight: "600",
    margin: 0
  },
  warningBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px"
  },
  warningIcon: {
    width: "24px",
    height: "24px",
    color: "#ef4444",
    strokeWidth: 2,
    flexShrink: 0,
    marginTop: "2px"
  },
  warningContent: {
    flex: 1
  },
  warningTitle: {
    display: "block",
    fontSize: "15px",
    fontWeight: "700",
    color: "#991b1b",
    marginBottom: "4px"
  },
  warningText: {
    fontSize: "14px",
    color: "#991b1b",
    margin: 0,
    lineHeight: "1.5"
  },
  searchContainer: {
    position: "relative",
    marginBottom: "20px"
  },
  searchIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "20px",
    height: "20px",
    color: "#6c757d",
    strokeWidth: 2,
    pointerEvents: "none"
  },
  searchInput: {
    width: "100%",
    padding: "14px 48px",
    fontSize: "15px",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    outline: "none",
    transition: "all 0.2s",
    backgroundColor: "white",
    color: "#2d3748",
    boxSizing: "border-box"
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
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
  clearIcon: {
    width: "16px",
    height: "16px",
    color: "#6c757d",
    strokeWidth: 2
  },
  filterSection: {
    marginBottom: "24px"
  },
  categoryContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    overflowX: "auto",
    paddingBottom: "8px"
  },
  categoryButton: {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    border: "2px solid #e9ecef",
    borderRadius: "20px",
    backgroundColor: "white",
    color: "#6c757d",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  },
  categoryButtonActive: {
    backgroundColor: "#2d3748",
    color: "white",
    borderColor: "#2d3748"
  },
  quickFilters: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  filterButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    border: "2px solid #e9ecef",
    borderRadius: "20px",
    backgroundColor: "white",
    color: "#6c757d",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  filterButtonActive: {
    backgroundColor: "#2d3748",
    color: "white",
    borderColor: "#2d3748"
  },
  vegIndicator: {
    width: "18px",
    height: "18px",
    border: "2px solid currentColor",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  vegDotSmall: {
    width: "8px",
    height: "8px",
    backgroundColor: "currentColor",
    borderRadius: "50%"
  },
  starIconSmall: {
    width: "16px",
    height: "16px"
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
    margin: "0 0 16px 0"
  },
  clearFiltersButton: {
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px"
  },
  menuCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.2s",
    border: "1px solid #f1f3f5"
  },
  menuImage: {
    width: "100%",
    height: "180px",
    position: "relative",
    overflow: "hidden"
  },
  itemImageImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block"
  },
  noImagePlaceholder: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  noImageIcon: {
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
  itemContent: {
    padding: "20px"
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "8px"
  },
  itemTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1
  },
  itemName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2d3748",
    margin: 0,
    flex: 1
  },
  inlineBadges: {
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },
  vegBadgeInline: {
    width: "20px",
    height: "20px",
    border: "2px solid #10b981",
    borderRadius: "3px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  vegDotInline: {
    width: "8px",
    height: "8px",
    backgroundColor: "#10b981",
    borderRadius: "50%"
  },
  starIconInline: {
    width: "20px",
    height: "20px",
    color: "#fbbf24"
  },
  categoryBadge: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#667eea",
    backgroundColor: "#f0f0ff",
    padding: "4px 10px",
    borderRadius: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap"
  },
  itemDescription: {
    fontSize: "14px",
    color: "#6c757d",
    margin: "0 0 16px 0",
    lineHeight: "1.6"
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid #f1f3f5"
  },
  priceContainer: {
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
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  disabledButton: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
    cursor: "not-allowed",
    opacity: 0.7
  },
  addIcon: {
    width: "18px",
    height: "18px",
    strokeWidth: 2.5
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#2d3748",
    borderRadius: "10px",
    padding: "6px"
  },
  quantityButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s"
  },
  quantityIcon: {
    width: "16px",
    height: "16px",
    strokeWidth: 2.5
  },
  quantity: {
    fontSize: "16px",
    fontWeight: "700",
    color: "white",
    minWidth: "24px",
    textAlign: "center"
  },
  floatingCart: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "1160px",
    width: "calc(100% - 40px)",
    backgroundColor: "#2d3748",
    borderRadius: "16px",
    padding: "16px 20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000
  },
  cartInfo: {
    display: "flex",
    alignItems: "center",
    gap: "24px"
  },
  cartItems: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "white"
  },
  cartIcon: {
    width: "24px",
    height: "24px",
    strokeWidth: 2
  },
  cartCount: {
    fontSize: "15px",
    fontWeight: "600"
  },
  cartTotal: {
    fontSize: "20px",
    fontWeight: "700",
    color: "white"
  },
  checkoutButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "white",
    color: "#2d3748",
    border: "none",
    borderRadius: "10px",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  checkoutIcon: {
    width: "18px",
    height: "18px",
    strokeWidth: 2.5
  }
};

// Add CSS animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  input:focus {
    border-color: #2d3748 !important;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  div[style*="menuCard"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
  }
  
  button[style*="addButton"]:hover:not(:disabled) {
    background-color: #1a202c !important;
  }
  
  button[style*="quantityButton"]:hover {
    background-color: rgba(255,255,255,0.15) !important;
  }
  
  button[style*="checkoutButton"]:hover {
    background-color: #f8f9fa !important;
  }
  
  button[style*="backButton"]:hover {
    background-color: #f8f9fa !important;
  }
  
  button[style*="clearButton"]:hover {
    background-color: #e9ecef !important;
  }
  
  button[style*="clearFiltersButton"]:hover {
    background-color: #1a202c !important;
  }
  
  button[style*="filterButton"]:hover:not([style*="filterButtonActive"]) {
    background-color: #f8f9fa !important;
    border-color: #2d3748 !important;
  }
  
  @media (max-width: 768px) {
    div[style*="menuGrid"] {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);