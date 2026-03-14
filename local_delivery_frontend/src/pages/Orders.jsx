/**
 * Orders.jsx
 * Bugs fixed vs previous version:
 * 1. showTracker was a stale closure inside fetchOrders → now a ref
 * 2. navigate from useNavigate is unstable across renders → stored in ref
 * 3. AudioContext created fresh per call → singleton pattern
 * 4. soundRef not synced on first render (initialized to true but never set) → set in useState initializer
 * 5. CSS stylesheet appended multiple times on HMR → guard check
 * 6. fetchOrders useCallback dep array caused interval to re-register on every render → fully ref-based, zero deps
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─── AUDIO (singleton) ────────────────────────────────────────────────────────
let _ctx = null;
function getCtx() {
  try {
    if (!_ctx || _ctx.state === "closed")
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    return _ctx;
  } catch { return null; }
}

const TONES = {
  new_order:    [[523,0],[659,.15],[784,.3]],
  confirmed:    [[440,0],[550,.15]],
  preparing:    [[392,0],[494,.12],[587,.24]],
  out_delivery: [[659,0],[784,.12],[988,.24]],
  delivered:    [[523,0],[659,.1],[784,.2],[1047,.3]],
  cancelled:    [[400,0],[300,.22]],
};

function beep(type) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    (TONES[type] || TONES.confirmed).forEach(([f, t]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(f, ctx.currentTime + t);
      g.gain.setValueAtTime(0.35, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.32);
    });
  } catch {}
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
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
      icon:  "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
      renotify: true, vibrate: [180, 80, 180],
    });
    n.onclick = () => { window.focus(); n.close(); if (url) window.location.href = url; };
  } catch {}
}

// ─── STATUS MAP ───────────────────────────────────────────────────────────────
const SM = {
  PLACED:           { label:"Order Placed",     emoji:"🛒",  color:"#2563eb", sound:"new_order",    msg:"Waiting for restaurant to confirm." },
  CONFIRMED:        { label:"Confirmed",         emoji:"✅",  color:"#7c3aed", sound:"confirmed",    msg:"Restaurant confirmed your order." },
  PREPARING:        { label:"Preparing",         emoji:"👨‍🍳", color:"#d97706", sound:"preparing",   msg:"Your food is being prepared." },
  OUT_FOR_DELIVERY: { label:"Out for Delivery",  emoji:"🚗",  color:"#059669", sound:"out_delivery", msg:"Delivery partner is on the way." },
  DELIVERED:        { label:"Delivered",         emoji:"📦",  color:"#047857", sound:"delivered",    msg:"Enjoy your meal!" },
  CANCELLED:        { label:"Cancelled",         emoji:"✕",   color:"#dc2626", sound:"cancelled",    msg:"Your order was cancelled." },
};
const s = k => SM[k] || { label:k, emoji:"·", color:"#6b7280", sound:"confirmed", msg:"" };

const STEPS = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED"];

// ─── STEP TRACKER ─────────────────────────────────────────────────────────────
function Tracker({ orderId, init, soundRef, onClose }) {
  const [status, setStatus] = useState(init);
  const prev    = useRef(init);
  const timer   = useRef(null);
  // store soundRef as ref-to-ref so fetchStatus never goes stale
  const sndRef  = useRef(soundRef);
  useEffect(() => { sndRef.current = soundRef; }, [soundRef]);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await axios.get(
        `https://deliverybackend-0i61.onrender.com/api/orders/${orderId}`,
        { withCredentials: true }
      );
      const ns = r.data?.order?.status || r.data?.status;
      if (!ns || ns === prev.current) return;
      const cfg = s(ns);
      if (sndRef.current?.current) beep(cfg.sound);
      notify(`${cfg.emoji} ${cfg.label}`, cfg.msg, `t-${orderId}`, "/orders");
      prev.current = ns;
      setStatus(ns);
      if (ns === "DELIVERED" || ns === "CANCELLED") clearInterval(timer.current);
    } catch {}
  }, [orderId]); // orderId never changes — safe dep

  useEffect(() => {
    timer.current = setInterval(fetchStatus, 15_000);
    return () => clearInterval(timer.current);
  }, [fetchStatus]);

  const c   = s(status);
  const idx = STEPS.indexOf(status);
  const done = status === "DELIVERED" || status === "CANCELLED";

  return (
    <div style={{ background:"#fff", border:`1.5px solid ${c.color}25`, borderLeft:`4px solid ${c.color}`, borderRadius:16, padding:"18px 20px", marginBottom:20, position:"relative" }}>
      <button onClick={onClose} style={{ position:"absolute", top:12, right:14, background:"none", border:"none", fontSize:18, color:"#9ca3af", cursor:"pointer", lineHeight:1 }}>×</button>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <span style={{ fontSize:22 }}>{c.emoji}</span>
        <div>
          <p style={{ margin:0, fontSize:15, fontWeight:700, color:c.color }}>{c.label}</p>
          <p style={{ margin:0, fontSize:12, color:"#6b7280" }}>{c.msg}</p>
        </div>
        {!done && <span style={{ marginLeft:"auto", width:7, height:7, borderRadius:"50%", backgroundColor:c.color, animation:"blink 1.4s ease infinite", flexShrink:0 }}/>}
      </div>
      {/* step bar */}
      {status !== "CANCELLED" && (
        <div style={{ display:"flex", alignItems:"center" }}>
          {STEPS.map((step, i) => {
            const sc = s(step);
            const filled = i <= idx;
            const active = i === idx;
            return (
              <div key={step} style={{ display:"flex", alignItems:"center", flex: i < STEPS.length-1 ? 1 : "none" }}>
                <div style={{
                  width: active ? 30 : 22, height: active ? 30 : 22,
                  borderRadius:"50%",
                  background: filled ? c.color : "#e5e7eb",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: active ? 13 : 10,
                  flexShrink:0, transition:"all .35s ease",
                  boxShadow: active ? `0 0 0 3px ${c.color}22` : "none",
                }}>
                  {filled ? sc.emoji : <div style={{ width:5, height:5, borderRadius:"50%", background:"#d1d5db" }}/>}
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:2, background: i < idx ? c.color : "#e5e7eb", margin:"0 3px", transition:"background .5s ease" }}/>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p style={{ margin:"10px 0 0", fontSize:11, color:"#9ca3af", fontFamily:"monospace" }}>
        #{orderId.slice(-8).toUpperCase()} {!done && "· auto-updating every 15s"}
      </p>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toasts({ list, dismiss }) {
  if (!list.length) return null;
  return (
    <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, width:340, maxWidth:"calc(100vw - 32px)", pointerEvents:"none" }}>
      {list.map(t => (
        <div key={t.id} style={{ display:"flex", gap:10, background:"#fff", borderRadius:12, padding:"12px 14px", boxShadow:"0 8px 32px rgba(0,0,0,.12)", borderLeft:`3px solid ${t.color}`, animation:"slideIn .3s ease", pointerEvents:"all" }}>
          <span style={{ fontSize:18, flexShrink:0, lineHeight:"20px" }}>{t.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:13, fontWeight:700, color:"#111827" }}>{t.title}</p>
            {t.msg && <p style={{ margin:"2px 0 0", fontSize:12, color:"#6b7280", lineHeight:1.4 }}>{t.msg}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} style={{ background:"none", border:"none", color:"#9ca3af", fontSize:16, cursor:"pointer", flexShrink:0, alignSelf:"flex-start", padding:0 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate();

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("ALL");
  const [toasts,      setToasts]      = useState([]);
  const [perm,        setPerm]        = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [soundOn,     setSoundOn]     = useState(true);
  const [polling,     setPolling]     = useState(true);
  const [lastPoll,    setLastPoll]    = useState(null);
  const [online,      setOnline]      = useState(navigator.onLine);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  // tracker
  const [trkId,   setTrkId]   = useState(null);
  const [trkInit, setTrkInit] = useState(null);
  const [showTrk, setShowTrk] = useState(false);

  // ── ALL REFS — zero stale closure problems ────────────────────────────
  const soundRef    = useRef(true);    // current sound toggle value
  const showTrkRef  = useRef(false);   // current showTrk value
  const pollingRef  = useRef(true);    // current polling value
  const onlineRef   = useRef(true);    // current online value
  const navigateRef = useRef(navigate);// stable navigate ref
  const knownSt     = useRef({});      // { id: status }
  const pollTimer   = useRef(null);
  const toastN      = useRef(0);

  // keep refs in sync with state
  useEffect(() => { soundRef.current   = soundOn;  }, [soundOn]);
  useEffect(() => { showTrkRef.current  = showTrk;  }, [showTrk]);
  useEffect(() => { pollingRef.current  = polling;  }, [polling]);
  useEffect(() => { onlineRef.current   = online;   }, [online]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // ── Toast ─────────────────────────────────────────────────────────────
  const addToast = useCallback((title, msg, color, emoji, ms=6000) => {
    const id = ++toastN.current;
    setToasts(p => [...p, { id, title, msg, color, emoji }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);
  const rmToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  // ── Network ───────────────────────────────────────────────────────────
  useEffect(() => {
    const up   = () => { setOnline(true);  addToast("Back online", "Syncing…", "#059669","🌐"); };
    const down = () => { setOnline(false); addToast("Offline",     "No updates until reconnected.", "#dc2626","📡"); };
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online",up); window.removeEventListener("offline",down); };
  }, [addToast]);

  // ── Unlock audio on first click ───────────────────────────────────────
  useEffect(() => {
    const u = () => { try { getCtx()?.resume(); } catch {} };
    window.addEventListener("click", u, { once:true });
    return () => window.removeEventListener("click", u);
  }, []);

  // ── Request permission ────────────────────────────────────────────────
  useEffect(() => { askPermission().then(setPerm); }, []);

  // ──────────────────────────────────────────────────────────────────────
  //  fetchOrders — uses ONLY refs, zero deps → never re-creates
  //  This is the key fix: a stable function means setInterval always
  //  calls the latest logic without needing to re-register the interval.
  // ──────────────────────────────────────────────────────────────────────
  const fetchOrders = useRef(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(
        "https://deliverybackend-0i61.onrender.com/api/orders/my-orders",
        { withCredentials:true }
      );
      if (!res.data.success) return;

      const incoming    = res.data.orders;
      const prev        = knownSt.current;
      const isFirstLoad = Object.keys(prev).length === 0;

      incoming.forEach(order => {
        const { _id:oid, status:ns, restaurant } = order;
        const os   = prev[oid];
        const cfg  = s(ns);
        const rest = restaurant?.name || "restaurant";

        if (!os && !isFirstLoad) {
          // new order appeared
          if (soundRef.current) beep("new_order");
          notify("🛒 New Order!", `From ${rest}`, `new-${oid}`, "/orders");
          setToasts(p => {
            const id = ++toastN.current;
            setTimeout(() => setToasts(q => q.filter(t => t.id !== id)), 8000);
            return [...p, { id, title:"New Order! 🛒", msg:`From ${rest}`, color:"#2563eb", emoji:"🛒" }];
          });
          if (!showTrkRef.current) {
            setTrkId(oid); setTrkInit(ns); setShowTrk(true);
          }

        } else if (os && os !== ns) {
          // status changed
          if (soundRef.current) beep(cfg.sound);
          notify(`${cfg.emoji} ${cfg.label}`, cfg.msg, `st-${oid}`, "/orders");
          setToasts(p => {
            const id = ++toastN.current;
            setTimeout(() => setToasts(q => q.filter(t => t.id !== id)), 8000);
            return [...p, { id, title:`${cfg.emoji} ${cfg.label}`, msg:cfg.msg, color:cfg.color, emoji:cfg.emoji }];
          });
          if (!showTrkRef.current) {
            setTrkId(oid); setTrkInit(ns); setShowTrk(true);
          }
        }

        prev[oid] = ns;
      });

      knownSt.current = prev;
      setOrders(incoming);
      setLastPoll(new Date());

    } catch (err) {
      if (err.response?.status === 401) navigateRef.current("/login");
      if (!silent) {
        setToasts(p => {
          const id = ++toastN.current;
          setTimeout(() => setToasts(q => q.filter(t => t.id !== id)), 5000);
          return [...p, { id, title:"Could not load orders", msg:"Check connection.", color:"#dc2626", emoji:"⚠️" }];
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  });

  // initial load
  useEffect(() => { fetchOrders.current(false); }, []);

  // ── Polling — just reads pollingRef / onlineRef, interval is stable ───
  useEffect(() => {
    clearInterval(pollTimer.current);
    if (polling && online) {
      pollTimer.current = setInterval(() => {
        // double-check refs at call time (handles toggling without re-registering)
        if (pollingRef.current && onlineRef.current) fetchOrders.current(true);
      }, 20_000);
    }
    return () => clearInterval(pollTimer.current);
  }, [polling, online]); // only re-register when these actually change

  // ── Cancel ────────────────────────────────────────────────────────────
  const cancelOrder = async oid => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      const r = await axios.patch(
        `https://deliverybackend-0i61.onrender.com/api/orders/${oid}/cancel`,
        {}, { withCredentials:true }
      );
      if (r.data.success) {
        if (soundRef.current) beep("cancelled");
        notify("✕ Cancelled", "Your order was cancelled.", `cx-${oid}`, "/orders");
        addToast("Order Cancelled", "", "#dc2626", "✕");
        fetchOrders.current(true);
      }
    } catch (e) {
      addToast("Cancel failed", e.response?.data?.error || "Try again.", "#dc2626", "⚠️");
    }
  };

  // ── Enable notifications (also unlocks audio) ─────────────────────────
  const enableNotifs = async () => {
    try { getCtx()?.resume(); } catch {}
    const p = await askPermission();
    setPerm(p);
    if (p === "granted") { beep("confirmed"); addToast("Notifications on","Live updates enabled.","#059669","🔔"); }
    else if (p === "denied") addToast("Blocked","Allow in browser settings.","#dc2626","🔕");
  };

  // ── Filter ────────────────────────────────────────────────────────────
  const ACTIVE_ST = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"];
  const view = filter === "ACTIVE"    ? orders.filter(o => ACTIVE_ST.includes(o.status))
             : filter === "COMPLETED" ? orders.filter(o => o.status === "DELIVERED")
             : filter === "CANCELLED" ? orders.filter(o => o.status === "CANCELLED")
             : orders;

  const fmtDate = ds => {
    const d = new Date(ds), days = Math.floor((Date.now()-d)/86400000);
    if (days===0) return `Today · ${d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`;
    if (days===1) return "Yesterday";
    if (days<7)   return `${days}d ago`;
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#fafafa" }}>
      <div style={{ width:36, height:36, border:"3px solid #e5e7eb", borderTop:"3px solid #111", borderRadius:"50%", animation:"spin 0.9s linear infinite" }}/>
      <p style={{ marginTop:16, color:"#6b7280", fontSize:14, fontFamily:"monospace" }}>loading orders…</p>
    </div>
  );

  return (
    <>
      <Toasts list={toasts} dismiss={rmToast}/>

      <div style={{ minHeight:"100vh", background:"#fafafa", fontFamily:"'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 20px 60px" }}>

          {/* ── Header ── */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:28 }}>
            <div>
              <h1 style={{ margin:0, fontSize:28, fontWeight:800, color:"#111827", letterSpacing:"-0.6px", lineHeight:1.1 }}>Orders</h1>
              <p style={{ margin:"4px 0 0", fontSize:13, color:"#9ca3af" }}>
                {lastPoll ? `Updated ${lastPoll.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}` : "Loading…"}
              </p>
            </div>

            {/* controls */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
              {/* online dot */}
              <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:99, background: online?"#dcfce7":"#fee2e2", fontSize:12, fontWeight:600, color: online?"#15803d":"#b91c1c" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background: online?"#22c55e":"#ef4444", display:"block", animation: online?"blink 2s ease infinite":"none" }}/>
                {online ? "live" : "offline"}
              </div>

              {/* poll toggle */}
              <button
                onClick={() => { setPolling(p => !p); addToast(polling?"Paused":"Resumed", polling?"Auto-refresh off.":"Checking every 20s.", "#6b7280", polling?"⏸":"▶"); }}
                title={polling?"Pause":"Resume"}
                style={{ ...CB, background: polling?"#eff6ff":"#f3f4f6", color: polling?"#1d4ed8":"#6b7280" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: polling?"spin 3s linear infinite":"none" }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>

              {/* sound toggle */}
              <button
                onClick={() => {
                  try { getCtx()?.resume(); } catch {}
                  setSoundOn(v => {
                    const n = !v;
                    soundRef.current = n;
                    if (n) setTimeout(() => beep("confirmed"), 40);
                    return n;
                  });
                }}
                title={soundOn?"Mute":"Unmute"}
                style={{ ...CB, background: soundOn?"#fefce8":"#f3f4f6", color: soundOn?"#a16207":"#6b7280" }}
              >
                {soundOn
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                }
              </button>

              {/* bell */}
              <button
                onClick={enableNotifs}
                title={perm==="granted"?"Notifications on":"Enable notifications"}
                style={{ ...CB, background: perm==="granted"?"#dcfce7":"#fee2e2", color: perm==="granted"?"#15803d":"#b91c1c" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              </button>

              {/* refresh */}
              <button onClick={() => fetchOrders.current(false)} title="Refresh now" style={{ ...CB, background:"#f3f4f6", color:"#374151" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>

          {/* ── Notif banner ── */}
          {perm !== "granted" && !noticeDismissed && (
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#92400e" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span style={{ flex:1 }}>Enable notifications for live updates even when this tab is in the background.</span>
              <button onClick={enableNotifs} style={{ background:"#f59e0b", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Enable</button>
              <button onClick={() => setNoticeDismissed(true)} style={{ background:"none", border:"none", color:"#92400e", fontSize:18, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>×</button>
            </div>
          )}

          {/* ── Tracker ── */}
          {showTrk && trkId && (
            <Tracker orderId={trkId} init={trkInit} soundRef={soundRef} onClose={() => setShowTrk(false)}/>
          )}

          {/* ── Filter tabs ── */}
          <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f3f4f6", padding:4, borderRadius:10, overflowX:"auto" }}>
            {[
              ["ALL",       `All (${orders.length})`],
              ["ACTIVE",    `Active (${orders.filter(o=>ACTIVE_ST.includes(o.status)).length})`],
              ["COMPLETED", `Done (${orders.filter(o=>o.status==="DELIVERED").length})`],
              ["CANCELLED", `Cancelled (${orders.filter(o=>o.status==="CANCELLED").length})`],
            ].map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ flex:1, minWidth:"fit-content", padding:"8px 14px", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s",
                  background: filter===k ? "#fff" : "transparent",
                  color: filter===k ? "#111827" : "#6b7280",
                  boxShadow: filter===k ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                }}>
                {l}
              </button>
            ))}
          </div>

          {/* ── Orders ── */}
          {view.length === 0 ? (
            <div style={{ textAlign:"center", padding:"64px 20px", background:"#fff", borderRadius:16, border:"1px solid #f3f4f6" }}>
              <p style={{ fontSize:36, margin:"0 0 12px" }}>📭</p>
              <h3 style={{ margin:"0 0 8px", fontSize:18, fontWeight:700, color:"#111827" }}>
                {filter==="ALL" ? "No orders yet" : `No ${filter.toLowerCase()} orders`}
              </h3>
              <p style={{ margin:"0 0 24px", fontSize:14, color:"#6b7280" }}>
                {filter==="ALL" ? "Place your first order to get started." : `Nothing here right now.`}
              </p>
              {filter==="ALL" && (
                <button onClick={() => navigate("/restaurants")} style={{ background:"#111827", color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Explore Restaurants
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {view.map(order => {
                const c  = s(order.status);
                const ac = ACTIVE_ST.includes(order.status);
                const idx = STEPS.indexOf(order.status);
                return (
                  <div key={order._id} style={{ background:"#fff", borderRadius:16, border:`1px solid ${ac ? c.color+"30" : "#f3f4f6"}`, overflow:"hidden", transition:"border-color .3s" }}>

                    {/* top accent line for active */}
                    {ac && <div style={{ height:3, background:`linear-gradient(90deg, ${c.color}, ${c.color}66)` }}/>}

                    <div style={{ padding:"18px 20px" }}>
                      {/* card head */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:ac?12:14 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <h3 style={{ margin:"0 0 3px", fontSize:16, fontWeight:700, color:"#111827", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {order.restaurant?.name || "Restaurant"}
                          </h3>
                          <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>{fmtDate(order.orderDate)}</p>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:99, background:`${c.color}10`, border:`1px solid ${c.color}25`, flexShrink:0 }}>
                          <span style={{ fontSize:13 }}>{c.emoji}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:c.color }}>{c.label}</span>
                          {ac && <span style={{ width:5, height:5, borderRadius:"50%", background:c.color, animation:"blink 1.4s ease infinite" }}/>}
                        </div>
                      </div>

                      {/* mini step bar inline for active orders */}
                      {ac && (
                        <div style={{ display:"flex", alignItems:"center", marginBottom:14, padding:"10px 12px", background:`${c.color}08`, borderRadius:10 }}>
                          {STEPS.map((step, i) => {
                            const sc = s(step);
                            const filled = i <= idx, active = i === idx;
                            return (
                              <div key={step} style={{ display:"flex", alignItems:"center", flex: i<STEPS.length-1?1:"none" }}>
                                <div style={{
                                  width:active?28:20, height:active?28:20,
                                  borderRadius:"50%", background: filled?c.color:"#e5e7eb",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:active?12:9, flexShrink:0, transition:"all .3s",
                                  boxShadow:active?`0 0 0 3px ${c.color}20`:"none",
                                }}>
                                  {filled ? sc.emoji : <div style={{ width:4, height:4, borderRadius:"50%", background:"#d1d5db" }}/>}
                                </div>
                                {i<STEPS.length-1 && <div style={{ flex:1, height:2, background:i<idx?c.color:"#e5e7eb", margin:"0 2px", transition:"background .4s" }}/>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* items compact */}
                      <div style={{ marginBottom:14 }}>
                        {order.items.map((item, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderBottom: i<order.items.length-1 ? "1px solid #f9fafb" : "none" }}>
                            {item.image && <img src={item.image} alt={item.name} style={{ width:36, height:36, borderRadius:7, objectFit:"cover", flexShrink:0 }}/>}
                            <span style={{ flex:1, fontSize:13, fontWeight:500, color:"#374151", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
                            <span style={{ fontSize:12, color:"#9ca3af", flexShrink:0 }}>×{item.quantity}</span>
                            <span style={{ fontSize:13, fontWeight:600, color:"#111827", flexShrink:0 }}>₹{(item.price*item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {/* total + actions */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                        <span style={{ fontSize:15, fontWeight:800, color:"#111827" }}>₹{order.total.toFixed(0)}</span>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => navigate(`/restaurant/${order.restaurant._id}`)} style={AB}>Again</button>
                          {["PLACED","CONFIRMED"].includes(order.status) && (
                            <button onClick={() => cancelOrder(order._id)} style={{ ...AB, background:"#fff1f2", color:"#b91c1c", border:"1px solid #fecdd3" }}>Cancel</button>
                          )}
                          <button onClick={() => navigate(`/order/${order._id}`)} style={{ ...AB, background:"#f9fafb", color:"#374151", border:"1px solid #e5e7eb" }}>Details</button>
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

// ─── SHARED BUTTON STYLES ─────────────────────────────────────────────────────
const CB = { display:"flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, border:"none", cursor:"pointer", flexShrink:0 };
const AB = { padding:"7px 14px", borderRadius:8, border:"1px solid #e5e7eb", background:"#111827", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" };

// ─── CSS (guard against double-inject on HMR) ─────────────────────────────────
if (!document.getElementById("orders-css")) {
  const el = document.createElement("style");
  el.id = "orders-css";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes spin    { to { transform:rotate(360deg); } }
    @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
    @keyframes slideIn { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
    button:hover:not(:disabled){ opacity:.85; transform:translateY(-1px); }
    button:active:not(:disabled){ transform:translateY(0); opacity:1; }
    button:focus-visible{ outline:2px solid #2563eb; outline-offset:2px; }
    @media(max-width:520px){
      div[style*="display:\"flex\""]:has(button){ flex-wrap:wrap; }
    }
    @media(prefers-reduced-motion:reduce){ *{ animation:none !important; transition:none !important; } }
  `;
  document.head.appendChild(el);
}