import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Package, Clock, CheckCircle, XCircle, Truck, ChefHat,
  MapPin, Bell, BellOff, Volume2, VolumeX, RefreshCw, Wifi, WifiOff,
} from "lucide-react";

// ─── Audio ─────────────────────────────────────────────────────────────────
// Single shared AudioContext – avoids browser autoplay blocks
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx || _audioCtx.state === "closed")
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

const SOUND_PATTERNS = {
  new_order:     [{ f:523,t:0 },{ f:659,t:0.15 },{ f:784,t:0.30 }],
  confirmed:     [{ f:440,t:0 },{ f:550,t:0.15 }],
  preparing:     [{ f:392,t:0 },{ f:494,t:0.12 },{ f:587,t:0.24 }],
  out_delivery:  [{ f:659,t:0 },{ f:784,t:0.12 },{ f:988,t:0.24 }],
  delivered:     [{ f:523,t:0 },{ f:659,t:0.10 },{ f:784,t:0.20 },{ f:1047,t:0.30 }],
  cancelled:     [{ f:400,t:0 },{ f:300,t:0.22 }],
  status_update: [{ f:440,t:0 },{ f:550,t:0.15 }],
};

function playSound(type) {
  try {
    const ctx   = getAudioCtx();
    const notes = SOUND_PATTERNS[type] || SOUND_PATTERNS.status_update;
    notes.forEach(({ f, t }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.30);
    });
  } catch (e) { console.warn("Audio error:", e); }
}

// ─── Browser notifications ─────────────────────────────────────────────────
async function requestPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

function pushNotif(title, body, tag, url) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon:  "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    badge: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    tag, renotify: true, requireInteraction: false,
    vibrate: [200, 100, 200],
  });
  n.onclick = () => { window.focus(); n.close(); if (url) window.location.href = url; };
}

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS = {
  PLACED:           { color:"#3b82f6", label:"Order Placed",     emoji:"🛒",  sound:"new_order",    icon:<Clock size={18}/> },
  CONFIRMED:        { color:"#8b5cf6", label:"Confirmed",        emoji:"✅",  sound:"confirmed",    icon:<CheckCircle size={18}/> },
  PREPARING:        { color:"#f59e0b", label:"Preparing",        emoji:"👨‍🍳", sound:"preparing",   icon:<ChefHat size={18}/> },
  OUT_FOR_DELIVERY: { color:"#10b981", label:"Out for Delivery", emoji:"🚗",  sound:"out_delivery", icon:<Truck size={18}/> },
  DELIVERED:        { color:"#059669", label:"Delivered",        emoji:"📦",  sound:"delivered",    icon:<Package size={18}/> },
  CANCELLED:        { color:"#ef4444", label:"Cancelled",        emoji:"❌",  sound:"cancelled",    icon:<XCircle size={18}/> },
};
const cfg = (key) => STATUS[key] || { color:"#6c757d", label:key, emoji:"🔔", sound:"status_update", icon:<Clock size={18}/> };

