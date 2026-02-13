import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { calculateDistance } from "../utils/distance";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [cart, setCart] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [distance, setDistance] = useState(null);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${restaurantId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart:", error);
        localStorage.removeItem(`cart_${restaurantId}`);
      }
    }
  }, [restaurantId]);

  // Fetch menu items and restaurant info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuResponse = await axios.get(`http://localhost:5000/api/menu/${restaurantId}`);
        setMenuItems(menuResponse.data);
        
        // Extract restaurant info from first menu item
        if (menuResponse.data.length > 0 && menuResponse.data[0].restaurant) {
          setRestaurantInfo(menuResponse.data[0].restaurant);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId]);

  // Calculate distance
  useEffect(() => {
    // Check if user has location set
    if (!user?.location?.lat || !user?.location?.lng) {
      console.log("User location not set");
      setIsOutOfRange(true);
      return;
    }

    // Check if menu is loaded and has restaurant data
    if (!restaurantInfo?.location) {
      console.log("Restaurant location not available");
      return;
    }

    const userLoc = user.location;
    const restLoc = restaurantInfo.location;

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
  }, [restaurantInfo, user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
    } else {
      localStorage.removeItem(`cart_${restaurantId}`);
    }
  }, [cart, restaurantId]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[itemId];
      setCart(newCart);
    } else {
      setCart(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };

  const removeItem = (itemId) => {
    const newCart = { ...cart };
    delete newCart[itemId];
    setCart(newCart);
  };

  const clearCart = () => {
    if (window.confirm("Are you sure you want to clear the cart?")) {
      setCart({});
      localStorage.removeItem(`cart_${restaurantId}`);
    }
  };

  const getCartItems = () => {
    return Object.entries(cart)
      .map(([itemId, quantity]) => {
        const item = menuItems.find(m => m._id === itemId);
        return item ? { ...item, quantity } : null;
      })
      .filter(Boolean);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getSubtotal = () => {
    return getCartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTaxes = () => {
    return getSubtotal() * 0.05; // 5% tax
  };

  const getDeliveryFee = () => {
    return getSubtotal() > 0 ? 40 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTaxes() + getDeliveryFee();
  };

  const placeOrder = async () => {
    if (getTotalItems() === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Check if restaurant is out of range
    if (isOutOfRange) {
      alert(`Sorry, this restaurant is ${distance?.toFixed(1)} km away. We only deliver within 5 km.`);
      return;
    }

    setPlacingOrder(true);
    try {
      // Prepare order data
      const orderData = {
        restaurantId: restaurantId,
        items: getCartItems().map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal: getSubtotal(),
        taxes: getTaxes(),
        deliveryFee: getDeliveryFee(),
        total: getTotal(),
        deliveryAddress: user.location?.address || "Default Address"
      };

      // Send order to backend
      const response = await axios.post('http://localhost:5000/api/orders', orderData, {
        withCredentials: true
      });

      if (response.data.success) {
        // Clear cart after successful order
        setCart({});
        localStorage.removeItem(`cart_${restaurantId}`);

        // Show success message
        alert(`Order placed successfully! Order ID: ${response.data.order._id}`);
        
        // Navigate to orders page
        navigate('/orders');
      }

    } catch (error) {
      console.error("Error placing order:", error);
      if (error.response?.status === 401) {
        alert("Please log in to place an order.");
        navigate('/login');
      } else {
        alert(error.response?.data?.error || "Failed to place order. Please try again.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading cart...</p>
      </div>
    );
  }

  const cartItems = getCartItems();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <svg style={styles.backIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Menu
          </button>
          
          <div style={styles.headerInfo}>
            <h1 style={styles.title}>Your Cart</h1>
            {restaurantInfo && (
              <div style={styles.restaurantInfoContainer}>
                <p style={styles.subtitle}>
                  <svg style={styles.restaurantIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {restaurantInfo.name}
                </p>
                {distance !== null && (
                  <p style={{
                    ...styles.distanceInfo,
                    ...(isOutOfRange ? styles.distanceOutOfRange : styles.distanceInRange)
                  }}>
                    <svg style={styles.distanceIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {distance.toFixed(1)} km away
                    {isOutOfRange && " - Out of delivery range"}
                  </p>
                )}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <button onClick={clearCart} style={styles.clearButton}>
              <svg style={styles.trashIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          )}
        </div>

        {/* Distance Warning Banner */}
        {isOutOfRange && cartItems.length > 0 && (
          <div style={styles.warningBanner}>
            <svg style={styles.warningIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div style={styles.warningContent}>
              <strong style={styles.warningTitle}>Delivery Unavailable</strong>
              <p style={styles.warningText}>
                This restaurant is {distance.toFixed(1)} km away. We only deliver within 5 km. 
                You can browse the menu but cannot place an order at this time.
              </p>
            </div>
          </div>
        )}

        {/* Cart Content */}
        {cartItems.length === 0 ? (
          <div style={styles.emptyCart}>
            <div style={styles.emptyIcon}>
              <svg style={styles.emptyIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>Your cart is empty</h3>
            <p style={styles.emptyText}>Add items from the menu to get started</p>
            <button 
              onClick={() => navigate(`/restaurant/${restaurantId}`)} 
              style={styles.browseButton}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div style={styles.cartLayout}>
            {/* Cart Items */}
            <div style={styles.itemsSection}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Items ({getTotalItems()})</h2>
              </div>

              <div style={styles.itemsList}>
                {cartItems.map(item => (
                  <div key={item._id} style={styles.cartItem}>
                    {/* Item Image */}
                    <div style={styles.itemImageContainer}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={styles.itemImage} />
                      ) : (
                        <div style={styles.itemImagePlaceholder}>
                          <svg style={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Badges */}
                      {(item.isVeg || item.isBestSeller) && (
                        <div style={styles.itemBadges}>
                          {item.isVeg && (
                            <div style={styles.vegBadgeSmall}>
                              <div style={styles.vegDotSmall}></div>
                            </div>
                          )}
                          {item.isBestSeller && (
                            <svg style={styles.starBadgeSmall} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div style={styles.itemDetails}>
                      <h3 style={styles.itemName}>{item.name}</h3>
                      <p style={styles.itemDescription}>{item.description}</p>
                      <div style={styles.itemPrice}>₹{item.price}</div>
                    </div>

                    {/* Quantity Controls */}
                    <div style={styles.itemActions}>
                      <div style={styles.quantityControl}>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          style={styles.quantityButton}
                        >
                          <svg style={styles.quantityIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                        <span style={styles.quantity}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          style={styles.quantityButton}
                        >
                          <svg style={styles.quantityIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>

                      <div style={styles.itemTotal}>₹{(item.price * item.quantity).toFixed(2)}</div>

                      <button
                        onClick={() => removeItem(item._id)}
                        style={styles.removeButton}
                        title="Remove item"
                      >
                        <svg style={styles.removeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div style={styles.summarySection}>
              <div style={styles.summaryCard}>
                <h2 style={styles.summaryTitle}>Order Summary</h2>

                <div style={styles.summaryDetails}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Subtotal</span>
                    <span style={styles.summaryValue}>₹{getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Taxes (5%)</span>
                    <span style={styles.summaryValue}>₹{getTaxes().toFixed(2)}</span>
                  </div>
                  
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Delivery Fee</span>
                    <span style={styles.summaryValue}>₹{getDeliveryFee().toFixed(2)}</span>
                  </div>

                  <div style={styles.divider}></div>

                  <div style={styles.summaryRow}>
                    <span style={styles.totalLabel}>Total</span>
                    <span style={styles.totalValue}>₹{getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={placingOrder || isOutOfRange}
                  style={{
                    ...styles.checkoutButton,
                    ...((placingOrder || isOutOfRange) ? styles.buttonDisabled : {})
                  }}
                  title={isOutOfRange ? "Restaurant is out of delivery range" : "Place your order"}
                >
                  {placingOrder ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      Placing Order...
                    </>
                  ) : isOutOfRange ? (
                    <>
                      <svg style={styles.checkoutIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Out of Range
                    </>
                  ) : (
                    <>
                      <svg style={styles.checkoutIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Place Order
                    </>
                  )}
                </button>

                {/* Info Note */}
                <div style={styles.infoNote}>
                  <svg style={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={styles.infoText}>
                    {isOutOfRange 
                      ? "This restaurant is outside our delivery range (5 km)"
                      : "Your cart is saved locally for this restaurant"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// [Previous styles object remains exactly the same]
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    paddingBottom: "40px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
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
    width: "48px",
    height: "48px",
    border: "4px solid #e9ecef",
    borderTop: "4px solid #2d3748",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "20px",
    color: "#6c757d",
    fontSize: "16px",
    fontWeight: "500"
  },
  header: {
    marginBottom: "32px"
  },
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "white",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  backIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2.5
  },
  headerInfo: {
    marginBottom: "16px"
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#2d3748",
    margin: "0 0 12px 0",
    letterSpacing: "-0.5px"
  },
  restaurantInfoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  subtitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "17px",
    color: "#6c757d",
    margin: 0,
    fontWeight: "500"
  },
  restaurantIcon: {
    width: "22px",
    height: "22px",
    strokeWidth: 2,
    color: "#667eea"
  },
  distanceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "16px",
    fontWeight: "600",
    margin: 0
  },
  distanceIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2
  },
  distanceInRange: {
    color: "#10b981"
  },
  distanceOutOfRange: {
    color: "#ef4444"
  },
  warningBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    backgroundColor: "#fef2f2",
    border: "2px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px"
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
    fontSize: "16px",
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
  clearButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#fff5f5",
    border: "2px solid #fee",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#dc3545",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(220,53,69,0.1)"
  },
  trashIcon: {
    width: "20px",
    height: "20px",
    strokeWidth: 2.5
  },
  emptyCart: {
    textAlign: "center",
    padding: "100px 20px",
    backgroundColor: "white",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },
  emptyIcon: {
    width: "120px",
    height: "120px",
    margin: "0 auto 32px",
    backgroundColor: "#f8f9fa",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  emptyIconSvg: {
    width: "60px",
    height: "60px",
    color: "#6c757d",
    strokeWidth: 2
  },
  emptyTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 12px 0",
    letterSpacing: "-0.3px"
  },
  emptyText: {
    fontSize: "17px",
    color: "#6c757d",
    margin: "0 0 32px 0",
    lineHeight: "1.6"
  },
  browseButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "16px 40px",
    fontSize: "17px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(45,55,72,0.3)"
  },
  cartLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 420px",
    gap: "28px",
    alignItems: "start"
  },
  itemsSection: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },
  sectionHeader: {
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: "3px solid #f1f3f5"
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3748",
    margin: 0,
    letterSpacing: "-0.3px"
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  cartItem: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#f8f9fa",
    borderRadius: "16px",
    border: "2px solid #e9ecef",
    transition: "all 0.3s ease"
  },
  itemImageContainer: {
    width: "120px",
    height: "120px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
  },
  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  placeholderIcon: {
    width: "48px",
    height: "48px",
    color: "white",
    strokeWidth: 1.5
  },
  itemBadges: {
    position: "absolute",
    top: "8px",
    left: "8px",
    display: "flex",
    gap: "6px",
    flexWrap: "wrap"
  },
  vegBadgeSmall: {
    width: "24px",
    height: "24px",
    backgroundColor: "white",
    borderRadius: "4px",
    border: "2px solid #10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
  },
  vegDotSmall: {
    width: "10px",
    height: "10px",
    backgroundColor: "#10b981",
    borderRadius: "50%"
  },
  starBadgeSmall: {
    width: "24px",
    height: "24px",
    color: "#fbbf24",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
  },
  itemDetails: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0
  },
  itemName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 6px 0",
    lineHeight: "1.3"
  },
  itemDescription: {
    fontSize: "14px",
    color: "#6c757d",
    margin: "0 0 10px 0",
    lineHeight: "1.5",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  },
  itemPrice: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#6c757d"
  },
  itemActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "12px",
    minWidth: "max-content"
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "6px",
    border: "2px solid #e9ecef",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
  },
  quantityButton: {
    width: "32px",
    height: "32px",
    backgroundColor: "#f8f9fa",
    border: "none",
    borderRadius: "8px",
    color: "#2d3748",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  quantityIcon: {
    width: "16px",
    height: "16px",
    strokeWidth: 3
  },
  quantity: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#2d3748",
    minWidth: "28px",
    textAlign: "center"
  },
  itemTotal: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2d3748"
  },
  removeButton: {
    width: "36px",
    height: "36px",
    backgroundColor: "#fff5f5",
    border: "2px solid #fee",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  removeIcon: {
    width: "18px",
    height: "18px",
    color: "#dc3545",
    strokeWidth: 2.5
  },
  summarySection: {
    position: "sticky",
    top: "20px"
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },
  summaryTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 24px 0",
    paddingBottom: "20px",
    borderBottom: "3px solid #f1f3f5",
    letterSpacing: "-0.3px"
  },
  summaryDetails: {
    marginBottom: "28px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  },
  summaryLabel: {
    fontSize: "16px",
    color: "#6c757d",
    fontWeight: "500"
  },
  summaryValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2d3748"
  },
  divider: {
    height: "2px",
    backgroundColor: "#e9ecef",
    margin: "20px 0"
  },
  totalLabel: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2d3748"
  },
  totalValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#2d3748",
    letterSpacing: "-0.5px"
  },
  checkoutButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "18px 24px",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginBottom: "20px",
    boxShadow: "0 4px 16px rgba(45,55,72,0.3)"
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    backgroundColor: "#6c757d"
  },
  checkoutIcon: {
    width: "22px",
    height: "22px",
    strokeWidth: 3
  },
  buttonSpinner: {
    width: "20px",
    height: "20px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  infoNote: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    backgroundColor: "#f0f0ff",
    borderRadius: "12px",
    border: "2px solid #e0e0ff"
  },
  infoIcon: {
    width: "20px",
    height: "20px",
    color: "#667eea",
    strokeWidth: 2.5,
    flexShrink: 0
  },
  infoText: {
    fontSize: "14px",
    color: "#667eea",
    lineHeight: "1.5",
    fontWeight: "500"
  }
};

// [Previous stylesheet remains the same - omitted for brevity but should be included]
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  }
  
  div[style*="cartItem"]:hover {
    border-color: #2d3748 !important;
    box-shadow: 0 6px 24px rgba(0,0,0,0.12) !important;
    transform: translateY(-2px);
  }
  
  button[style*="backButton"]:hover {
    background-color: #f8f9fa !important;
    border-color: #2d3748 !important;
  }
  
  button[style*="clearButton"]:hover {
    background-color: #fee !important;
    border-color: #dc3545 !important;
    transform: translateY(-2px);
  }
  
  button[style*="browseButton"]:hover {
    background-color: #1a202c !important;
    transform: translateY(-3px) scale(1.02);
  }
  
  button[style*="quantityButton"]:hover {
    background-color: #2d3748 !important;
    color: white !important;
  }
  
  button[style*="removeButton"]:hover {
    background-color: #dc3545 !important;
    border-color: #dc3545 !important;
  }
  
  button[style*="removeButton"]:hover svg {
    color: white !important;
  }
  
  button[style*="checkoutButton"]:hover:not(:disabled) {
    background-color: #1a202c !important;
    transform: translateY(-3px);
  }
  
  div[style*="itemImageContainer"]:hover img {
    transform: scale(1.05);
    transition: transform 0.3s ease;
  }
  
  img {
    transition: transform 0.3s ease;
  }
  
  * {
    transition-property: background-color, border-color, color, box-shadow, transform;
    transition-duration: 0.2s;
    transition-timing-function: ease;
  }
  
  @media (max-width: 1024px) {
    div[style*="cartLayout"] {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
    
    div[style*="summarySection"] {
      position: static !important;
      order: -1;
    }
    
    div[style*="summaryCard"] {
      position: sticky !important;
      top: 20px !important;
      z-index: 10;
    }
    
    div[style*="title"] {
      font-size: 32px !important;
    }
    
    div[style*="emptyCart"] {
      padding: 60px 20px !important;
    }
  }
  
  @media (max-width: 768px) {
    div[style*="content"] {
      padding: 16px !important;
    }
    
    div[style*="title"] {
      font-size: 28px !important;
    }
    
    div[style*="subtitle"] {
      font-size: 15px !important;
    }
    
    div[style*="restaurantInfoContainer"] {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
    
    div[style*="itemsSection"],
    div[style*="summaryCard"] {
      padding: 20px !important;
      border-radius: 16px !important;
    }
    
    div[style*="sectionTitle"],
    div[style*="summaryTitle"] {
      font-size: 20px !important;
    }
    
    div[style*="cartItem"] {
      grid-template-columns: 100px 1fr !important;
      gap: 16px !important;
      padding: 16px !important;
    }
    
    div[style*="itemImageContainer"] {
      width: 100px !important;
      height: 100px !important;
    }
    
    div[style*="itemActions"] {
      grid-column: 1 / -1 !important;
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-top: 12px !important;
      padding-top: 12px !important;
      border-top: 2px solid #e9ecef !important;
    }
    
    div[style*="itemTotal"] {
      font-size: 18px !important;
    }
    
    div[style*="totalValue"] {
      font-size: 24px !important;
    }
    
    button[style*="checkoutButton"] {
      padding: 16px 20px !important;
      font-size: 16px !important;
    }
  }
  
  @media (max-width: 640px) {
    div[style*="header"] {
      margin-bottom: 24px !important;
    }
    
    div[style*="title"] {
      font-size: 24px !important;
    }
    
    div[style*="backButton"],
    div[style*="clearButton"] {
      padding: 10px 16px !important;
      font-size: 14px !important;
    }
    
    div[style*="cartItem"] {
      grid-template-columns: 80px 1fr !important;
      gap: 12px !important;
      padding: 14px !important;
    }
    
    div[style*="itemImageContainer"] {
      width: 80px !important;
      height: 80px !important;
    }
    
    div[style*="itemName"] {
      font-size: 16px !important;
    }
    
    div[style*="itemDescription"] {
      font-size: 13px !important;
    }
    
    div[style*="quantityControl"] {
      gap: 8px !important;
      padding: 4px !important;
    }
    
    button[style*="quantityButton"] {
      width: 28px !important;
      height: 28px !important;
    }
    
    div[style*="quantity"] {
      font-size: 15px !important;
      min-width: 24px !important;
    }
    
    div[style*="summaryRow"] {
      margin-bottom: 12px !important;
    }
    
    div[style*="summaryLabel"],
    div[style*="summaryValue"] {
      font-size: 14px !important;
    }
    
    div[style*="totalLabel"] {
      font-size: 18px !important;
    }
    
    div[style*="totalValue"] {
      font-size: 22px !important;
    }
    
    div[style*="emptyCart"] {
      padding: 40px 16px !important;
    }
    
    div[style*="emptyIcon"] {
      width: 100px !important;
      height: 100px !important;
    }
    
    div[style*="emptyIconSvg"] {
      width: 50px !important;
      height: 50px !important;
    }
    
    div[style*="emptyTitle"] {
      font-size: 24px !important;
    }
    
    div[style*="emptyText"] {
      font-size: 15px !important;
    }
    
    button[style*="browseButton"] {
      padding: 14px 32px !important;
      font-size: 16px !important;
    }
  }
  
  @media (max-width: 480px) {
    div[style*="content"] {
      padding: 12px !important;
    }
    
    div[style*="title"] {
      font-size: 22px !important;
    }
    
    div[style*="itemsSection"],
    div[style*="summaryCard"] {
      padding: 16px !important;
    }
    
    div[style*="sectionTitle"],
    div[style*="summaryTitle"] {
      font-size: 18px !important;
    }
    
    div[style*="cartItem"] {
      padding: 12px !important;
    }
    
    div[style*="itemBadges"] {
      top: 6px !important;
      left: 6px !important;
      gap: 4px !important;
    }
    
    div[style*="vegBadgeSmall"],
    svg[style*="starBadgeSmall"] {
      width: 20px !important;
      height: 20px !important;
    }
    
    button[style*="checkoutButton"] {
      padding: 14px 16px !important;
      font-size: 15px !important;
    }
    
    div[style*="infoNote"] {
      padding: 12px !important;
    }
    
    div[style*="infoText"] {
      font-size: 13px !important;
    }
  }
  
  button:focus-visible,
  input:focus-visible {
    outline: 3px solid #667eea !important;
    outline-offset: 2px !important;
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(styleSheet);