import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChefHat,
  MapPin,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

// ─── Notification helpers ──────────────────────────────────────────────────

/** Request browser notification permission */
async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

/** Show a browser push notification */
function showBrowserNotification(title, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;

  const notification = new Notification(title, {
    icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    badge: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    requireInteraction: true,       // stays until user dismisses
    renotify: true,
    tag: options.tag || "order-notification",
    silent: false,
    vibrate: [200, 100, 200],       // mobile vibration pattern
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
    if (options.url) window.location.href = options.url;
  };

  return notification;
}

/** Play a notification chime using Web Audio API */
function playNotificationSound(type = "new_order") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const patterns = {
      new_order: [
        { freq: 523.25, start: 0,    dur: 0.15 },
        { freq: 659.25, start: 0.15, dur: 0.15 },
        { freq: 783.99, start: 0.30, dur: 0.25 },
      ],
      status_update: [
        { freq: 440,    start: 0,    dur: 0.12 },
        { freq: 550,    start: 0.15, dur: 0.20 },
      ],
      cancelled: [
        { freq: 400,    start: 0,    dur: 0.20 },
        { freq: 300,    start: 0.22, dur: 0.25 },
      ],
    };

    const notes = patterns[type] || patterns.new_order;
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
}

// ─── Toast component ──────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div style={toastStyles.container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            ...toastStyles.toast,
            borderLeft: `4px solid ${t.color || "#10b981"}`,
            animation: "slideIn 0.3s ease",
          }}
        >
          <div style={toastStyles.icon}>{t.icon}</div>
          <div style={toastStyles.body}>
            <p style={toastStyles.title}>{t.title}</p>
            {t.message && <p style={toastStyles.message}>{t.message}</p>}
          </div>
          <button style={toastStyles.close} onClick={() => onDismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const toastStyles = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "360px",
    width: "calc(100vw - 40px)",
  },
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    backgroundColor: "white",
    borderRadius: "14px",
    padding: "14px 16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  },
  icon: { fontSize: "22px", flexShrink: 0, marginTop: "1px" },
  body: { flex: 1, minWidth: 0 },
  title: { margin: 0, fontSize: "14px", fontWeight: "700", color: "#1a202c" },
  message: { margin: "4px 0 0", fontSize: "13px", color: "#6c757d", lineHeight: "1.4" },
  close: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#6c757d",
    cursor: "pointer",
    padding: "0 2px",
    lineHeight: 1,
    flexShrink: 0,
  },
};

// ─── Status helpers ────────────────────────────────────────────────────────

const STATUS_META = {
  PLACED:           { color: "#3b82f6", text: "Order Placed",       icon: <Clock size={20} />,       toast: "🛒",  sound: "new_order"    },
  CONFIRMED:        { color: "#8b5cf6", text: "Confirmed",          icon: <CheckCircle size={20} />, toast: "✅",  sound: "status_update" },
  PREPARING:        { color: "#f59e0b", text: "Preparing",          icon: <ChefHat size={20} />,     toast: "👨‍🍳", sound: "status_update" },
  OUT_FOR_DELIVERY: { color: "#10b981", text: "Out for Delivery",   icon: <Truck size={20} />,       toast: "🚗",  sound: "status_update" },
  DELIVERED:        { color: "#059669", text: "Delivered",          icon: <Package size={20} />,     toast: "📦",  sound: "status_update" },
  CANCELLED:        { color: "#ef4444", text: "Cancelled",          icon: <XCircle size={20} />,     toast: "❌",  sound: "cancelled"     },
};

