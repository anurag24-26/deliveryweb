/**
 * Orders.jsx — Final
 *
 * ALL bugs resolved:
 * A. Audio: ctx.resume() awaited before every beep call (not just on click)
 * B. Tracker polls IMMEDIATELY on mount (fetchStatus() before setInterval)
 * C. Notifications guarded with Notification.permission === "granted" check
 * D. fetchOrders stored as useRef (not useCallback) → zero stale closures
 * E. showTrkRef mirrors showTrk state → no stale closure in fetchOrders
 * F. soundRef synced synchronously in toggle handler (not just via useEffect)
 * G. CSS injected once with id guard
 * H. navigate stored in ref → stable across renders
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO — singleton ctx, always resume before playing
// ─────────────────────────────────────────────────────────────────────────────
let _ctx = null;

async function getCtx() {
  try {
    if (!_ctx || _ctx.state === "closed")
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    // FIX A: always await resume — works even without prior user gesture
    if (_ctx.state === "suspended") await _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

const TONES = {
  new_order:    [[523,0],[659,.15],[784,.30]],
  confirmed:    [[440,0],[550,.15]],
  preparing:    [[392,0],[494,.12],[587,.24]],
  out_delivery: [[659,0],[784,.12],[988,.24]],
  delivered:    [[523,0],[659,.10],[784,.20],[1047,.30]],
  cancelled:    [[380,0],[300,.22]],
};

async function beep(type) {
  const ctx = await getCtx();
  if (!ctx) return;
  try {
    (TONES[type] || TONES.confirmed).forEach(([f, t]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(f, ctx.currentTime + t);
      g.gain.setValueAtTime(0.30, ctx.currentTime + t);
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

// FIX C: always guard with permission check
function notify(title, body, tag, url) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body, tag,
      icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
      renotify: true,
      vibrate: [180, 80, 180],
    });
    n.onclick = () => { window.focus(); n.close(); if (url) window.location.href = url; };
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const SM = {
  PLACED:           { label: "Order Placed",     color: "#2563eb", sound: "new_order",    msg: "Waiting for restaurant to confirm."       },
  CONFIRMED:        { label: "Confirmed",         color: "#7c3aed", sound: "confirmed",    msg: "Restaurant confirmed your order."          },
  PREPARING:        { label: "Preparing",         color: "#b45309", sound: "preparing",    msg: "Your food is being freshly prepared."      },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "#0d9488", sound: "out_delivery", msg: "Delivery partner is heading your way."     },
  DELIVERED:        { label: "Delivered",         color: "#15803d", sound: "delivered",    msg: "Enjoy your meal!"                          },
  CANCELLED:        { label: "Cancelled",         color: "#dc2626", sound: "cancelled",    msg: "Your order was cancelled."                 },
};
const sc = k => SM[k] || { label: k, color: "#6b7280", sound: "confirmed", msg: "" };

const STEPS = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

const STEP_ICONS = {
  PLACED:           "○",
  CONFIRMED:        "✓",
  PREPARING:        "◈",
  OUT_FOR_DELIVERY: "→",
  DELIVERED:        "●",
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP TRACKER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Tracker({ orderId, init, soundRef, onClose }) {
  const [status, setStatus] = useState(init);
  const prev    = useRef(init);
  const timer   = useRef(null);

  // FIX: wrap soundRef in another ref so fetchStatus closure is always current
  const sndRef = useRef(soundRef);
  useEffect(() => { sndRef.current = soundRef; }, [soundRef]);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await axios.get(
        `https://deliverybackend-0i61.onrender.com/api/orders/${orderId}`,
        { withCredentials: true }
      );
      const ns = r.data?.order?.status || r.data?.status;
      if (!ns || ns === prev.current) return;
      const cfg = sc(ns);
      // FIX A: beep is now async, always resumes ctx
      if (sndRef.current?.current) await beep(cfg.sound);
      // FIX C: notify already guards internally
      notify(`${cfg.label}`, cfg.msg, `trk-${orderId}`, "/orders");
      prev.current = ns;
      setStatus(ns);
      if (ns === "DELIVERED" || ns === "CANCELLED") clearInterval(timer.current);
    } catch {}
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    // FIX B: run immediately, then every 8s
    fetchStatus();
    timer.current = setInterval(fetchStatus, 8_000);
    return () => clearInterval(timer.current);
  }, [fetchStatus, orderId]);

  const c      = sc(status);
  const idx    = STEPS.indexOf(status);
  const isDone = status === "DELIVERED" || status === "CANCELLED";

  return (
    <div className="tracker-card" style={{
      background: "#fff",
      border: `1px solid ${c.color}30`,
      borderLeft: `3px solid ${c.color}`,
      borderRadius: 12,
      padding: "16px 18px",
      marginBottom: 18,
      position: "relative",
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 10, right: 12,
        background: "none", border: "none", color: "#9ca3af",
        fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 0,
      }}>×</button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: c.color,
          animation: isDone ? "none" : "pulse-dot 1.6s ease infinite",
          flexShrink: 0,
        }}/>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.color, letterSpacing: "-.2px" }}>{c.label}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", marginTop: 1 }}>{c.msg}</p>
        </div>
        {!isDone && (
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af", fontFamily: "monospace", flexShrink: 0 }}>
            live · 8s
          </span>
        )}
      </div>

      {/* step bar */}
      {status !== "CANCELLED" && (
        <div style={{ display: "flex", alignItems: "center" }}>
          {STEPS.map((step, i) => {
            const filled = i <= idx;
            const active = i === idx;
            const stepC  = sc(step);
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <div title={stepC.label} style={{
                  width: active ? 28 : 20,
                  height: active ? 28 : 20,
                  borderRadius: "50%",
                  background: filled ? c.color : "#e5e7eb",
                  color: filled ? "#fff" : "#9ca3af",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: active ? 11 : 9,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all .3s ease",
                  boxShadow: active ? `0 0 0 3px ${c.color}25` : "none",
                }}>
                  {STEP_ICONS[step]}
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2,
                    background: i < idx ? c.color : "#e5e7eb",
                    margin: "0 2px",
                    transition: "background .5s ease",
                  }}/>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p style={{ margin: "10px 0 0", fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>
        ORDER #{orderId.slice(-8).toUpperCase()}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST STACK
// ─────────────────────────────────────────────────────────────────────────────
function Toasts({ list, dismiss }) {
  if (!list.length) return null;
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      width: 320, maxWidth: "calc(100vw - 32px)",
      pointerEvents: "none",
    }}>
      {list.map(t => (
        <div key={t.id} style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: "#fff", borderRadius: 10,
          padding: "11px 13px",
          boxShadow: "0 4px 24px rgba(0,0,0,.10)",
          borderLeft: `3px solid ${t.color}`,
          animation: "toast-in .25s ease",
          pointerEvents: "all",
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0, marginTop: 4 }}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{t.title}</p>
            {t.msg && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{t.msg}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} style={{
            background: "none", border: "none", color: "#9ca3af",
            fontSize: 15, cursor: "pointer", padding: 0, flexShrink: 0,
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ICON COMPONENTS (no emoji, pure SVG)
// ─────────────────────────────────────────────────────────────────────────────
const Icon = {
  Refresh: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
  ),
  SoundOn: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
    </svg>
  ),
  SoundOff: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  ),
  Bell: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  BellOff: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M13.73 21a2 2 0 01-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 00-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Wifi: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/>
      <circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  WifiOff: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a11 11 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  Package: (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate();

  const [orders,           setOrders]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filter,           setFilter]           = useState("ALL");
  const [toasts,           setToasts]           = useState([]);
  const [perm,             setPerm]             = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [soundOn,          setSoundOn]          = useState(true);
  const [polling,          setPolling]          = useState(true);
  const [lastPoll,         setLastPoll]         = useState(null);
  const [online,           setOnline]           = useState(navigator.onLine);
  const [bannerDismissed,  setBannerDismissed]  = useState(false);

  // tracker state
  const [trkId,    setTrkId]    = useState(null);
  const [trkInit,  setTrkInit]  = useState(null);
  const [showTrk,  setShowTrk]  = useState(false);

  // ── refs (all mutable state that intervals/closures need) ─────────────
  const soundRef   = useRef(true);   // FIX F: initialized to true, matches useState
  const showTrkRef = useRef(false);  // FIX E
  const pollingRef = useRef(true);
  const onlineRef  = useRef(true);
  const navRef     = useRef(navigate); // FIX H
  const knownSt    = useRef({});
  const pollTimer  = useRef(null);
  const toastSeq   = useRef(0);

  useEffect(() => { soundRef.current   = soundOn;  }, [soundOn]);
  useEffect(() => { showTrkRef.current  = showTrk;  }, [showTrk]);
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

  // ── network status ────────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => { setOnline(true);  addToast("Back online", "Syncing orders…", "#15803d"); };
    const down = () => { setOnline(false); addToast("Offline", "No live updates until reconnected.", "#dc2626"); };
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, [addToast]);

  // ── unlock audio on first interaction ────────────────────────────────
  useEffect(() => {
    const unlock = () => { getCtx(); }; // initializes + resumes
    window.addEventListener("click",     unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click",      unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // ── notification permission ───────────────────────────────────────────
  useEffect(() => { askPermission().then(setPerm); }, []);

  // ─────────────────────────────────────────────────────────────────────
  // FIX D: fetchOrders as a useRef function — truly stable, never stale
  // All external values read via refs at call time
  // ─────────────────────────────────────────────────────────────────────
  const fetchOrders = useRef(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        "https://deliverybackend-0i61.onrender.com/api/orders/my-orders",
        { withCredentials: true }
      );
      if (!res.data?.success) return;

      const incoming    = res.data.orders;
      const prev        = knownSt.current;
      const isFirstLoad = Object.keys(prev).length === 0;

      for (const order of incoming) {
        const { _id: oid, status: ns, restaurant } = order;
        const os   = prev[oid];
        const cfg  = sc(ns);
        const rest = restaurant?.name || "restaurant";

        if (!os && !isFirstLoad) {
          // brand-new order
          if (soundRef.current) await beep("new_order"); // FIX A: await async beep
          notify("New Order", `From ${rest}`, `new-${oid}`, "/orders");
          const id = ++toastSeq.current;
          setToasts(p => [...p, { id, title: "New order placed", msg: `From ${rest}`, color: "#2563eb" }]);
          setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 8000);
          if (!showTrkRef.current) { setTrkId(oid); setTrkInit(ns); setShowTrk(true); } // FIX E

        } else if (os && os !== ns) {
          // status changed
          if (soundRef.current) await beep(cfg.sound); // FIX A
          notify(cfg.label, cfg.msg, `st-${oid}`, "/orders"); // FIX C: notify guards internally
          const id = ++toastSeq.current;
          setToasts(p => [...p, { id, title: cfg.label, msg: cfg.msg, color: cfg.color }]);
          setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 8000);
          if (!showTrkRef.current) { setTrkId(oid); setTrkInit(ns); setShowTrk(true); }
        }

        prev[oid] = ns;
      }

      knownSt.current = prev;
      setOrders(incoming);
      setLastPoll(new Date());

    } catch (err) {
      if (err?.response?.status === 401) navRef.current("/login");
      if (!silent) {
        const id = ++toastSeq.current;
        setToasts(p => [...p, { id, title: "Could not load orders", msg: "Check your connection.", color: "#dc2626" }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  });

  // initial load
  useEffect(() => { fetchOrders.current(false); }, []);

  // polling — re-registers only when polling/online actually change
  useEffect(() => {
    clearInterval(pollTimer.current);
    if (polling && online) {
      pollTimer.current = setInterval(() => {
        if (pollingRef.current && onlineRef.current) fetchOrders.current(true);
      }, 20_000);
    }
    return () => clearInterval(pollTimer.current);
  }, [polling, online]);

  // ── cancel order ──────────────────────────────────────────────────────
  const cancelOrder = async oid => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const r = await axios.patch(
        `https://deliverybackend-0i61.onrender.com/api/orders/${oid}/cancel`,
        {}, { withCredentials: true }
      );
      if (r.data?.success) {
        if (soundRef.current) await beep("cancelled");
        notify("Order Cancelled", "Your order was cancelled.", `cx-${oid}`, "/orders");
        addToast("Order cancelled", "", "#dc2626");
        fetchOrders.current(true);
      }
    } catch (e) {
      addToast("Cancel failed", e?.response?.data?.error || "Please try again.", "#dc2626");
    }
  };

  // ── enable notifications ──────────────────────────────────────────────
  const enableNotifs = async () => {
    await getCtx(); // unlock audio in same gesture
    const p = await askPermission();
    setPerm(p);
    if (p === "granted") { await beep("confirmed"); addToast("Notifications enabled", "You'll receive live order updates.", "#15803d"); }
    else if (p === "denied") addToast("Notifications blocked", "Allow them in your browser settings.", "#dc2626");
  };

  // ── derived ───────────────────────────────────────────────────────────
  const ACTIVE_ST = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];

  const view =
    filter === "ACTIVE"    ? orders.filter(o => ACTIVE_ST.includes(o.status)) :
    filter === "COMPLETED" ? orders.filter(o => o.status === "DELIVERED") :
    filter === "CANCELLED" ? orders.filter(o => o.status === "CANCELLED") :
    orders;

  const fmtDate = ds => {
    const d    = new Date(ds);
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days === 0) return `Today · ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    if (days === 1) return "Yesterday";
    if (days < 7)  return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ── loading screen ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9fafb" }}>
      <div style={{ width: 32, height: 32, border: "2.5px solid #e5e7eb", borderTop: "2.5px solid #111827", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
      <p style={{ margin: "14px 0 0", color: "#9ca3af", fontSize: 13, fontFamily: "monospace", letterSpacing: ".05em" }}>loading orders</p>
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────
  return (
    <>
      <Toasts list={toasts} dismiss={rmToast}/>

      <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 20px 72px" }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-.5px" }}>My Orders</h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af", letterSpacing: ".02em" }}>
                {lastPoll
                  ? `last updated ${lastPoll.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "fetching…"}
              </p>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>

              {/* live / offline pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 99,
                background: online ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${online ? "#bbf7d0" : "#fecaca"}`,
                fontSize: 11, fontWeight: 600,
                color: online ? "#15803d" : "#b91c1c",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: online ? "#22c55e" : "#ef4444", display: "block", animation: online ? "pulse-dot 2s ease infinite" : "none" }}/>
                {online ? "live" : "offline"}
              </div>

              {/* polling toggle */}
              <button
                onClick={() => {
                  setPolling(p => !p);
                  addToast(polling ? "Auto-refresh paused" : "Auto-refresh on", polling ? "" : "Checking every 20s.", "#6b7280");
                }}
                title={polling ? "Pause auto-refresh" : "Resume auto-refresh"}
                style={{ ...IB, background: polling ? "#eff6ff" : "#f3f4f6", color: polling ? "#1d4ed8" : "#6b7280" }}
              >
                <Icon.Refresh width={14} height={14} style={{ animation: polling ? "spin 3s linear infinite" : "none" }}/>
              </button>

              {/* sound toggle */}
              <button
                onClick={() => {
                  getCtx(); // unlock
                  setSoundOn(v => {
                    const n = !v;
                    soundRef.current = n; // FIX F: sync ref immediately
                    if (n) beep("confirmed");
                    return n;
                  });
                }}
                title={soundOn ? "Mute" : "Unmute"}
                style={{ ...IB, background: soundOn ? "#fefce8" : "#f3f4f6", color: soundOn ? "#a16207" : "#6b7280" }}
              >
                {soundOn ? <Icon.SoundOn width={14} height={14}/> : <Icon.SoundOff width={14} height={14}/>}
              </button>

              {/* notification bell */}
              <button
                onClick={enableNotifs}
                title={perm === "granted" ? "Notifications on" : "Enable notifications"}
                style={{ ...IB, background: perm === "granted" ? "#f0fdf4" : "#fef2f2", color: perm === "granted" ? "#15803d" : "#b91c1c" }}
              >
                {perm === "granted" ? <Icon.Bell width={14} height={14}/> : <Icon.BellOff width={14} height={14}/>}
              </button>

              {/* manual refresh */}
              <button
                onClick={() => fetchOrders.current(false)}
                title="Refresh now"
                style={{ ...IB, background: "#f3f4f6", color: "#374151" }}
              >
                <Icon.Refresh width={14} height={14}/>
              </button>

            </div>
          </div>

          {/* ── NOTIFICATION BANNER ── */}
          {perm !== "granted" && !bannerDismissed && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "10px 14px", marginBottom: 18,
              fontSize: 12, color: "#92400e",
            }}>
              <Icon.Bell width={13} height={13} style={{ flexShrink: 0 }}/>
              <span style={{ flex: 1 }}>Enable notifications to receive live order updates even when this tab is in the background.</span>
              <button onClick={enableNotifs} style={{ background: "#f59e0b", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Enable</button>
              <button onClick={() => setBannerDismissed(true)} style={{ background: "none", border: "none", color: "#92400e", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
            </div>
          )}

          {/* ── LIVE TRACKER ── */}
          {showTrk && trkId && (
            <Tracker
              orderId={trkId}
              init={trkInit}
              soundRef={soundRef}
              onClose={() => setShowTrk(false)}
            />
          )}

          {/* ── FILTER TABS ── */}
          <div style={{
            display: "flex", gap: 3, marginBottom: 18,
            background: "#f3f4f6", padding: 3, borderRadius: 9,
            overflowX: "auto",
          }}>
            {[
              ["ALL",       `All  ${orders.length}`],
              ["ACTIVE",    `Active  ${orders.filter(o => ACTIVE_ST.includes(o.status)).length}`],
              ["COMPLETED", `Done  ${orders.filter(o => o.status === "DELIVERED").length}`],
              ["CANCELLED", `Cancelled  ${orders.filter(o => o.status === "CANCELLED").length}`],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  flex: 1, minWidth: "fit-content",
                  padding: "7px 14px", border: "none", borderRadius: 7,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  whiteSpace: "nowrap", transition: "all .15s",
                  background: filter === k ? "#fff" : "transparent",
                  color:      filter === k ? "#111827" : "#6b7280",
                  boxShadow:  filter === k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* ── ORDERS ── */}
          {view.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6" }}>
              <Icon.Package width={40} height={40} style={{ color: "#d1d5db", margin: "0 auto 16px", display: "block" }}/>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111827" }}>
                {filter === "ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>
                {filter === "ALL" ? "Head to a restaurant and place your first order." : "Nothing to show here."}
              </p>
              {filter === "ALL" && (
                <button
                  onClick={() => navigate("/restaurants")}
                  style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 9, padding: "10px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Browse Restaurants
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {view.map(order => {
                const c   = sc(order.status);
                const ac  = ACTIVE_ST.includes(order.status);
                const idx = STEPS.indexOf(order.status);
                return (
                  <div key={order._id} style={{
                    background: "#fff",
                    borderRadius: 13,
                    border: `1px solid ${ac ? c.color + "28" : "#f3f4f6"}`,
                    overflow: "hidden",
                    transition: "border-color .3s",
                  }}>
                    {/* active accent bar */}
                    {ac && (
                      <div style={{ height: 2, background: `linear-gradient(90deg, ${c.color}, ${c.color}44)` }}/>
                    )}

                    <div style={{ padding: "16px 18px" }}>

                      {/* ── card header ── */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: ac ? 12 : 14 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {order.restaurant?.name || "Restaurant"}
                          </h3>
                          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", letterSpacing: ".02em" }}>{fmtDate(order.orderDate)}</p>
                        </div>
                        {/* status badge */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "4px 10px", borderRadius: 99,
                          background: `${c.color}0d`,
                          border: `1px solid ${c.color}22`,
                          flexShrink: 0,
                        }}>
                          {ac && <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, animation: "pulse-dot 1.4s ease infinite" }}/>}
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.color, letterSpacing: ".02em" }}>{c.label}</span>
                        </div>
                      </div>

                      {/* ── mini step bar (active only) ── */}
                      {ac && (
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 14, padding: "9px 10px", background: `${c.color}07`, borderRadius: 9 }}>
                          {STEPS.map((step, i) => {
                            const filled = i <= idx, active = i === idx;
                            const stepC  = sc(step);
                            return (
                              <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                                <div title={stepC.label} style={{
                                  width: active ? 26 : 18, height: active ? 26 : 18,
                                  borderRadius: "50%",
                                  background: filled ? c.color : "#e5e7eb",
                                  color: filled ? "#fff" : "#9ca3af",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: active ? 10 : 8, fontWeight: 700,
                                  flexShrink: 0, transition: "all .3s",
                                  boxShadow: active ? `0 0 0 3px ${c.color}1a` : "none",
                                }}>
                                  {STEP_ICONS[step]}
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div style={{ flex: 1, height: 1.5, background: i < idx ? c.color : "#e5e7eb", margin: "0 2px", transition: "background .4s" }}/>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ── items ── */}
                      <div style={{ marginBottom: 14 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "5px 0",
                            borderBottom: i < order.items.length - 1 ? "1px solid #f9fafb" : "none",
                          }}>
                            {item.image && (
                              <img src={item.image} alt={item.name} style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }}/>
                            )}
                            <span style={{ flex: 1, fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>×{item.quantity}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", flexShrink: 0 }}>
                              ₹{(item.price * item.quantity).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* ── footer: total + actions ── */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>₹{order.total.toFixed(0)}</span>
                          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>
                            incl. tax + delivery
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => navigate(`/restaurant/${order.restaurant._id}`)}
                            style={PB}
                          >
                            Order again
                          </button>
                          {["PLACED", "CONFIRMED"].includes(order.status) && (
                            <button
                              onClick={() => cancelOrder(order._id)}
                              style={{ ...PB, background: "#fff", color: "#b91c1c", border: "1px solid #fecaca" }}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/order/${order._id}`)}
                            style={{ ...PB, background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON BASE STYLES
// ─────────────────────────────────────────────────────────────────────────────
const IB = { // icon button
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer", flexShrink: 0,
};

const PB = { // pill button
  padding: "6px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#111827", color: "#fff",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS — injected once, guarded against HMR double-inject (FIX G)
// ─────────────────────────────────────────────────────────────────────────────
if (!document.getElementById("orders-styles")) {
  const el = document.createElement("style");
  el.id = "orders-styles";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

    @keyframes spin      { to { transform: rotate(360deg); } }
    @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(1.5); } }
    @keyframes toast-in  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }

    * { box-sizing: border-box; }

    button { transition: opacity .15s, transform .15s; }
    button:hover:not(:disabled)  { opacity: .8; transform: translateY(-1px); }
    button:active:not(:disabled) { opacity: 1;  transform: translateY(0);    }
    button:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }

    /* scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }

    @media (max-width: 480px) {
      .orders-actions { flex-direction: column !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  `;
  document.head.appendChild(el);
}