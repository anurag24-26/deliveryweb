import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { calculateDistance } from "../utils/distance";
import { useAuth } from "../context/AuthContext";

// ─── Notification helpers ──────────────────────────────────────────────────

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

function showBrowserNotification(title, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return null;
  const n = new Notification(title, {
    icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    badge: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    requireInteraction: options.requireInteraction ?? false,
    renotify: true,
    tag: options.tag || "order-update",
    vibrate: [200, 100, 200],
    ...options,
  });
  n.onclick = () => { window.focus(); n.close(); if (options.url) window.location.href = options.url; };
  return n;
}

function playSound(type = "placed") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const patterns = {
      placed:      [{ freq: 523, start: 0, dur: 0.15 }, { freq: 659, start: 0.15, dur: 0.15 }, { freq: 784, start: 0.3, dur: 0.25 }],
      confirmed:   [{ freq: 440, start: 0, dur: 0.12 }, { freq: 550, start: 0.14, dur: 0.2  }],
      preparing:   [{ freq: 392, start: 0, dur: 0.1  }, { freq: 494, start: 0.12, dur: 0.1  }, { freq: 587, start: 0.24, dur: 0.2 }],
      out_delivery:[{ freq: 659, start: 0, dur: 0.1  }, { freq: 784, start: 0.12, dur: 0.1  }, { freq: 988, start: 0.24, dur: 0.3 }],
      delivered:   [{ freq: 523, start: 0, dur: 0.1  }, { freq: 659, start: 0.1,  dur: 0.1  }, { freq: 784, start: 0.2, dur: 0.1 }, { freq: 1047, start: 0.3, dur: 0.35 }],
      cancelled:   [{ freq: 400, start: 0, dur: 0.2  }, { freq: 300, start: 0.22, dur: 0.25 }],
    };
    (patterns[type] || patterns.placed).forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (e) { console.warn("Audio failed:", e); }
}

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PLACED:           { emoji: "🛒", label: "Order Placed",       color: "#3b82f6", bg: "#eff6ff", sound: "placed",       msg: "Your order has been placed! Waiting for restaurant confirmation." },
  CONFIRMED:        { emoji: "✅", label: "Order Confirmed",     color: "#8b5cf6", bg: "#f5f3ff", sound: "confirmed",    msg: "Great news! The restaurant has confirmed your order." },
  PREPARING:        { emoji: "👨‍🍳", label: "Being Prepared",    color: "#f59e0b", bg: "#fffbeb", sound: "preparing",   msg: "Your food is being freshly prepared right now." },
  OUT_FOR_DELIVERY: { emoji: "🚗", label: "Out for Delivery",   color: "#10b981", bg: "#ecfdf5", sound: "out_delivery", msg: "Your order is on the way! The delivery partner is heading to you." },
  DELIVERED:        { emoji: "📦", label: "Delivered!",          color: "#059669", bg: "#d1fae5", sound: "delivered",    msg: "Your order has been delivered. Enjoy your meal! 🎉" },
  CANCELLED:        { emoji: "❌", label: "Cancelled",           color: "#ef4444", bg: "#fef2f2", sound: "cancelled",    msg: "Your order has been cancelled." },
};

// ─── Toast component ───────────────────────────────────────────────────────