function getMeta(status) {
  return STATUS_META[status] || { color: "#6c757d", text: status, icon: <Clock size={20} />, toast: "🔔", sound: "new_order" };
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [filter, setFilter]                   = useState("ALL");
  const [toasts, setToasts]                   = useState([]);
  const [notifPermission, setNotifPermission] = useState(Notification?.permission || "default");
  const [soundEnabled, setSoundEnabled]       = useState(true);
  const [polling, setPolling]                 = useState(true);
  const [lastChecked, setLastChecked]         = useState(null);
  const [isOnline, setIsOnline]               = useState(navigator.onLine);

  // Ref to track known order IDs and statuses for diffing
  const knownOrders = useRef({}); // { orderId: status }
  const pollInterval = useRef(null);
  const toastCounter = useRef(0);

  // ── Toast helpers ──────────────────────────────────────────────────────

  const addToast = useCallback((title, message, color, icon) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, title, message, color, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Network status ─────────────────────────────────────────────────────

  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  addToast("Back online", "Syncing your orders…", "#10b981", "🌐"); };
    const onOffline = () => { setIsOnline(false); addToast("You're offline", "Orders won't refresh until reconnected.", "#ef4444", "📡"); };
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [addToast]);

  // ── Permission request on mount ────────────────────────────────────────

  useEffect(() => {
    requestNotificationPermission().then(setNotifPermission);
  }, []);

  // ── Fetch + diff logic ─────────────────────────────────────────────────

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await axios.get(
        "https://deliverybackend-0i61.onrender.com/api/orders/my-orders",
        { withCredentials: true }
      );

      if (response.data.success) {
        const newOrders = response.data.orders;
        setLastChecked(new Date());

        // Diff against known orders
        const prevSnapshot = knownOrders.current;
        const isFirstLoad  = Object.keys(prevSnapshot).length === 0;

        newOrders.forEach((order) => {
          const prevStatus = prevSnapshot[order._id];
          const currStatus = order.status;
          const meta       = getMeta(currStatus);
          const restName   = order.restaurant?.name || "your restaurant";

          if (!prevStatus && !isFirstLoad) {
            // Brand-new order arrived
            if (soundEnabled) playNotificationSound("new_order");
            showBrowserNotification("🛒 New Order Placed!", {
              body: `Order from ${restName} has been placed successfully.`,
              tag: `order-new-${order._id}`,
            });
            addToast(
              "New Order!",
              `Order from ${restName} confirmed.`,
              "#3b82f6",
              "🛒"
            );
          } else if (prevStatus && prevStatus !== currStatus) {
            // Status changed
            if (soundEnabled) playNotificationSound(meta.sound);

            const notifTitle = `${meta.toast} Order ${meta.text}`;
            const notifBody  = `Your order from ${restName} is now: ${meta.text}`;

            showBrowserNotification(notifTitle, {
              body: notifBody,
              tag: `order-status-${order._id}`,
              url: `/order/${order._id}`,
            });
            addToast(notifTitle, notifBody, meta.color, meta.toast);
          }

          // Update snapshot
          prevSnapshot[order._id] = currStatus;
        });

        knownOrders.current = prevSnapshot;
        setOrders(newOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) navigate("/login");
      if (!silent) addToast("Fetch failed", "Could not load orders. Retrying…", "#ef4444", "⚠️");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate, addToast, soundEnabled]);

  // Initial load
  useEffect(() => {
    fetchOrders(false);
  }, []);           // eslint-disable-line

  // Background polling every 30 seconds
  useEffect(() => {
    if (polling && isOnline) {
      pollInterval.current = setInterval(() => fetchOrders(true), 30_000);
    } else {
      clearInterval(pollInterval.current);
    }
    return () => clearInterval(pollInterval.current);
  }, [polling, isOnline, fetchOrders]);

  // ── Cancel order ───────────────────────────────────────────────────────

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const response = await axios.patch(
        `https://deliverybackend-0i61.onrender.com/api/orders/${orderId}/cancel`,
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        playNotificationSound("cancelled");
        showBrowserNotification("❌ Order Cancelled", { body: "Your order has been cancelled.", tag: `cancel-${orderId}` });
        addToast("Order Cancelled", "Your order was cancelled successfully.", "#ef4444", "❌");
        fetchOrders(true);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      addToast("Cancel failed", error.response?.data?.error || "Could not cancel order.", "#ef4444", "⚠️");
    }
  };

  // ── Permission button ──────────────────────────────────────────────────

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") addToast("Notifications enabled!", "You'll be notified of order updates.", "#10b981", "🔔");
    else if (perm === "denied") addToast("Notifications blocked", "Enable them in your browser settings.", "#ef4444", "🔕");
  };

  // ── Filtering ──────────────────────────────────────────────────────────

  const getFilteredOrders = () => {
    switch (filter) {
      case "ACTIVE":    return orders.filter((o) => ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(o.status));
      case "COMPLETED": return orders.filter((o) => o.status === "DELIVERED");
      case "CANCELLED": return orders.filter((o) => o.status === "CANCELLED");
      default:          return orders;
    }
  };

  const canCancelOrder = (status) => ["PLACED", "CONFIRMED"].includes(status);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffDays = Math.floor((Date.now() - date) / 86_400_000);
    if (diffDays === 0) return `Today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7)  return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading your orders…</p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <>
      {/* Toast stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div style={styles.container}>
        <div style={styles.content}>
          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>My Orders</h1>
              <p style={styles.subtitle}>Track and manage your food orders</p>
            </div>

            {/* Controls bar */}
            <div style={styles.controlsBar}>
              {/* Online indicator */}
              <div style={{ ...styles.pill, backgroundColor: isOnline ? "#d1fae5" : "#fee2e2", color: isOnline ? "#065f46" : "#991b1b" }}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{isOnline ? "Live" : "Offline"}</span>
              </div>

              {/* Last checked */}
              {lastChecked && (
                <div style={{ ...styles.pill, backgroundColor: "#f1f5f9", color: "#64748b" }}>
                  <RefreshCw size={13} />
                  <span>{lastChecked.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                </div>
              )}

              {/* Polling toggle */}
              <button
                style={{ ...styles.iconBtn, backgroundColor: polling ? "#dbeafe" : "#f1f5f9", color: polling ? "#1d4ed8" : "#6c757d" }}
                title={polling ? "Pause auto-refresh" : "Resume auto-refresh"}
                onClick={() => {
                  setPolling((p) => !p);
                  addToast(polling ? "Auto-refresh paused" : "Auto-refresh enabled", polling ? "Orders won't auto-update." : "Checking for new orders every 30s.", polling ? "#f59e0b" : "#10b981", polling ? "⏸️" : "▶️");
                }}
              >
                <RefreshCw size={16} style={{ animation: polling ? "spin 2s linear infinite" : "none" }} />
              </button>

              {/* Sound toggle */}
              <button
                style={{ ...styles.iconBtn, backgroundColor: soundEnabled ? "#fef9c3" : "#f1f5f9", color: soundEnabled ? "#a16207" : "#6c757d" }}
                title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                onClick={() => setSoundEnabled((s) => !s)}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Notification permission */}
              <button
                style={{ ...styles.iconBtn, backgroundColor: notifPermission === "granted" ? "#d1fae5" : "#fee2e2", color: notifPermission === "granted" ? "#065f46" : "#991b1b" }}
                title={notifPermission === "granted" ? "Browser notifications ON" : "Enable browser notifications"}
                onClick={handleEnableNotifications}
              >
                {notifPermission === "granted" ? <Bell size={16} /> : <BellOff size={16} />}
              </button>

              {/* Manual refresh */}
              <button style={{ ...styles.iconBtn, backgroundColor: "#f1f5f9", color: "#374151" }} title="Refresh now" onClick={() => fetchOrders(false)}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Notification permission banner */}
          {notifPermission !== "granted" && (
            <div style={styles.notifBanner}>
              <Bell size={18} />
              <span>Enable browser notifications to get real-time order updates even when you switch tabs.</span>
              <button style={styles.notifBannerBtn} onClick={handleEnableNotifications}>
                Enable
              </button>
              <button style={styles.notifBannerDismiss} onClick={() => setNotifPermission("dismissed")}>
                ×
              </button>
            </div>
          )}

          {/* Filter Tabs */}
          <div style={styles.filterTabs}>
            {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{ ...styles.filterTab, ...(filter === tab ? styles.filterTabActive : {}) }}
              >
                {tab === "ALL"       && `All Orders (${orders.length})`}
                {tab === "ACTIVE"    && `Active (${orders.filter((o) => ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)).length})`}
                {tab === "COMPLETED" && `Completed (${orders.filter((o) => o.status === "DELIVERED").length})`}
                {tab === "CANCELLED" && `Cancelled (${orders.filter((o) => o.status === "CANCELLED").length})`}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}><Package size={60} /></div>
              <h3 style={styles.emptyTitle}>
                {filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              </h3>
              <p style={styles.emptyText}>
                {filter === "ALL" ? "Start ordering from your favorite restaurants!" : `You don't have any ${filter.toLowerCase()} orders at the moment.`}
              </p>
              {filter === "ALL" && (
                <button onClick={() => navigate("/restaurants")} style={styles.exploreButton}>
                  Explore Restaurants
                </button>
              )}
            </div>
          ) : (
            <div style={styles.ordersList}>
              {filteredOrders.map((order) => {
                const meta = getMeta(order.status);
                return (
                  <div key={order._id} style={styles.orderCard}>
                    {/* Order Header */}
                    <div style={styles.orderHeader}>
                      <div style={styles.orderInfo}>
                        <div style={styles.restaurantInfo}>
                          <h3 style={styles.restaurantName}>{order.restaurant?.name || "Restaurant"}</h3>
                          {order.restaurant?.location?.address && (
                            <p style={styles.restaurantAddress}>
                              <MapPin size={14} />
                              {order.restaurant.location.address}
                            </p>
                          )}
                        </div>
                        <p style={styles.orderDate}>{formatDate(order.orderDate)}</p>
                      </div>

                      <div style={{ ...styles.statusBadge, backgroundColor: `${meta.color}15`, color: meta.color, borderColor: meta.color }}>
                        {meta.icon}
                        <span>{meta.text}</span>
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
                      <button onClick={() => navigate(`/restaurant/${order.restaurant._id}`)} style={styles.reorderButton}>
                        Order Again
                      </button>
                      {canCancelOrder(order.status) && (
                        <button onClick={() => cancelOrder(order._id)} style={styles.cancelButton}>
                          Cancel Order
                        </button>
                      )}
                      <button onClick={() => navigate(`/order/${order._id}`)} style={styles.detailsButton}>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    paddingBottom: "40px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  content:        { maxWidth: "1000px", margin: "0 auto", padding: "20px" },
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8f9fa" },
  spinner:        { width: "48px", height: "48px", border: "4px solid #e9ecef", borderTop: "4px solid #2d3748", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText:    { marginTop: "20px", color: "#6c757d", fontSize: "16px", fontWeight: "500" },
  header:         { marginBottom: "20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" },
  title:          { fontSize: "36px", fontWeight: "800", color: "#2d3748", margin: "0 0 8px 0", letterSpacing: "-0.5px" },
  subtitle:       { fontSize: "17px", color: "#6c757d", margin: 0, fontWeight: "500" },

  controlsBar: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" },
  pill: { display: "flex", alignItems: "center", gap: "5px", padding: "6px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  iconBtn: { display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "10px", border: "none", cursor: "pointer", transition: "all 0.2s ease" },

  notifBanner: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#fffbeb", border: "2px solid #fde68a",
    borderRadius: "12px", padding: "12px 16px", marginBottom: "20px",
    fontSize: "14px", color: "#92400e", flexWrap: "wrap",
  },
  notifBannerBtn: {
    marginLeft: "auto", backgroundColor: "#f59e0b", color: "white",
    border: "none", borderRadius: "8px", padding: "6px 14px",
    fontSize: "13px", fontWeight: "700", cursor: "pointer",
  },
  notifBannerDismiss: { background: "none", border: "none", fontSize: "20px", color: "#92400e", cursor: "pointer", padding: "0 4px" },

  filterTabs: { display: "flex", gap: "8px", marginBottom: "28px", backgroundColor: "white", padding: "8px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflowX: "auto" },
  filterTab: { flex: 1, minWidth: "fit-content", padding: "12px 20px", backgroundColor: "transparent", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", color: "#6c757d", cursor: "pointer", whiteSpace: "nowrap" },
  filterTabActive: { backgroundColor: "#2d3748", color: "white" },

  emptyState: { textAlign: "center", padding: "80px 20px", backgroundColor: "white", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  emptyIcon:  { width: "120px", height: "120px", margin: "0 auto 24px", backgroundColor: "#f8f9fa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c757d" },
  emptyTitle: { fontSize: "28px", fontWeight: "700", color: "#2d3748", margin: "0 0 12px 0" },
  emptyText:  { fontSize: "17px", color: "#6c757d", margin: "0 0 32px 0", lineHeight: "1.6" },
  exploreButton: { display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: "#2d3748", color: "white", border: "none", borderRadius: "14px", padding: "16px 40px", fontSize: "17px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 16px rgba(45,55,72,0.3)" },

  ordersList: { display: "flex", flexDirection: "column", gap: "20px" },
  orderCard:  { backgroundColor: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "2px solid transparent", transition: "all 0.3s ease" },
  orderHeader:{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "20px", borderBottom: "2px solid #f1f3f5" },
  orderInfo:  { flex: 1 },
  restaurantInfo: { marginBottom: "8px" },
  restaurantName: { fontSize: "20px", fontWeight: "700", color: "#2d3748", margin: "0 0 6px 0" },
  restaurantAddress: { display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#6c757d", margin: 0 },
  orderDate:  { fontSize: "14px", color: "#6c757d", margin: 0, fontWeight: "500" },
  statusBadge:{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", fontSize: "14px", fontWeight: "700", border: "2px solid", whiteSpace: "nowrap" },

  orderItems: { marginBottom: "20px" },
  itemsTitle: { fontSize: "16px", fontWeight: "700", color: "#2d3748", margin: "0 0 12px 0" },
  itemsList:  { display: "flex", flexDirection: "column", gap: "10px" },
  orderItem:  { display: "flex", alignItems: "center", gap: "12px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "10px" },
  itemImageSmall: { width: "50px", height: "50px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 },
  itemImage:  { width: "100%", height: "100%", objectFit: "cover" },
  itemDetails:{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: 0 },
  itemName:   { fontSize: "15px", fontWeight: "600", color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemQuantity:{ fontSize: "14px", fontWeight: "600", color: "#6c757d", flexShrink: 0 },
  itemPrice:  { fontSize: "15px", fontWeight: "700", color: "#2d3748", flexShrink: 0 },

  orderSummary:  { padding: "16px", backgroundColor: "#f8f9fa", borderRadius: "12px", marginBottom: "20px" },
  summaryRow:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  summaryLabel:  { fontSize: "14px", color: "#6c757d", fontWeight: "500" },
  summaryValue:  { fontSize: "14px", fontWeight: "600", color: "#2d3748" },
  summaryDivider:{ height: "1px", backgroundColor: "#dee2e6", margin: "12px 0" },
  totalLabel:    { fontSize: "17px", fontWeight: "700", color: "#2d3748" },
  totalValue:    { fontSize: "20px", fontWeight: "800", color: "#2d3748" },

  orderActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  reorderButton:{ flex: 1, minWidth: "140px", padding: "12px 20px", backgroundColor: "#2d3748", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  cancelButton: { flex: 1, minWidth: "140px", padding: "12px 20px", backgroundColor: "#fff5f5", color: "#dc3545", border: "2px solid #fee", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  detailsButton:{ flex: 1, minWidth: "140px", padding: "12px 20px", backgroundColor: "white", color: "#2d3748", border: "2px solid #e9ecef", borderRadius: "12px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
};

// ─── Global CSS ────────────────────────────────────────────────────────────

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to   { opacity: 0; transform: translateX(40px); }
  }

  button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important; }
  button:active:not(:disabled) { transform: translateY(0); }
  button:focus-visible { outline: 3px solid #667eea !important; outline-offset: 2px !important; }

  @media (max-width: 768px) {
    .orders-header { flex-direction: column !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;
document.head.appendChild(styleSheet);