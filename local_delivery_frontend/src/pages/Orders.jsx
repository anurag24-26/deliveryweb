import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://deliverybackend-0i61.onrender.com";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const lastStatusRef = useRef({});
  const pollRef = useRef(null);

  const playSound = async () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (err) {
      console.log("sound error", err);
    }
  };

  const notify = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/orders/my-orders`);
      const newOrders = res.data || [];

      newOrders.forEach((order) => {
        const prev = lastStatusRef.current[order._id];

        if (prev && prev !== order.status) {
          playSound();
          notify(
            "Order Update",
            `Order ${order._id.slice(-5)} is now ${order.status}`
          );
        }

        lastStatusRef.current[order._id] = order.status;
      });

      setOrders(newOrders);
    } catch (err) {
      console.log("fetch error", err);
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    fetchOrders();

    pollRef.current = setInterval(fetchOrders, 8000);

    return () => clearInterval(pollRef.current);
  }, []);

  return (
    <div className="orders-page">
      <h1 className="title">Your Orders</h1>

      {orders.length === 0 && (
        <p className="empty">No orders yet</p>
      )}

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div className="order-top">
              <span className="order-id">
                #{order._id.slice(-6)}
              </span>

              <span className={`status ${order.status}`}>
                {order.status}
              </span>
            </div>

            <div className="items">
              {order.items.map((item, i) => (
                <div key={i} className="item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="order-bottom">
              <span className="price">
                ₹{order.totalAmount}
              </span>

              <span className="time">
                {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`

.orders-page{
padding:16px;
max-width:900px;
margin:auto;
font-family:sans-serif;
}

.title{
font-size:22px;
margin-bottom:16px;
text-align:center;
}

.empty{
text-align:center;
color:#777;
}

.orders-list{
display:flex;
flex-direction:column;
gap:12px;
}

.order-card{
background:#fff;
border-radius:10px;
padding:14px;
box-shadow:0 2px 8px rgba(0,0,0,0.08);
display:flex;
flex-direction:column;
gap:10px;
}

.order-top{
display:flex;
justify-content:space-between;
align-items:center;
}

.order-id{
font-weight:600;
}

.status{
padding:4px 8px;
border-radius:6px;
font-size:12px;
text-transform:capitalize;
}

.status.pending{
background:#fff3cd;
color:#856404;
}

.status.accepted{
background:#d4edda;
color:#155724;
}

.status.preparing{
background:#cce5ff;
color:#004085;
}

.status.delivered{
background:#e2e3e5;
color:#383d41;
}

.items{
display:flex;
flex-direction:column;
gap:4px;
font-size:14px;
}

.item{
display:flex;
justify-content:space-between;
}

.order-bottom{
display:flex;
justify-content:space-between;
font-size:14px;
font-weight:600;
}

.price{
color:#2e7d32;
}

.time{
color:#777;
}

@media(min-width:768px){

.orders-list{
grid-template-columns:1fr 1fr;
display:grid;
}

.order-card{
padding:18px;
}

.title{
font-size:26px;
}

}

`}</style>
    </div>
  );
}