function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, maxWidth: 380, width: "calc(100vw - 40px)" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, backgroundColor: "white", borderRadius: 16, padding: "14px 16px", boxShadow: "0 12px 40px rgba(0,0,0,0.18)", borderLeft: `4px solid ${t.color || "#10b981"}`, animation: "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a202c" }}>{t.title}</p>
            {t.msg && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6c757d", lineHeight: 1.5 }}>{t.msg}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Order tracker banner ──────────────────────────────────────────────────

const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

function OrderTracker({ orderId, initialStatus, soundEnabled, onClose }) {
  const [status, setStatus] = useState(initialStatus);
  const [pulseStep, setPulseStep] = useState(false);
  const prevStatus = useRef(initialStatus);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`https://deliverybackend-0i61.onrender.com/api/orders/${orderId}`, { withCredentials: true });
      const newStatus = res.data?.order?.status || res.data?.status;
      if (newStatus && newStatus !== prevStatus.current) {
        const cfg = STATUS_CONFIG[newStatus];
        if (cfg) {
          if (soundEnabled) playSound(cfg.sound);
          showBrowserNotification(`${cfg.emoji} ${cfg.label}`, { body: cfg.msg, tag: `order-track-${orderId}`, requireInteraction: newStatus === "DELIVERED" || newStatus === "CANCELLED", url: `/orders` });
          setPulseStep(true);
          setTimeout(() => setPulseStep(false), 1200);
        }
        prevStatus.current = newStatus;
        setStatus(newStatus);
      }
    } catch (e) { console.warn("Status poll failed:", e); }
  }, [orderId, soundEnabled]);

  useEffect(() => {
    if (!orderId) return;
    pollRef.current = setInterval(fetchStatus, 15_000); // poll every 15s
    return () => clearInterval(pollRef.current);
  }, [fetchStatus, orderId]);

  // Stop polling on terminal states
  useEffect(() => {
    if (status === "DELIVERED" || status === "CANCELLED") {
      clearInterval(pollRef.current);
    }
  }, [status]);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLACED;
  const currentStep = STEPS.indexOf(status);
  const isCancelled = status === "CANCELLED";

  return (
    <div style={{ backgroundColor: cfg.bg, border: `2px solid ${cfg.color}30`, borderRadius: 20, padding: "20px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      {/* Animated glow */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 10% 50%, ${cfg.color}10, transparent 60%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>{cfg.emoji}</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: cfg.color }}>{cfg.label}</span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: cfg.color, animation: !isCancelled && status !== "DELIVERED" ? "pulse 1.5s ease-in-out infinite" : "none" }} />
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#4b5563", lineHeight: 1.5 }}>{cfg.msg}</p>
        </div>
        <button onClick={onClose} title="Dismiss tracker" style={{ background: "none", border: "none", fontSize: 20, color: "#9ca3af", cursor: "pointer", padding: "2px 6px", borderRadius: 8, flexShrink: 0 }}>×</button>
      </div>

      {/* Step progress bar */}
      {!isCancelled && (
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {STEPS.map((step, i) => {
            const sCfg = STATUS_CONFIG[step];
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <div
                  title={sCfg.label}
                  style={{
                    width: active ? 36 : 28,
                    height: active ? 36 : 28,
                    borderRadius: "50%",
                    backgroundColor: done ? cfg.color : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: active ? 16 : 13,
                    transition: "all 0.4s ease",
                    boxShadow: active ? `0 0 0 4px ${cfg.color}30` : "none",
                    animation: active && pulseStep ? "stepBounce 0.5s ease" : "none",
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                >
                  {done ? <span style={{ fontSize: active ? 16 : 12 }}>{sCfg.emoji}</span> : <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#d1d5db" }} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 4, backgroundColor: i < currentStep ? cfg.color : "#e5e7eb", borderRadius: 2, transition: "background-color 0.6s ease", margin: "0 4px" }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCancelled && (
        <div style={{ padding: "10px 16px", backgroundColor: "#fee2e2", borderRadius: 10, fontSize: 14, color: "#991b1b", fontWeight: 600 }}>
          ❌ This order was cancelled
        </div>
      )}

      <p style={{ margin: "12px 0 0", fontSize: 12, color: "#9ca3af" }}>
        Order ID: <code style={{ fontFamily: "monospace", color: "#6b7280" }}>{orderId}</code> · Updating every 15s
      </p>
    </div>
  );
}

// ─── Main Cart Component ───────────────────────────────────────────────────

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

  const [toasts, setToasts] = useState([]);
  const [notifPermission, setNotifPermission] = useState(Notification?.permission || "default");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrderStatus, setActiveOrderStatus] = useState(null);
  const [showTracker, setShowTracker] = useState(false);

  const toastId = useRef(0);

  // ── Toast ──────────────────────────────────────────────────────────────

  const addToast = useCallback((title, msg, color, icon, duration = 7000) => {
    const id = ++toastId.current;
    setToasts(p => [...p, { id, title, msg, color, icon }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  const dismissToast = id => setToasts(p => p.filter(t => t.id !== id));

  // ── Permission ─────────────────────────────────────────────────────────

  useEffect(() => { requestNotificationPermission().then(setNotifPermission); }, []);

  // ── Cart persistence ───────────────────────────────────────────────────

  useEffect(() => {
    const saved = localStorage.getItem(`cart_${restaurantId}`);
    if (saved) { try { setCart(JSON.parse(saved)); } catch { localStorage.removeItem(`cart_${restaurantId}`); } }
  }, [restaurantId]);

  useEffect(() => {
    if (Object.keys(cart).length > 0) localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cart));
    else localStorage.removeItem(`cart_${restaurantId}`);
  }, [cart, restaurantId]);

  // ── Fetch menu ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`https://deliverybackend-0i61.onrender.com/api/menu/${restaurantId}`);
        setMenuItems(res.data);
        if (res.data.length > 0 && res.data[0].restaurant) setRestaurantInfo(res.data[0].restaurant);
      } catch (e) { console.error("Error fetching menu:", e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [restaurantId]);

  // ── Distance ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.location?.lat || !user?.location?.lng) { setIsOutOfRange(true); return; }
    if (!restaurantInfo?.location?.lat || !restaurantInfo?.location?.lng) return;
    const d = calculateDistance(user.location.lat, user.location.lng, restaurantInfo.location.lat, restaurantInfo.location.lng);
    setDistance(d);
    setIsOutOfRange(d > 5);
  }, [restaurantInfo, user]);

  // ── Cart logic ─────────────────────────────────────────────────────────

  const updateQuantity = (id, qty) => {
    if (qty <= 0) { const c = { ...cart }; delete c[id]; setCart(c); }
    else setCart(p => ({ ...p, [id]: qty }));
  };

  const removeItem = id => { const c = { ...cart }; delete c[id]; setCart(c); };

  const clearCart = () => {
    if (window.confirm("Clear the cart?")) { setCart({}); localStorage.removeItem(`cart_${restaurantId}`); }
  };

  const getCartItems = () => Object.entries(cart).map(([id, qty]) => { const item = menuItems.find(m => m._id === id); return item ? { ...item, quantity: qty } : null; }).filter(Boolean);
  const getTotalItems = () => Object.values(cart).reduce((s, q) => s + q, 0);
  const getSubtotal = () => getCartItems().reduce((s, i) => s + i.price * i.quantity, 0);
  const getTaxes = () => getSubtotal() * 0.05;
  const getDeliveryFee = () => getSubtotal() > 0 ? 40 : 0;
  const getTotal = () => getSubtotal() + getTaxes() + getDeliveryFee();

  // ── Place order ────────────────────────────────────────────────────────

  const placeOrder = async () => {
    if (getTotalItems() === 0) { addToast("Cart is empty", "Add items before placing an order.", "#f59e0b", "🛒"); return; }
    if (isOutOfRange) { addToast("Out of delivery range", `Restaurant is ${distance?.toFixed(1)} km away. Max is 5 km.`, "#ef4444", "📍"); return; }

    setPlacingOrder(true);
    try {
      const orderData = {
        restaurantId,
        items: getCartItems().map(i => ({ menuItemId: i._id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        subtotal: getSubtotal(), taxes: getTaxes(), deliveryFee: getDeliveryFee(), total: getTotal(),
        deliveryAddress: user.location?.address || "Default Address",
      };

      const res = await axios.post("https://deliverybackend-0i61.onrender.com/api/orders", orderData, { withCredentials: true });

      if (res.data.success) {
        const orderId = res.data.order._id;

        // Clear cart
        setCart({});
        localStorage.removeItem(`cart_${restaurantId}`);

        // Request notifications
        const perm = await requestNotificationPermission();
        setNotifPermission(perm);

        // Play sound + show notifications
        if (soundEnabled) playSound("placed");
        showBrowserNotification("🛒 Order Placed!", { body: `Your order from ${restaurantInfo?.name || "the restaurant"} is confirmed!`, tag: `order-placed-${orderId}`, requireInteraction: true, url: `/orders` });
        addToast("Order Placed! 🎉", `Order #${orderId.slice(-6).toUpperCase()} confirmed. Tracking live updates below.`, "#3b82f6", "🛒", 10000);

        // Show live tracker
        setActiveOrderId(orderId);
        setActiveOrderStatus("PLACED");
        setShowTracker(true);
      }
    } catch (error) {
      console.error("Order error:", error);
      if (error.response?.status === 401) { addToast("Not logged in", "Please log in to place orders.", "#ef4444", "🔒"); navigate("/login"); }
      else addToast("Order failed", error.response?.data?.error || "Something went wrong. Please try again.", "#ef4444", "⚠️");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={S.loadingContainer}>
        <div style={S.spinner} />
        <p style={S.loadingText}>Loading cart…</p>
      </div>
    );
  }

  const cartItems = getCartItems();

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div style={S.container}>
        <div style={S.content}>

          {/* Header */}
          <div style={S.header}>
            <button onClick={() => navigate(-1)} style={S.backButton}>
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Menu
            </button>

            <div style={S.headerInfo}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <h1 style={S.title}>Your Cart</h1>
                {/* Sound + notification controls */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...S.ctrlBtn, backgroundColor: soundEnabled ? "#fef9c3" : "#f1f5f9", color: soundEnabled ? "#a16207" : "#6c757d" }}
                    title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                    onClick={() => setSoundEnabled(s => !s)}
                  >
                    {soundEnabled ? "🔊" : "🔇"}
                  </button>
                  <button
                    style={{ ...S.ctrlBtn, backgroundColor: notifPermission === "granted" ? "#d1fae5" : "#fee2e2", color: notifPermission === "granted" ? "#065f46" : "#991b1b" }}
                    title={notifPermission === "granted" ? "Notifications ON" : "Enable notifications"}
                    onClick={async () => { const p = await requestNotificationPermission(); setNotifPermission(p); if (p === "granted") addToast("Notifications enabled!", "You'll get live order updates.", "#10b981", "🔔"); else addToast("Blocked", "Enable notifications in browser settings.", "#ef4444", "🔕"); }}
                  >
                    {notifPermission === "granted" ? "🔔" : "🔕"}
                  </button>
                </div>
              </div>
              {restaurantInfo && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <p style={S.subtitle}>🏪 {restaurantInfo.name}</p>
                  {distance !== null && (
                    <p style={{ ...S.distanceInfo, color: isOutOfRange ? "#ef4444" : "#10b981" }}>
                      📍 {distance.toFixed(1)} km away {isOutOfRange && "— Out of delivery range"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <button onClick={clearCart} style={S.clearButton}>🗑 Clear Cart</button>
            )}
          </div>

          {/* Notification permission banner */}
          {notifPermission !== "granted" && notifPermission !== "dismissed" && (
            <div style={S.notifBanner}>
              <span>🔔</span>
              <span style={{ flex: 1 }}>Enable browser notifications to get <strong>real-time order updates</strong> — even when this tab is in the background.</span>
              <button style={S.notifBannerBtn} onClick={async () => { const p = await requestNotificationPermission(); setNotifPermission(p); }}>Enable</button>
              <button style={{ background: "none", border: "none", fontSize: 20, color: "#92400e", cursor: "pointer" }} onClick={() => setNotifPermission("dismissed")}>×</button>
            </div>
          )}

          {/* Live order tracker */}
          {showTracker && activeOrderId && (
            <OrderTracker
              orderId={activeOrderId}
              initialStatus={activeOrderStatus}
              soundEnabled={soundEnabled}
              onClose={() => setShowTracker(false)}
            />
          )}

          {/* Out of range warning */}
          {isOutOfRange && cartItems.length > 0 && (
            <div style={S.warningBanner}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div>
                <strong style={{ display: "block", fontSize: 15, color: "#991b1b", marginBottom: 4 }}>Delivery Unavailable</strong>
                <p style={{ margin: 0, fontSize: 14, color: "#991b1b", lineHeight: 1.5 }}>
                  This restaurant is {distance?.toFixed(1)} km away. We only deliver within 5 km.
                </p>
              </div>
            </div>
          )}

          {/* Cart body */}
          {cartItems.length === 0 && !showTracker ? (
            <div style={S.emptyCart}>
              <div style={S.emptyIcon}>
                <svg style={{ width: 60, height: 60, color: "#6c757d" }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 style={S.emptyTitle}>Your cart is empty</h3>
              <p style={S.emptyText}>Add items from the menu to get started</p>
              <button onClick={() => navigate(`/restaurant/${restaurantId}`)} style={S.browseButton}>Browse Menu</button>
            </div>
          ) : cartItems.length > 0 ? (
            <div style={S.cartLayout}>
              {/* Items */}
              <div style={S.itemsSection}>
                <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "3px solid #f1f3f5" }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2d3748", margin: 0 }}>Items ({getTotalItems()})</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {cartItems.map(item => (
                    <div key={item._id} style={S.cartItem}>
                      {/* Image */}
                      <div style={S.itemImageContainer}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg style={{ width: 48, height: 48, color: "white" }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                        }
                        {(item.isVeg || item.isBestSeller) && (
                          <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
                            {item.isVeg && <div style={{ width: 24, height: 24, backgroundColor: "white", borderRadius: 4, border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}><div style={{ width: 10, height: 10, backgroundColor: "#10b981", borderRadius: "50%" }} /></div>}
                            {item.isBestSeller && <span style={{ fontSize: 18 }}>⭐</span>}
                          </div>
                        )}
                      </div>
                      {/* Details */}
                      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2d3748", margin: "0 0 6px" }}>{item.name}</h3>
                        <p style={{ fontSize: 14, color: "#6c757d", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#6c757d" }}>₹{item.price}</span>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "white", borderRadius: 10, padding: 6, border: "2px solid #e9ecef" }}>
                          <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={S.qBtn}>
                            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                          </button>
                          <span style={{ fontSize: 17, fontWeight: 700, color: "#2d3748", minWidth: 28, textAlign: "center" }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={S.qBtn}>
                            <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#2d3748" }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeItem(item._id)} style={S.removeBtn} title="Remove">
                          <svg style={{ width: 18, height: 18, color: "#dc3545" }} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div style={{ position: "sticky", top: 20 }}>
                <div style={S.summaryCard}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2d3748", margin: "0 0 24px", paddingBottom: 20, borderBottom: "3px solid #f1f3f5" }}>Order Summary</h2>
                  {[["Subtotal", getSubtotal()], ["Taxes (5%)", getTaxes()], ["Delivery Fee", getDeliveryFee()]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ fontSize: 16, color: "#6c757d", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#2d3748" }}>₹{val.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ height: 2, backgroundColor: "#e9ecef", margin: "20px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#2d3748" }}>Total</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#2d3748" }}>₹{getTotal().toFixed(2)}</span>
                  </div>

                  <button
                    onClick={placeOrder}
                    disabled={placingOrder || isOutOfRange}
                    style={{ ...S.checkoutBtn, ...(placingOrder || isOutOfRange ? { opacity: 0.6, cursor: "not-allowed", backgroundColor: "#6c757d" } : {}) }}
                  >
                    {placingOrder ? <><div style={S.btnSpinner} />Placing Order…</> : isOutOfRange ? "❌ Out of Range" : "✅ Place Order"}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", backgroundColor: "#f0f0ff", borderRadius: 12, border: "2px solid #e0e0ff", marginTop: 4 }}>
                    <span>ℹ️</span>
                    <span style={{ fontSize: 13, color: "#667eea", lineHeight: 1.5, fontWeight: 500 }}>
                      {isOutOfRange ? "Outside delivery range (5 km max)" : "You'll get live status updates after placing your order"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const S = {
  container:      { minHeight: "100vh", backgroundColor: "#f8f9fa", paddingBottom: 40, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  content:        { maxWidth: 1200, margin: "0 auto", padding: 20 },
  loadingContainer:{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "#f8f9fa" },
  spinner:        { width: 48, height: 48, border: "4px solid #e9ecef", borderTop: "4px solid #2d3748", borderRadius: "50%", animation: "spin 1s linear infinite" },
  loadingText:    { marginTop: 20, color: "#6c757d", fontSize: 16, fontWeight: 500 },
  header:         { marginBottom: 32 },
  backButton:     { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "white", border: "2px solid #e9ecef", borderRadius: 12, padding: "12px 20px", fontSize: 15, fontWeight: 600, color: "#2d3748", cursor: "pointer", marginBottom: 20 },
  headerInfo:     { marginBottom: 16 },
  title:          { fontSize: 36, fontWeight: 800, color: "#2d3748", margin: "0 0 12px", letterSpacing: "-0.5px" },
  subtitle:       { fontSize: 17, color: "#6c757d", margin: 0, fontWeight: 500 },
  distanceInfo:   { fontSize: 16, fontWeight: 600, margin: 0 },
  ctrlBtn:        { display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 18 },
  clearButton:    { display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff5f5", border: "2px solid #fee", borderRadius: 12, padding: "12px 20px", fontSize: 15, fontWeight: 600, color: "#dc3545", cursor: "pointer" },
  notifBanner:    { display: "flex", alignItems: "center", gap: 10, backgroundColor: "#fffbeb", border: "2px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#92400e", flexWrap: "wrap" },
  notifBannerBtn: { backgroundColor: "#f59e0b", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  warningBanner:  { display: "flex", alignItems: "flex-start", gap: 12, backgroundColor: "#fef2f2", border: "2px solid #fecaca", borderRadius: 12, padding: 16, marginBottom: 24 },
  emptyCart:      { textAlign: "center", padding: "100px 20px", backgroundColor: "white", borderRadius: 20, boxShadow: "0 4px 20px rgba(0,0,0,.08)" },
  emptyIcon:      { width: 120, height: 120, margin: "0 auto 32px", backgroundColor: "#f8f9fa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle:     { fontSize: 28, fontWeight: 700, color: "#2d3748", margin: "0 0 12px" },
  emptyText:      { fontSize: 17, color: "#6c757d", margin: "0 0 32px", lineHeight: 1.6 },
  browseButton:   { display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "#2d3748", color: "white", border: "none", borderRadius: 14, padding: "16px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer" },
  cartLayout:     { display: "grid", gridTemplateColumns: "1fr 420px", gap: 28, alignItems: "start" },
  itemsSection:   { backgroundColor: "white", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,.08)" },
  cartItem:       { display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 20, padding: 20, backgroundColor: "#f8f9fa", borderRadius: 16, border: "2px solid #e9ecef" },
  itemImageContainer: { width: 120, height: 120, borderRadius: 12, overflow: "hidden", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,.1)" },
  qBtn:           { width: 32, height: 32, backgroundColor: "#f8f9fa", border: "none", borderRadius: 8, color: "#2d3748", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  removeBtn:      { width: 36, height: 36, backgroundColor: "#fff5f5", border: "2px solid #fee", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  summaryCard:    { backgroundColor: "white", borderRadius: 20, padding: 28, boxShadow: "0 4px 20px rgba(0,0,0,.08)" },
  checkoutBtn:    { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#2d3748", color: "white", border: "none", borderRadius: 14, padding: "18px 24px", fontSize: 18, fontWeight: 700, cursor: "pointer", marginBottom: 20, boxShadow: "0 4px 16px rgba(45,55,72,.3)" },
  btnSpinner:     { width: 20, height: 20, border: "3px solid rgba(255,255,255,.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

// ─── Global CSS ────────────────────────────────────────────────────────────

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin       { to { transform: rotate(360deg); } }
  @keyframes pulse      { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.6; transform:scale(1.5); } }
  @keyframes stepBounce { 0% { transform:scale(1); } 40% { transform:scale(1.4); } 70% { transform:scale(.9); } 100% { transform:scale(1); } }
  @keyframes toastIn    { from { opacity:0; transform:translateX(40px) scale(.95); } to { opacity:1; transform:translateX(0) scale(1); } }

  button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.15) !important; }
  button:active:not(:disabled) { transform: translateY(0); }
  button:focus-visible { outline: 3px solid #667eea !important; outline-offset: 2px !important; }

  @media (max-width: 1024px) {
    div[style*="cartLayout"] { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    div[style*="cartItem"] { grid-template-columns: 100px 1fr !important; }
    div[style*="itemImageContainer"] { width: 100px !important; height: 100px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;
document.head.appendChild(styleSheet);