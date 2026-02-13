import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  ChefHat,
  MapPin
} from "lucide-react";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders/my-orders', {
        withCredentials: true
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const response = await axios.patch(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        alert("Order cancelled successfully");
        fetchOrders(); // Refresh orders
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.error || "Failed to cancel order");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED':
        return <Clock size={20} />;
      case 'CONFIRMED':
        return <CheckCircle size={20} />;
      case 'PREPARING':
        return <ChefHat size={20} />;
      case 'OUT_FOR_DELIVERY':
        return <Truck size={20} />;
      case 'DELIVERED':
        return <Package size={20} />;
      case 'CANCELLED':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
        return '#3b82f6';
      case 'CONFIRMED':
        return '#8b5cf6';
      case 'PREPARING':
        return '#f59e0b';
      case 'OUT_FOR_DELIVERY':
        return '#10b981';
      case 'DELIVERED':
        return '#059669';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PLACED':
        return 'Order Placed';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PREPARING':
        return 'Preparing';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const canCancelOrder = (status) => {
    return ['PLACED', 'CONFIRMED'].includes(status);
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'ACTIVE':
        return orders.filter(order => 
          ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(order.status)
        );
      case 'COMPLETED':
        return orders.filter(order => order.status === 'DELIVERED');
      case 'CANCELLED':
        return orders.filter(order => order.status === 'CANCELLED');
      default:
        return orders;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your orders...</p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Orders</h1>
            <p style={styles.subtitle}>Track and manage your food orders</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                ...styles.filterTab,
                ...(filter === tab ? styles.filterTabActive : {})
              }}
            >
              {tab === 'ALL' && `All Orders (${orders.length})`}
              {tab === 'ACTIVE' && `Active (${orders.filter(o => 
                ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)
              ).length})`}
              {tab === 'COMPLETED' && `Completed (${orders.filter(o => o.status === 'DELIVERED').length})`}
              {tab === 'CANCELLED' && `Cancelled (${orders.filter(o => o.status === 'CANCELLED').length})`}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Package size={60} />
            </div>
            <h3 style={styles.emptyTitle}>
              {filter === 'ALL' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </h3>
            <p style={styles.emptyText}>
              {filter === 'ALL' 
                ? "Start ordering from your favorite restaurants!"
                : `You don't have any ${filter.toLowerCase()} orders at the moment.`
              }
            </p>
            {filter === 'ALL' && (
              <button 
                onClick={() => navigate('/restaurants')} 
                style={styles.exploreButton}
              >
                Explore Restaurants
              </button>
            )}
          </div>
        ) : (
          <div style={styles.ordersList}>
            {filteredOrders.map(order => (
              <div key={order._id} style={styles.orderCard}>
                {/* Order Header */}
                <div style={styles.orderHeader}>
                  <div style={styles.orderInfo}>
                    <div style={styles.restaurantInfo}>
                      <h3 style={styles.restaurantName}>
                        {order.restaurant?.name || 'Restaurant'}
                      </h3>
                      {order.restaurant?.location?.address && (
                        <p style={styles.restaurantAddress}>
                          <MapPin size={14} />
                          {order.restaurant.location.address}
                        </p>
                      )}
                    </div>
                    <p style={styles.orderDate}>{formatDate(order.orderDate)}</p>
                  </div>

                  <div 
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: `${getStatusColor(order.status)}15`,
                      color: getStatusColor(order.status),
                      borderColor: getStatusColor(order.status)
                    }}
                  >
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div style={styles.orderItems}>
                  <h4 style={styles.itemsTitle}>Items ({order.items.length})</h4>
                  <div style={styles.itemsList}>
                    {order.items.map((item, index) => (
                      <div key={index} style={styles.orderItem}>
                        {item.image && (
                          <div style={styles.itemImageSmall}>
                            <img src={item.image} alt={item.name} style={styles.itemImage} />
                          </div>
                        )}
                        <div style={styles.itemDetails}>
                          <span style={styles.itemName}>{item.name}</span>
                          <span style={styles.itemQuantity}>x{item.quantity}</span>
                        </div>
                        <span style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div style={styles.orderSummary}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Subtotal</span>
                    <span style={styles.summaryValue}>₹{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Taxes</span>
                    <span style={styles.summaryValue}>₹{order.taxes.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Delivery Fee</span>
                    <span style={styles.summaryValue}>₹{order.deliveryFee.toFixed(2)}</span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryRow}>
                    <span style={styles.totalLabel}>Total</span>
                    <span style={styles.totalValue}>₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Order Actions */}
                <div style={styles.orderActions}>
                  <button
                    onClick={() => navigate(`/restaurant/${order.restaurant._id}`)}
                    style={styles.reorderButton}
                  >
                    Order Again
                  </button>
                  
                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => cancelOrder(order._id)}
                      style={styles.cancelButton}
                    >
                      Cancel Order
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/order/${order._id}`)}
                    style={styles.detailsButton}
                  >
                    View Details
                  </button>
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
    paddingBottom: "40px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  },
  content: {
    maxWidth: "1000px",
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
    marginBottom: "28px"
  },
  title: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#2d3748",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    fontSize: "17px",
    color: "#6c757d",
    margin: 0,
    fontWeight: "500"
  },
  filterTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "28px",
    backgroundColor: "white",
    padding: "8px",
    borderRadius: "14px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    overflowX: "auto"
  },
  filterTab: {
    flex: 1,
    minWidth: "fit-content",
    padding: "12px 20px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#6c757d",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap"
  },
  filterTabActive: {
    backgroundColor: "#2d3748",
    color: "white"
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    backgroundColor: "white",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
  },
  emptyIcon: {
    width: "120px",
    height: "120px",
    margin: "0 auto 24px",
    backgroundColor: "#f8f9fa",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6c757d"
  },
  emptyTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 12px 0"
  },
  emptyText: {
    fontSize: "17px",
    color: "#6c757d",
    margin: "0 0 32px 0",
    lineHeight: "1.6"
  },
  exploreButton: {
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
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    border: "2px solid transparent"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "2px solid #f1f3f5"
  },
  orderInfo: {
    flex: 1
  },
  restaurantInfo: {
    marginBottom: "8px"
  },
  restaurantName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 6px 0"
  },
  restaurantAddress: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    color: "#6c757d",
    margin: 0
  },
  orderDate: {
    fontSize: "14px",
    color: "#6c757d",
    margin: 0,
    fontWeight: "500"
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    border: "2px solid",
    whiteSpace: "nowrap"
  },
  orderItems: {
    marginBottom: "20px"
  },
  itemsTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0 0 12px 0"
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  orderItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px"
  },
  itemImageSmall: {
    width: "50px",
    height: "50px",
    borderRadius: "8px",
    overflow: "hidden",
    flexShrink: 0
  },
  itemImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  itemDetails: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0
  },
  itemName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#2d3748",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  itemQuantity: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6c757d",
    flexShrink: 0
  },
  itemPrice: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#2d3748",
    flexShrink: 0
  },
  orderSummary: {
    padding: "16px",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    marginBottom: "20px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#6c757d",
    fontWeight: "500"
  },
  summaryValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748"
  },
  summaryDivider: {
    height: "1px",
    backgroundColor: "#dee2e6",
    margin: "12px 0"
  },
  totalLabel: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#2d3748"
  },
  totalValue: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#2d3748"
  },
  orderActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  reorderButton: {
    flex: 1,
    minWidth: "140px",
    padding: "12px 20px",
    backgroundColor: "#2d3748",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  cancelButton: {
    flex: 1,
    minWidth: "140px",
    padding: "12px 20px",
    backgroundColor: "#fff5f5",
    color: "#dc3545",
    border: "2px solid #fee",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  detailsButton: {
    flex: 1,
    minWidth: "140px",
    padding: "12px 20px",
    backgroundColor: "white",
    color: "#2d3748",
    border: "2px solid #e9ecef",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

// Enhanced CSS with animations and responsive design
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Hover effects */
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  div[style*="orderCard"]:hover {
    border-color: #2d3748 !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
    transform: translateY(-2px);
  }

  button[style*="filterTab"]:hover {
    background-color: #f8f9fa !important;
  }

  button[style*="filterTabActive"]:hover {
    background-color: #1a202c !important;
  }

  button[style*="exploreButton"]:hover {
    background-color: #1a202c !important;
    transform: translateY(-3px) scale(1.02);
  }

  button[style*="reorderButton"]:hover {
    background-color: #1a202c !important;
  }

  button[style*="cancelButton"]:hover {
    background-color: #fee !important;
    border-color: #dc3545 !important;
  }

  button[style*="detailsButton"]:hover {
    background-color: #f8f9fa !important;
    border-color: #2d3748 !important;
  }

  /* Responsive styles */
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

    div[style*="filterTabs"] {
      padding: 6px !important;
    }

    button[style*="filterTab"] {
      padding: 10px 16px !important;
      font-size: 14px !important;
    }

    div[style*="orderCard"] {
      padding: 20px !important;
    }

    div[style*="orderHeader"] {
      flex-direction: column !important;
      gap: 12px !important;
    }

    div[style*="statusBadge"] {
      align-self: flex-start !important;
    }

    div[style*="restaurantName"] {
      font-size: 18px !important;
    }

    div[style*="orderActions"] {
      flex-direction: column !important;
    }

    button[style*="reorderButton"],
    button[style*="cancelButton"],
    button[style*="detailsButton"] {
      width: 100% !important;
      min-width: 100% !important;
    }
  }

  @media (max-width: 640px) {
    div[style*="title"] {
      font-size: 24px !important;
    }

    div[style*="filterTab"] {
      padding: 8px 12px !important;
      font-size: 13px !important;
    }

    div[style*="orderCard"] {
      padding: 16px !important;
    }

    div[style*="itemImageSmall"] {
      width: 40px !important;
      height: 40px !important;
    }

    div[style*="itemName"] {
      font-size: 14px !important;
    }

    div[style*="itemQuantity"],
    div[style*="itemPrice"] {
      font-size: 13px !important;
    }

    div[style*="emptyState"] {
      padding: 60px 20px !important;
    }

    div[style*="emptyIcon"] {
      width: 100px !important;
      height: 100px !important;
    }

    div[style*="emptyTitle"] {
      font-size: 24px !important;
    }

    div[style*="emptyText"] {
      font-size: 15px !important;
    }

    button[style*="exploreButton"] {
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

    div[style*="orderCard"] {
      padding: 14px !important;
    }

    div[style*="restaurantName"] {
      font-size: 16px !important;
    }

    div[style*="statusBadge"] {
      padding: 8px 12px !important;
      font-size: 12px !important;
    }
  }

  /* Focus styles for accessibility */
  button:focus-visible {
    outline: 3px solid #667eea !important;
    outline-offset: 2px !important;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
document.head.appendChild(styleSheet);