// ─── Mini step tracker ─────────────────────────────────────────────────────
const STEPS = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED"];
function MiniTracker({ status }) {
  const idx = STEPS.indexOf(status);
  if (status === "CANCELLED" || idx < 0) return null;
  const c = cfg(status);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginTop:12, padding:"12px 14px", backgroundColor:c.color+"10", borderRadius:12 }}>
      {STEPS.map((step, i) => {
        const sc = cfg(step);
        const done = i <= idx, active = i === idx;
        return (
          <div key={step} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
            <div title={sc.label} style={{
              width:active?32:24, height:active?32:24, borderRadius:"50%",
              backgroundColor: done ? c.color : "#e5e7eb",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: active ? 14 : 11, flexShrink:0,
              transition:"all 0.4s ease",
              boxShadow: active ? `0 0 0 3px ${c.color}30` : "none", zIndex:1,
            }}>
              {done ? <span>{sc.emoji}</span> : <div style={{ width:6, height:6, borderRadius:"50%", backgroundColor:"#d1d5db" }}/>}
            </div>
            {i < STEPS.length-1 && (
              <div style={{ flex:1, height:3, backgroundColor: i < idx ? c.color : "#e5e7eb", borderRadius:2, margin:"0 3px", transition:"background-color 0.5s ease" }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Toast stack ───────────────────────────────────────────────────────────
function Toasts({ list, dismiss }) {
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:10, maxWidth:370, width:"calc(100vw - 40px)", pointerEvents:"none" }}>
      {list.map(t => (
        <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, backgroundColor:"white", borderRadius:16, padding:"14px 16px", boxShadow:"0 12px 40px rgba(0,0,0,0.18)", borderLeft:`4px solid ${t.color}`, animation:"toastSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)", pointerEvents:"all" }}>
          <span style={{ fontSize:22, flexShrink:0 }}>{t.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#1a202c" }}>{t.title}</p>
            {t.msg && <p style={{ margin:"4px 0 0", fontSize:13, color:"#6c757d", lineHeight:1.5 }}>{t.msg}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} style={{ background:"none", border:"none", fontSize:20, color:"#9ca3af", cursor:"pointer", padding:"0 2px", lineHeight:1, flexShrink:0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate();

  const [orders,          setOrders]          = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filter,          setFilter]          = useState("ALL");
  const [toasts,          setToasts]          = useState([]);
  const [notifPerm,       setNotifPerm]       = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [soundOn,         setSoundOn]         = useState(true);
  const [pollingOn,       setPollingOn]       = useState(true);
  const [lastChecked,     setLastChecked]     = useState(null);
  const [isOnline,        setIsOnline]        = useState(navigator.onLine);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── CRITICAL: use a ref for soundOn so intervals never get stale values ──
  const soundRef    = useRef(true);
  const knownStatus = useRef({});   // { orderId: statusString }
  const pollRef     = useRef(null);
  const toastSeq    = useRef(0);

  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

  // ── Toast helpers ──────────────────────────────────────────────────────
  const toast = useCallback((title, msg, color, emoji, ms = 6000) => {
    const id = ++toastSeq.current;
    setToasts(p => [...p, { id, title, msg, color, emoji }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const dismiss = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── Network ────────────────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => { setIsOnline(true);  toast("Back online",  "Syncing orders…",               "#10b981","🌐"); };
    const down = () => { setIsOnline(false); toast("You're offline","Won't refresh until connected.","#ef4444","📡"); };
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online",up); window.removeEventListener("offline",down); };
  }, [toast]);

  // ── Permission on mount ────────────────────────────────────────────────
  useEffect(() => { requestPermission().then(setNotifPerm); }, []);

  // ── Unlock AudioContext on first user gesture ──────────────────────────
  useEffect(() => {
    const unlock = () => { try { getAudioCtx().resume(); } catch {} };
    window.addEventListener("click", unlock, { once: true });
    return () => window.removeEventListener("click", unlock);
  }, []);

  // ── Core fetch ─────────────────────────────────────────────────────────
  // soundRef.current used instead of soundOn → no stale closure
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        "https://deliverybackend-0i61.onrender.com/api/orders/my-orders",
        { withCredentials: true }
      );
      if (!res.data.success) return;

      const incoming    = res.data.orders;
      const prev        = knownStatus.current;
      const isFirstLoad = Object.keys(prev).length === 0;

      incoming.forEach(order => {
        const oid   = order._id;
        const newSt = order.status;
        const oldSt = prev[oid];
        const c     = cfg(newSt);
        const rest  = order.restaurant?.name || "restaurant";

        if (!oldSt && !isFirstLoad) {
          // Brand-new order appeared
          if (soundRef.current) playSound("new_order");
          pushNotif("🛒 New Order!", `Order from ${rest} placed.`, `new-${oid}`, "/orders");
          toast("New Order! 🛒", `From ${rest}`, "#3b82f6", "🛒", 8000);

        } else if (oldSt && oldSt !== newSt) {
          // Status changed on existing order
          if (soundRef.current) playSound(c.sound);
          pushNotif(`${c.emoji} ${c.label}`, `Your order from ${rest} is now: ${c.label}`, `status-${oid}`, `/order/${oid}`);
          toast(`${c.emoji} ${c.label}`, `Your order from ${rest}`, c.color, c.emoji, 8000);
        }

        prev[oid] = newSt;
      });

      knownStatus.current = prev;
      setOrders(incoming);
      setLastChecked(new Date());

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
      if (!silent) toast("Could not load orders", "Check your connection.", "#ef4444", "⚠️");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [navigate, toast]); // ← soundOn intentionally NOT here; we use soundRef

  // Initial load
  useEffect(() => { fetchOrders(false); }, []); // eslint-disable-line

  // Background poll every 20 s
  useEffect(() => {
    clearInterval(pollRef.current);
    if (pollingOn && isOnline)
      pollRef.current = setInterval(() => fetchOrders(true), 20_000);
    return () => clearInterval(pollRef.current);
  }, [pollingOn, isOnline, fetchOrders]);

  // ── Cancel ─────────────────────────────────────────────────────────────
  const cancelOrder = async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const res = await axios.patch(
        `https://deliverybackend-0i61.onrender.com/api/orders/${orderId}/cancel`,
        {}, { withCredentials: true }
      );
      if (res.data.success) {
        if (soundRef.current) playSound("cancelled");
        pushNotif("❌ Order Cancelled", "Your order has been cancelled.", `cancel-${orderId}`);
        toast("Order Cancelled", "Cancelled successfully.", "#ef4444", "❌");
        fetchOrders(true);
      }
    } catch (err) {
      toast("Cancel failed", err.response?.data?.error || "Try again.", "#ef4444", "⚠️");
    }
  };

  // ── Enable notifications (also unlocks audio) ──────────────────────────
  const enableNotifs = async () => {
    try { getAudioCtx().resume(); } catch {}
    const p = await requestPermission();
    setNotifPerm(p);
    if (p === "granted") {
      playSound("confirmed");
      toast("Notifications enabled! 🔔", "You'll get live order updates.", "#10b981", "🔔");
    } else if (p === "denied") {
      toast("Notifications blocked 🔕", "Allow them in browser settings.", "#ef4444", "🔕");
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = (() => {
    switch (filter) {
      case "ACTIVE":    return orders.filter(o => ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(o.status));
      case "COMPLETED": return orders.filter(o => o.status === "DELIVERED");
      case "CANCELLED": return orders.filter(o => o.status === "CANCELLED");
      default:          return orders;
    }
  })();

  const canCancel = st => ["PLACED","CONFIRMED"].includes(st);

  const fmtDate = ds => {
    const d = new Date(ds);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return `Today at ${d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`;
    if (days === 1) return "Yesterday";
    if (days < 7)  return `${days} days ago`;
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.center}>
      <div style={S.spinner}/>
      <p style={{ color:"#6c757d", marginTop:20, fontSize:16, fontWeight:500 }}>Loading your orders…</p>
    </div>
  );

  return (
    <>
      <Toasts list={toasts} dismiss={dismiss}/>

      <div style={S.page}>
        <div style={S.wrap}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div>
              <h1 style={S.title}>My Orders</h1>
              <p style={S.sub}>Track and manage your food orders</p>
            </div>

            <div style={S.controls}>
              {/* Online indicator */}
              <div style={{ ...S.pill, backgroundColor: isOnline?"#d1fae5":"#fee2e2", color: isOnline?"#065f46":"#991b1b" }}>
                {isOnline ? <Wifi size={13}/> : <WifiOff size={13}/>}
                <span>{isOnline ? "Live" : "Offline"}</span>
              </div>

              {/* Last checked */}
              {lastChecked && (
                <div style={{ ...S.pill, backgroundColor:"#f1f5f9", color:"#64748b" }}>
                  <RefreshCw size={12}/>
                  <span>{lastChecked.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
                </div>
              )}

              {/* Polling toggle */}
              <button
                style={{ ...S.iBtn, backgroundColor: pollingOn?"#dbeafe":"#f1f5f9", color: pollingOn?"#1d4ed8":"#6c757d" }}
                title={pollingOn ? "Pause auto-refresh":"Resume auto-refresh"}
                onClick={() => {
                  setPollingOn(p => !p);
                  toast(pollingOn?"Auto-refresh paused":"Auto-refresh on", pollingOn?"Updates paused.":"Checking every 20s.", pollingOn?"#f59e0b":"#10b981", pollingOn?"⏸️":"▶️");
                }}
              >
                <RefreshCw size={15} style={{ animation: pollingOn?"spin 2s linear infinite":"none" }}/>
              </button>

              {/* Sound toggle — user gesture unlocks AudioContext */}
              <button
                style={{ ...S.iBtn, backgroundColor: soundOn?"#fef9c3":"#f1f5f9", color: soundOn?"#a16207":"#6c757d" }}
                title={soundOn?"Mute sounds":"Unmute sounds"}
                onClick={() => {
                  try { getAudioCtx().resume(); } catch {}
                  setSoundOn(v => {
                    const next = !v;
                    soundRef.current = next;
                    if (next) setTimeout(() => playSound("confirmed"), 50);
                    return next;
                  });
                }}
              >
                {soundOn ? <Volume2 size={15}/> : <VolumeX size={15}/>}
              </button>

              {/* Bell */}
              <button
                style={{ ...S.iBtn, backgroundColor: notifPerm==="granted"?"#d1fae5":"#fee2e2", color: notifPerm==="granted"?"#065f46":"#991b1b" }}
                title={notifPerm==="granted"?"Notifications ON":"Enable notifications"}
                onClick={enableNotifs}
              >
                {notifPerm==="granted" ? <Bell size={15}/> : <BellOff size={15}/>}
              </button>

              {/* Manual refresh */}
              <button style={{ ...S.iBtn, backgroundColor:"#f1f5f9", color:"#374151" }} title="Refresh now" onClick={() => fetchOrders(false)}>
                <RefreshCw size={15}/>
              </button>
            </div>
          </div>

          {/* ── Notification banner ── */}
          {notifPerm !== "granted" && !bannerDismissed && (
            <div style={S.banner}>
              <Bell size={16}/>
              <span style={{ flex:1 }}>Enable browser notifications for <strong>real-time order updates</strong> even when this tab is in the background.</span>
              <button style={S.bannerBtn} onClick={enableNotifs}>Enable</button>
              <button style={{ background:"none", border:"none", fontSize:20, color:"#92400e", cursor:"pointer" }} onClick={() => setBannerDismissed(true)}>×</button>
            </div>
          )}

          {/* ── Filter tabs ── */}
          <div style={S.tabs}>
            {[
              ["ALL",       `All Orders (${orders.length})`],
              ["ACTIVE",    `Active (${orders.filter(o=>["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)).length})`],
              ["COMPLETED", `Completed (${orders.filter(o=>o.status==="DELIVERED").length})`],
              ["CANCELLED", `Cancelled (${orders.filter(o=>o.status==="CANCELLED").length})`],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{ ...S.tab, ...(filter===key ? S.tabActive : {}) }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Orders ── */}
          {filtered.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}><Package size={56} color="#9ca3af"/></div>
              <h3 style={{ fontSize:26, fontWeight:700, color:"#2d3748", margin:"0 0 10px" }}>
                {filter==="ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              </h3>
              <p style={{ fontSize:16, color:"#6c757d", margin:"0 0 28px", lineHeight:1.6 }}>
                {filter==="ALL" ? "Start ordering from your favourite restaurants!" : `No ${filter.toLowerCase()} orders right now.`}
              </p>
              {filter==="ALL" && (
                <button onClick={() => navigate("/restaurants")} style={S.exploreBtn}>Explore Restaurants</button>
              )}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {filtered.map(order => {
                const c = cfg(order.status);
                const isActive = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(order.status);
                return (
                  <div key={order._id} style={{ ...S.card, borderColor: isActive ? c.color+"50":"transparent" }}>

                    {/* Card header */}
                    <div style={S.cardHead}>
                      <div style={{ flex:1 }}>
                        <h3 style={{ fontSize:19, fontWeight:700, color:"#2d3748", margin:"0 0 5px" }}>{order.restaurant?.name || "Restaurant"}</h3>
                        {order.restaurant?.location?.address && (
                          <p style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#6c757d", margin:0 }}>
                            <MapPin size={13}/> {order.restaurant.location.address}
                          </p>
                        )}
                        <p style={{ fontSize:13, color:"#9ca3af", margin:"4px 0 0", fontWeight:500 }}>{fmtDate(order.orderDate)}</p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 14px", borderRadius:11, fontSize:13, fontWeight:700, border:`2px solid ${c.color}`, backgroundColor:`${c.color}12`, color:c.color, whiteSpace:"nowrap", flexShrink:0 }}>
                        {c.icon} {c.label}
                        {isActive && <span style={{ width:7, height:7, borderRadius:"50%", backgroundColor:c.color, animation:"pulse 1.4s ease-in-out infinite" }}/>}
                      </div>
                    </div>

                    {/* Step tracker for active orders */}
                    {isActive && <MiniTracker status={order.status}/>}

                    {/* Items */}
                    <div style={{ margin:"16px 0" }}>
                      <h4 style={{ fontSize:14, fontWeight:700, color:"#2d3748", margin:"0 0 10px" }}>Items ({order.items.length})</h4>
                      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", backgroundColor:"#f8f9fa", borderRadius:9 }}>
                            {item.image && <div style={{ width:44, height:44, borderRadius:7, overflow:"hidden", flexShrink:0 }}><img src={item.image} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/></div>}
                            <div style={{ flex:1, display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
                              <span style={{ fontSize:14, fontWeight:600, color:"#2d3748", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                              <span style={{ fontSize:13, color:"#9ca3af", flexShrink:0 }}>×{item.quantity}</span>
                            </div>
                            <span style={{ fontSize:14, fontWeight:700, color:"#2d3748", flexShrink:0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div style={{ padding:14, backgroundColor:"#f8f9fa", borderRadius:11, marginBottom:16 }}>
                      {[["Subtotal",order.subtotal],["Taxes",order.taxes],["Delivery Fee",order.deliveryFee]].map(([l,v]) => (
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <span style={{ fontSize:13, color:"#6c757d", fontWeight:500 }}>{l}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:"#2d3748" }}>₹{v.toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ height:1, backgroundColor:"#e5e7eb", margin:"10px 0" }}/>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:16, fontWeight:700, color:"#2d3748" }}>Total</span>
                        <span style={{ fontSize:19, fontWeight:800, color:"#2d3748" }}>₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      <button onClick={() => navigate(`/restaurant/${order.restaurant._id}`)} style={S.btnDark}>Order Again</button>
                      {canCancel(order.status) && (
                        <button onClick={() => cancelOrder(order._id)} style={S.btnRed}>Cancel Order</button>
                      )}
                      <button onClick={() => navigate(`/order/${order._id}`)} style={S.btnGhost}>View Details</button>
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
const S = {
  page:      { minHeight:"100vh", backgroundColor:"#f8f9fa", paddingBottom:40, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  wrap:      { maxWidth:1000, margin:"0 auto", padding:20 },
  center:    { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", backgroundColor:"#f8f9fa" },
  spinner:   { width:48, height:48, border:"4px solid #e9ecef", borderTop:"4px solid #2d3748", borderRadius:"50%", animation:"spin 1s linear infinite" },
  header:    { display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:20 },
  title:     { fontSize:34, fontWeight:800, color:"#2d3748", margin:"0 0 6px", letterSpacing:"-0.5px" },
  sub:       { fontSize:16, color:"#6c757d", margin:0, fontWeight:500 },
  controls:  { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  pill:      { display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:20, fontSize:12, fontWeight:600 },
  iBtn:      { display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:10, border:"none", cursor:"pointer" },
  banner:    { display:"flex", alignItems:"center", gap:10, backgroundColor:"#fffbeb", border:"2px solid #fde68a", borderRadius:12, padding:"11px 16px", marginBottom:20, fontSize:14, color:"#92400e", flexWrap:"wrap" },
  bannerBtn: { backgroundColor:"#f59e0b", color:"white", border:"none", borderRadius:8, padding:"6px 14px", fontSize:13, fontWeight:700, cursor:"pointer", marginLeft:"auto" },
  tabs:      { display:"flex", gap:8, marginBottom:24, backgroundColor:"white", padding:8, borderRadius:14, boxShadow:"0 2px 8px rgba(0,0,0,.06)", overflowX:"auto" },
  tab:       { flex:1, minWidth:"fit-content", padding:"11px 18px", backgroundColor:"transparent", border:"none", borderRadius:10, fontSize:14, fontWeight:600, color:"#6c757d", cursor:"pointer", whiteSpace:"nowrap" },
  tabActive: { backgroundColor:"#2d3748", color:"white" },
  empty:     { textAlign:"center", padding:"80px 20px", backgroundColor:"white", borderRadius:20, boxShadow:"0 4px 20px rgba(0,0,0,.08)" },
  emptyIcon: { width:110, height:110, margin:"0 auto 22px", backgroundColor:"#f8f9fa", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" },
  exploreBtn:{ display:"inline-flex", alignItems:"center", backgroundColor:"#2d3748", color:"white", border:"none", borderRadius:14, padding:"15px 36px", fontSize:16, fontWeight:700, cursor:"pointer" },
  card:      { backgroundColor:"white", borderRadius:20, padding:22, boxShadow:"0 4px 20px rgba(0,0,0,.07)", border:"2px solid transparent", transition:"border-color 0.3s ease" },
  cardHead:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:4, paddingBottom:16, borderBottom:"2px solid #f1f3f5" },
  btnDark:   { flex:1, minWidth:130, padding:"11px 18px", backgroundColor:"#2d3748", color:"white", border:"none", borderRadius:11, fontSize:14, fontWeight:600, cursor:"pointer" },
  btnRed:    { flex:1, minWidth:130, padding:"11px 18px", backgroundColor:"#fff5f5", color:"#dc3545", border:"2px solid #fee", borderRadius:11, fontSize:14, fontWeight:600, cursor:"pointer" },
  btnGhost:  { flex:1, minWidth:130, padding:"11px 18px", backgroundColor:"white", color:"#2d3748", border:"2px solid #e9ecef", borderRadius:11, fontSize:14, fontWeight:600, cursor:"pointer" },
};

// ─── Global CSS ────────────────────────────────────────────────────────────
const _css = document.createElement("style");
_css.textContent = `
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.6)} }
  @keyframes toastSlide{ from{opacity:0;transform:translateX(40px) scale(.95)} to{opacity:1;transform:translateX(0) scale(1)} }
  button:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.14) !important; }
  button:active:not(:disabled){ transform:translateY(0); }
  button:focus-visible{ outline:3px solid #667eea !important; outline-offset:2px !important; }
  @media(max-width:640px){
    div[style*="cardHead"]{ flex-direction:column !important; }
    div[style*="btnDark"],div[style*="btnRed"],div[style*="btnGhost"]{ min-width:100% !important; }
  }
  @media(prefers-reduced-motion:reduce){ *{ animation-duration:.01ms !important; transition-duration:.01ms !important; } }
`;
document.head.appendChild(_css);