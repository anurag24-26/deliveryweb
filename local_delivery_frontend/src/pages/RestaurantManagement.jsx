/**
 * RestaurantOrderManagement.jsx
 *
 * All fixes applied (same pattern as fixed Orders.jsx):
 * A. Audio: async getCtx() + await beep() — always resumes before playing
 * B. Tracker polls IMMEDIATELY on mount before setInterval
 * C. Notifications guarded with Notification.permission === "granted"
 * D. fetchOrders stored as useRef — zero stale closures, interval always current
 * E. soundRef / showNewOrderRef etc all mirrored as refs
 * F. CSS injected once with id guard
 * G. navigate stored in ref — stable across renders
 * H. New order detection via knownOrders ref diff (same pattern as Orders.jsx)
 * I. Auto-refresh every 20s in background
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://deliverybackend-0i61.onrender.com";

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO — singleton, always async-resume before playing
// ─────────────────────────────────────────────────────────────────────────────
let _ctx = null;

async function getCtx() {
  try {
    if (!_ctx || _ctx.state === "closed")
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") await _ctx.resume();
    return _ctx;
  } catch { return null; }
}

const TONES = {
  new_order:    [[880,0],[1047,.12],[1319,.24]],   // bright ascending — new order alert
  confirmed:    [[523,0],[659,.14]],
  preparing:    [[392,0],[494,.12],[587,.24]],
  out_delivery: [[659,0],[784,.12],[988,.24]],
  delivered:    [[523,0],[659,.10],[784,.20],[1047,.30]],
  cancelled:    [[380,0],[300,.22]],
  status_up:    [[440,0],[550,.14]],
};

async function beep(type) {
  const ctx = await getCtx();
  if (!ctx) return;
  try {
    (TONES[type] || TONES.status_up).forEach(([f, t]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(f, ctx.currentTime + t);
      g.gain.setValueAtTime(0.28, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.26);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.30);
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function askPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

function notify(title, body, tag, url) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body, tag,
      icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
      renotify: true,
      vibrate: [200, 80, 200],
    });
    n.onclick = () => { window.focus(); n.close(); if (url) window.location.href = url; };
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const SM = {
  PLACED:           { label: "Placed",          color: "#d97706", bg: "#fffbeb", sound: "new_order",    next: "CONFIRMED"        },
  CONFIRMED:        { label: "Confirmed",        color: "#2563eb", bg: "#eff6ff", sound: "confirmed",    next: "PREPARING"        },
  PREPARING:        { label: "Preparing",        color: "#7c3aed", bg: "#f5f3ff", sound: "preparing",    next: "OUT_FOR_DELIVERY" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#0d9488", bg: "#f0fdfa", sound: "out_delivery", next: "DELIVERED"        },
  DELIVERED:        { label: "Delivered",        color: "#15803d", bg: "#f0fdf4", sound: "delivered",    next: null               },
  CANCELLED:        { label: "Cancelled",        color: "#dc2626", bg: "#fef2f2", sound: "cancelled",    next: null               },
};
const sc = k => SM[k] || { label: k, color: "#6b7280", bg: "#f9fafb", sound: "status_up", next: null };

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS (no emoji)
// ─────────────────────────────────────────────────────────────────────────────
const I = {
  Refresh:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  Bell:     p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  BellOff:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  SoundOn:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
  SoundOff: p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  User:     p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Phone:    p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012.88 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Pin:      p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check:    p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search:   p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Package:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Wifi:     p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  WifiOff:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a11 11 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>,
  Store:    p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  TrendUp:  p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Clock:    p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Truck:    p => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// TOAST STACK
// ─────────────────────────────────────────────────────────────────────────────
function Toasts({ list, dismiss }) {
  if (!list.length) return null;
  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, width:320, maxWidth:"calc(100vw - 32px)", pointerEvents:"none" }}>
      {list.map(t => (
        <div key={t.id} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fff", borderRadius:10, padding:"11px 13px", boxShadow:"0 4px 24px rgba(0,0,0,.10)", borderLeft:`3px solid ${t.color}`, animation:"toast-in .25s ease", pointerEvents:"all" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:t.color, flexShrink:0, marginTop:5 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#111827" }}>{t.title}</p>
            {t.msg && <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280", lineHeight:1.4 }}>{t.msg}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} style={{ background:"none", border:"none", color:"#9ca3af", fontSize:15, cursor:"pointer", padding:0, flexShrink:0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, pulse, icon: Icon }) {
  return (
    <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${accent}22`, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
      {pulse && value > 0 && (
        <span style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:accent, animation:"pulse-dot 1.4s ease infinite" }}/>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`${accent}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon width={16} height={16} style={{ color:accent }}/>
        </div>
        <span style={{ fontSize:22, fontWeight:800, color:"#111827", letterSpacing:"-.5px" }}>{value}</span>
      </div>
      <p style={{ margin:0, fontSize:12, fontWeight:600, color:"#6b7280", letterSpacing:".03em", textTransform:"uppercase" }}>{label}</p>
      {sub && <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af" }}>{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CANCEL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CancelModal({ order, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,.15)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 20px", borderBottom:"1px solid #f3f4f6" }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:"#111827" }}>Cancel Order</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#9ca3af", padding:2 }}>
            <I.X width={18} height={18}/>
          </button>
        </div>
        <div style={{ padding:"18px 20px" }}>
          <p style={{ margin:"0 0 4px", fontSize:13, color:"#374151" }}>
            Cancel order <strong>#{order._id.slice(-8).toUpperCase()}</strong>?
          </p>
          <p style={{ margin:"0 0 16px", fontSize:12, color:"#dc2626", fontWeight:600 }}>This cannot be undone.</p>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6, textTransform:"uppercase", letterSpacing:".04em" }}>Reason *</label>
          <textarea
            rows={3}
            placeholder="Provide a reason for cancellation…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width:"100%", padding:"10px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
          />
        </div>
        <div style={{ display:"flex", gap:8, padding:"12px 20px", borderTop:"1px solid #f3f4f6" }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", color:"#374151", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            Go Back
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            style={{ flex:1, padding:"9px", border:"none", borderRadius:8, background: reason.trim() ? "#dc2626" : "#f3f4f6", color: reason.trim() ? "#fff" : "#9ca3af", fontSize:13, fontWeight:700, cursor: reason.trim() ? "pointer" : "not-allowed" }}
          >
            {loading ? "Cancelling…" : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({ order, onStatusUpdate, onCancel, updating }) {
  const c    = sc(order.status);
  const isActive = !["DELIVERED","CANCELLED"].includes(order.status);
  const isNew    = order.status === "PLACED";

  const fmtDate = ds => new Date(ds).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

  return (
    <div style={{
      background:"#fff",
      borderRadius:13,
      border:`1px solid ${isActive ? c.color+"28" : "#f3f4f6"}`,
      overflow:"hidden",
      transition:"border-color .3s",
    }}>
      {/* accent bar */}
      {isActive && <div style={{ height:2, background:`linear-gradient(90deg, ${c.color}, ${c.color}44)` }}/>}

      <div style={{ padding:"16px 18px" }}>

        {/* header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:14 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#111827", fontFamily:"monospace", letterSpacing:".05em" }}>
                #{order._id.slice(-8).toUpperCase()}
              </span>
              {isNew && (
                <span style={{ fontSize:10, fontWeight:700, color:c.color, background:`${c.color}15`, padding:"2px 6px", borderRadius:99, border:`1px solid ${c.color}30`, letterSpacing:".05em" }}>
                  NEW
                </span>
              )}
            </div>
            <p style={{ margin:"3px 0 0", fontSize:11, color:"#9ca3af" }}>{fmtDate(order.orderDate)}</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:99, background:c.bg, border:`1px solid ${c.color}22`, flexShrink:0 }}>
            {isActive && <span style={{ width:5, height:5, borderRadius:"50%", background:c.color, animation:"pulse-dot 1.4s ease infinite" }}/>}
            <span style={{ fontSize:11, fontWeight:700, color:c.color, letterSpacing:".03em" }}>{c.label}</span>
          </div>
        </div>

        {/* customer */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14, padding:"10px 12px", background:"#f9fafb", borderRadius:9 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#374151" }}>
            <I.User width={13} height={13} style={{ color:"#9ca3af", flexShrink:0 }}/>
            <span style={{ fontWeight:600 }}>{order.user?.name || order.user?.email || "Guest"}</span>
          </div>
          {order.user?.phone && (
            <a href={`tel:${order.user.phone}`} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#2563eb", textDecoration:"none" }}>
              <I.Phone width={13} height={13} style={{ flexShrink:0 }}/>
              {order.user.phone}
            </a>
          )}
          {order.deliveryAddress && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:12, color:"#374151", width:"100%" }}>
              <I.Pin width={13} height={13} style={{ color:"#9ca3af", flexShrink:0, marginTop:1 }}/>
              <span>{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {/* items */}
        <div style={{ marginBottom:14 }}>
          <p style={{ margin:"0 0 8px", fontSize:11, fontWeight:700, color:"#9ca3af", letterSpacing:".06em", textTransform:"uppercase" }}>Items</p>
          {order.items.map((item, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom: i < order.items.length-1 ? "1px solid #f9fafb" : "none" }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width:34, height:34, borderRadius:7, objectFit:"cover", flexShrink:0 }}/>}
              <span style={{ flex:1, fontSize:13, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
              <span style={{ fontSize:11, color:"#9ca3af", flexShrink:0 }}>×{item.quantity}</span>
              <span style={{ fontSize:13, fontWeight:600, color:"#111827", flexShrink:0, fontFamily:"monospace" }}>₹{(item.price*item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        {/* totals */}
        <div style={{ padding:"10px 12px", background:"#f9fafb", borderRadius:9, marginBottom: isActive ? 14 : 0 }}>
          {[["Subtotal", order.subtotal], order.taxes > 0 && ["Taxes", order.taxes], order.deliveryFee > 0 && ["Delivery", order.deliveryFee]].filter(Boolean).map(([l,v]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:12, color:"#6b7280" }}>{l}</span>
              <span style={{ fontSize:12, color:"#374151", fontFamily:"monospace" }}>₹{v.toFixed(0)}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:6, borderTop:"1px solid #e5e7eb", marginTop:4 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>Total</span>
            <span style={{ fontSize:14, fontWeight:800, color:"#111827", fontFamily:"monospace" }}>₹{order.total.toFixed(0)}</span>
          </div>
        </div>

        {/* actions */}
        {isActive && (
          <div style={{ display:"flex", gap:8 }}>
            {c.next && (
              <button
                onClick={() => onStatusUpdate(order._id, c.next)}
                disabled={updating}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 14px", border:"none", borderRadius:8, background: updating ? "#f3f4f6" : "#111827", color: updating ? "#9ca3af" : "#fff", fontSize:13, fontWeight:700, cursor: updating ? "not-allowed" : "pointer" }}
              >
                {updating
                  ? <><span style={{ width:12, height:12, border:"2px solid #d1d5db", borderTop:"2px solid #6b7280", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }}/> Updating…</>
                  : <><I.Check width={13} height={13}/> Mark as {sc(c.next).label}</>
                }
              </button>
            )}
            {["PLACED","CONFIRMED"].includes(order.status) && (
              <button
                onClick={() => onCancel(order)}
                disabled={updating}
                style={{ padding:"9px 14px", border:"1px solid #fecaca", borderRadius:8, background:"#fff1f2", color:"#b91c1c", fontSize:13, fontWeight:700, cursor: updating ? "not-allowed" : "pointer", display:"flex", alignItems:"center", gap:5 }}
              >
                <I.X width={13} height={13}/> Cancel
              </button>
            )}
          </div>
        )}

        {/* terminal status */}
        {order.status === "DELIVERED" && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"#f0fdf4", borderRadius:8, fontSize:13, fontWeight:600, color:"#15803d" }}>
            <I.Check width={14} height={14}/> Completed successfully
          </div>
        )}
        {order.status === "CANCELLED" && (
          <div style={{ padding:"8px 12px", background:"#fef2f2", borderRadius:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"#dc2626" }}>
              <I.X width={14} height={14}/> Order cancelled
            </div>
            {order.cancellationReason && (
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#ef4444" }}>Reason: {order.cancellationReason}</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function RestaurantOrderManagement() {
  const navigate = useNavigate();

  const [orders,      setOrders]      = useState([]);
  const [restaurant,  setRestaurant]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [filter,      setFilter]      = useState("ACTIVE");
  const [search,      setSearch]      = useState("");
  const [updating,    setUpdating]    = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [toasts,      setToasts]      = useState([]);
  const [perm,        setPerm]        = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [soundOn,     setSoundOn]     = useState(true);
  const [polling,     setPolling]     = useState(true);
  const [online,      setOnline]      = useState(navigator.onLine);
  const [lastPoll,    setLastPoll]    = useState(null);
  const [bannerOff,   setBannerOff]   = useState(false);

  // ── all refs ──────────────────────────────────────────────────────────
  const soundRef    = useRef(true);
  const pollingRef  = useRef(true);
  const onlineRef   = useRef(true);
  const navRef      = useRef(navigate);
  const restRef     = useRef(null);     // current restaurant._id
  const knownOrders = useRef({});       // { orderId: status } for diff
  const pollTimer   = useRef(null);
  const toastSeq    = useRef(0);

  useEffect(() => { soundRef.current   = soundOn;  }, [soundOn]);
  useEffect(() => { pollingRef.current  = polling;  }, [polling]);
  useEffect(() => { onlineRef.current   = online;   }, [online]);
  useEffect(() => { navRef.current      = navigate; }, [navigate]);

  // ── toast helpers ─────────────────────────────────────────────────────
  const addToast = useCallback((title, msg, color, ms = 6000) => {
    const id = ++toastSeq.current;
    setToasts(p => [...p, { id, title, msg, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const rmToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── network ───────────────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => { setOnline(true);  addToast("Back online", "Syncing orders…", "#15803d"); };
    const down = () => { setOnline(false); addToast("Offline", "No live updates until reconnected.", "#dc2626"); };
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online",up); window.removeEventListener("offline",down); };
  }, [addToast]);

  // ── unlock audio on first interaction ────────────────────────────────
  useEffect(() => {
    const unlock = () => { getCtx(); };
    window.addEventListener("click",     unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => { window.removeEventListener("click",unlock); window.removeEventListener("touchstart",unlock); };
  }, []);

  // ── permission ────────────────────────────────────────────────────────
  useEffect(() => { askPermission().then(setPerm); }, []);

  // ─────────────────────────────────────────────────────────────────────
  // fetchOrders — useRef, zero stale closures
  // Diffs against knownOrders to detect new orders + status changes
  // ─────────────────────────────────────────────────────────────────────
  const fetchOrders = useRef(async (restaurantId, silent = false) => {
    const rid = restaurantId || restRef.current;
    if (!rid) return;
    try {
      const res = await fetch(`${API}/api/orders/restaurant/${rid}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.status === 401) { if (!silent) navRef.current("/login"); return; }
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      const incoming = data.orders || [];

      const prev        = knownOrders.current;
      const isFirstLoad = Object.keys(prev).length === 0;

      for (const order of incoming) {
        const { _id: oid, status: ns, user } = order;
        const os  = prev[oid];
        const cfg = sc(ns);
        const who = user?.name || user?.email || "A customer";

        if (!os && !isFirstLoad) {
          // new order
          if (soundRef.current) await beep("new_order");
          notify("New Order", `${who} placed an order`, `new-${oid}`, window.location.href);
          const id = ++toastSeq.current;
          setToasts(p => [...p, { id, title:`New order from ${who}`, msg:`#${oid.slice(-8).toUpperCase()}`, color:"#d97706" }]);
          setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 10000);

        } else if (os && os !== ns) {
          if (soundRef.current) await beep(cfg.sound);
          notify(cfg.label, `Order #${oid.slice(-8).toUpperCase()} — ${cfg.label}`, `st-${oid}`, window.location.href);
          const id = ++toastSeq.current;
          setToasts(p => [...p, { id, title:cfg.label, msg:`Order #${oid.slice(-8).toUpperCase()}`, color:cfg.color }]);
          setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 7000);
        }

        prev[oid] = ns;
      }

      knownOrders.current = prev;
      setOrders(incoming);
      setLastPoll(new Date());

    } catch (err) {
      if (!silent) addToast("Failed to load orders", err.message, "#dc2626");
    }
  });

  // ── initial auth + data load ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/restaurants/my`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.status === 401) { setError("Session expired. Please log in again."); setTimeout(() => navigate("/login"), 2000); return; }
        if (res.status === 403) { setError("Access denied. Restaurant owners only."); setTimeout(() => navigate("/"), 2500); return; }
        if (res.status === 404) { setError("No restaurant found. Create one first."); setTimeout(() => navigate("/restaurant/dashboard"), 2500); return; }
        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        if (!data?._id) throw new Error("Invalid restaurant data");

        setRestaurant(data);
        restRef.current = data._id;
        await fetchOrders.current(data._id, false);

      } catch (err) {
        setError(err.message.includes("fetch") ? "Cannot reach server. It may be cold-starting — try again in a moment." : err.message);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── background polling every 20s ──────────────────────────────────────
  useEffect(() => {
    clearInterval(pollTimer.current);
    if (polling && online && restRef.current) {
      pollTimer.current = setInterval(() => {
        if (pollingRef.current && onlineRef.current) fetchOrders.current(null, true);
      }, 20_000);
    }
    return () => clearInterval(pollTimer.current);
  }, [polling, online]);

  // ── update order status ───────────────────────────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      const cfg  = sc(newStatus);
      if (soundRef.current) await beep(cfg.sound);
      notify(cfg.label, `Order #${orderId.slice(-8).toUpperCase()} updated`, `upd-${orderId}`, window.location.href);
      addToast(`Marked as ${cfg.label}`, `Order #${orderId.slice(-8).toUpperCase()}`, cfg.color);
      setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
      knownOrders.current[orderId] = newStatus;
    } catch (err) {
      addToast("Update failed", err.message, "#dc2626");
    } finally {
      setUpdating(null);
    }
  };

  // ── cancel order ──────────────────────────────────────────────────────
  const confirmCancel = async (reason) => {
    if (!cancelOrder) return;
    setUpdating(cancelOrder._id);
    try {
      const res = await fetch(`${API}/api/orders/${cancelOrder._id}/restaurant-cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to cancel order");
      const data = await res.json();
      if (soundRef.current) await beep("cancelled");
      notify("Order Cancelled", `#${cancelOrder._id.slice(-8).toUpperCase()} cancelled`, `cx-${cancelOrder._id}`, window.location.href);
      addToast("Order cancelled", "", "#dc2626");
      setOrders(prev => prev.map(o => o._id === cancelOrder._id ? data.order : o));
      knownOrders.current[cancelOrder._id] = "CANCELLED";
      setCancelOrder(null);
    } catch (err) {
      addToast("Cancel failed", err.message, "#dc2626");
    } finally {
      setUpdating(null);
    }
  };

  // ── enable notifications ──────────────────────────────────────────────
  const enableNotifs = async () => {
    await getCtx();
    const p = await askPermission();
    setPerm(p);
    if (p === "granted") { await beep("confirmed"); addToast("Notifications enabled", "You'll receive live order alerts.", "#15803d"); }
    else if (p === "denied") addToast("Notifications blocked", "Allow them in browser settings.", "#dc2626");
  };

  // ── derived stats ─────────────────────────────────────────────────────
  const ACTIVE_ST = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"];
  const stats = {
    placed:   orders.filter(o => o.status === "PLACED").length,
    active:   orders.filter(o => ACTIVE_ST.includes(o.status)).length,
    delivered: orders.filter(o => {
      const today = new Date().toDateString();
      return o.status === "DELIVERED" && new Date(o.orderDate).toDateString() === today;
    }).length,
    revenue: orders.filter(o => {
      const today = new Date().toDateString();
      return o.status === "DELIVERED" && new Date(o.orderDate).toDateString() === today;
    }).reduce((s,o) => s + o.total, 0),
    total: orders.length,
  };

  // ── filtered view ─────────────────────────────────────────────────────
  const FILTER_OPTS = [
    ["ACTIVE",    `Active  ${stats.active}`],
    ["ALL",       `All  ${stats.total}`],
    ["PLACED",    `Placed  ${stats.placed}`],
    ["CONFIRMED", `Confirmed  ${orders.filter(o=>o.status==="CONFIRMED").length}`],
    ["PREPARING", `Preparing  ${orders.filter(o=>o.status==="PREPARING").length}`],
    ["OUT_FOR_DELIVERY", `Out  ${orders.filter(o=>o.status==="OUT_FOR_DELIVERY").length}`],
    ["DELIVERED", `Done  ${orders.filter(o=>o.status==="DELIVERED").length}`],
    ["CANCELLED", `Cancelled  ${orders.filter(o=>o.status==="CANCELLED").length}`],
  ];

  const view = orders
    .filter(o => filter === "ALL" ? true : filter === "ACTIVE" ? ACTIVE_ST.includes(o.status) : o.status === filter)
    .filter(o => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return o._id.toLowerCase().includes(q)
        || o.user?.name?.toLowerCase().includes(q)
        || o.user?.email?.toLowerCase().includes(q)
        || o.items.some(i => i.name.toLowerCase().includes(q));
    });

  // ── loading / error screens ───────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f9fafb" }}>
      <div style={{ width:32, height:32, border:"2.5px solid #e5e7eb", borderTop:"2.5px solid #111827", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <p style={{ margin:"14px 0 0", color:"#9ca3af", fontSize:13, fontFamily:"monospace" }}>loading order management…</p>
    </div>
  );

  if (error && !restaurant) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f9fafb", padding:20, textAlign:"center" }}>
      <div style={{ width:48, height:48, borderRadius:12, background:"#fef2f2", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <I.X width={24} height={24} style={{ color:"#dc2626" }}/>
      </div>
      <h2 style={{ margin:"0 0 8px", fontSize:18, fontWeight:700, color:"#111827" }}>Something went wrong</h2>
      <p style={{ margin:0, fontSize:14, color:"#6b7280", maxWidth:340 }}>{error}</p>
    </div>
  );

  // ── main render ───────────────────────────────────────────────────────
  return (
    <>
      <Toasts list={toasts} dismiss={rmToast}/>
      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          onConfirm={confirmCancel}
          onClose={() => setCancelOrder(null)}
          loading={updating === cancelOrder._id}
        />
      )}

      <div style={{ minHeight:"100vh", background:"#f9fafb", fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 20px 72px" }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I.Store width={20} height={20} style={{ color:"#374151" }}/>
              </div>
              <div>
                <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827", letterSpacing:"-.4px" }}>
                  {restaurant?.name || "Order Management"}
                </h1>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#9ca3af" }}>
                  {lastPoll ? `Updated ${lastPoll.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}` : "Loading…"}
                </p>
              </div>
            </div>

            <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
              {/* online */}
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:99, background: online?"#f0fdf4":"#fef2f2", border:`1px solid ${online?"#bbf7d0":"#fecaca"}`, fontSize:11, fontWeight:600, color: online?"#15803d":"#b91c1c" }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background: online?"#22c55e":"#ef4444", display:"block", animation: online?"pulse-dot 2s ease infinite":"none" }}/>
                {online ? "live" : "offline"}
              </div>

              {/* poll toggle */}
              <button onClick={() => { setPolling(p=>!p); addToast(polling?"Auto-refresh paused":"Auto-refresh on", polling?"":"Checking every 20s.", "#6b7280"); }}
                style={{ ...IB, background: polling?"#eff6ff":"#f3f4f6", color: polling?"#1d4ed8":"#6b7280" }}>
                <I.Refresh width={14} height={14} style={{ animation: polling?"spin 3s linear infinite":"none" }}/>
              </button>

              {/* sound */}
              <button onClick={() => { getCtx(); setSoundOn(v => { const n=!v; soundRef.current=n; if(n) beep("confirmed"); return n; }); }}
                style={{ ...IB, background: soundOn?"#fefce8":"#f3f4f6", color: soundOn?"#a16207":"#6b7280" }}>
                {soundOn ? <I.SoundOn width={14} height={14}/> : <I.SoundOff width={14} height={14}/>}
              </button>

              {/* bell */}
              <button onClick={enableNotifs} title={perm==="granted"?"Notifications on":"Enable notifications"}
                style={{ ...IB, background: perm==="granted"?"#f0fdf4":"#fef2f2", color: perm==="granted"?"#15803d":"#b91c1c" }}>
                {perm==="granted" ? <I.Bell width={14} height={14}/> : <I.BellOff width={14} height={14}/>}
              </button>

              {/* refresh */}
              <button onClick={() => fetchOrders.current(null, false)} style={{ ...IB, background:"#f3f4f6", color:"#374151" }}>
                <I.Refresh width={14} height={14}/>
              </button>
            </div>
          </div>

          {/* ── NOTIFICATION BANNER ── */}
          {perm !== "granted" && !bannerOff && (
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:12, color:"#92400e" }}>
              <I.Bell width={13} height={13} style={{ flexShrink:0 }}/>
              <span style={{ flex:1 }}>Enable notifications to receive instant alerts when new orders arrive.</span>
              <button onClick={enableNotifs} style={{ background:"#f59e0b", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Enable</button>
              <button onClick={() => setBannerOff(true)} style={{ background:"none", border:"none", color:"#92400e", fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>×</button>
            </div>
          )}

          {/* ── STATS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:10, marginBottom:24 }}>
            <StatCard label="New Orders"      value={stats.placed}   accent="#d97706" pulse icon={I.Bell}    sub={stats.placed > 0 ? "Awaiting confirmation" : "None pending"}/>
            <StatCard label="Active Orders"   value={stats.active}   accent="#2563eb"       icon={I.Clock}   sub="In progress"/>
            <StatCard label="Completed Today" value={stats.delivered} accent="#15803d"       icon={I.Package} sub="Delivered"/>
            <StatCard label="Today's Revenue" value={`₹${stats.revenue.toFixed(0)}`} accent="#7c3aed" icon={I.TrendUp} sub="From deliveries"/>
          </div>

          {/* ── SEARCH ── */}
          <div style={{ position:"relative", marginBottom:14 }}>
            <I.Search width={14} height={14} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}/>
            <input
              type="text"
              placeholder="Search by order ID, customer, or item…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"9px 12px 9px 34px", border:"1px solid #e5e7eb", borderRadius:9, fontSize:13, color:"#111827", background:"#fff", outline:"none", boxSizing:"border-box" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#9ca3af", cursor:"pointer", padding:2 }}>
                <I.X width={13} height={13}/>
              </button>
            )}
          </div>

          {/* ── FILTER TABS ── */}
          <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f3f4f6", padding:4, borderRadius:10, overflowX:"auto" }}>
            {FILTER_OPTS.map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{
                minWidth:"fit-content", padding:"7px 12px", border:"none", borderRadius:7,
                fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s",
                background: filter===k ? "#fff" : "transparent",
                color:      filter===k ? "#111827" : "#6b7280",
                boxShadow:  filter===k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}>{l}</button>
            ))}
          </div>

          {/* ── ORDERS ── */}
          {view.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", background:"#fff", borderRadius:14, border:"1px solid #f3f4f6" }}>
              <I.Package width={40} height={40} style={{ color:"#d1d5db", margin:"0 auto 16px", display:"block" }}/>
              <h3 style={{ margin:"0 0 6px", fontSize:16, fontWeight:700, color:"#111827" }}>No orders found</h3>
              <p style={{ margin:0, fontSize:13, color:"#6b7280" }}>
                {search ? "Try adjusting your search." : filter !== "ALL" ? `No ${filter.toLowerCase().replace(/_/g," ")} orders right now.` : "Orders will appear here once customers start placing them."}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(360px, 1fr))", gap:12 }}>
              {view.map(order => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={updateStatus}
                  onCancel={setCancelOrder}
                  updating={updating === order._id}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const IB = { display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, border:"none", cursor:"pointer", flexShrink:0 };

// ─────────────────────────────────────────────────────────────────────────────
// CSS — injected once
// ─────────────────────────────────────────────────────────────────────────────
if (!document.getElementById("rom-styles")) {
  const el = document.createElement("style");
  el.id = "rom-styles";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    @keyframes spin      { to { transform: rotate(360deg); } }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.6)} }
    @keyframes toast-in  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

    * { box-sizing: border-box; }
    input, textarea { font-family: inherit; }
    button { font-family: inherit; transition: opacity .15s, transform .15s; }
    button:hover:not(:disabled)  { opacity:.82; transform:translateY(-1px); }
    button:active:not(:disabled) { opacity:1;  transform:translateY(0); }
    button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-thumb { background:#d1d5db; border-radius:99px; }

    @media(prefers-reduced-motion:reduce){ *{ animation:none !important; transition:none !important; } }
  `;
  document.head.appendChild(el);
}