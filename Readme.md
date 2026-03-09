# 📦 deliveryweb — Developer Reference Notes

**GitHub:** https://github.com/anurag24-26/deliveryweb  
**Live:** https://deliveryweb-navy.vercel.app  

**Tags:**  
`MERN Stack` `Local Delivery App` `Google OAuth` `Cloudinary Images` `Leaflet Maps` `React 19` `Vite 7`

---

# 🛠️ Tech Stack

## ⚙️ Backend
- **Node.js** — Runtime
- **Express 4** — Server
- **MongoDB** — Database
- **Mongoose 8** — ODM
- **Passport.js**
- **passport-google-oauth20**
- **express-session**
- **connect-mongo** — Sessions
- **Cloudinary ^1.41**
- **Multer ^2.0**
- **multer-storage-cloudinary**
- **EJS 5** — Admin views
- **dotenv + cors**

## 🖥️ Frontend
- **React 19**
- **Vite 7**
- **react-router-dom 7**
- **axios**
- **Leaflet ^1.9**
- **react-leaflet 5**
- **lucide-react**
- **@vercel/analytics**
- **Vercel Hosting**

---

# 🗄️ Data Models

## 👤 User

| Field | Type | Notes |
|------|------|------|
| googleId | String | From Google OAuth |
| name | String | From Google profile |
| email | String | From Google profile |
| avatar | String | Google profile picture |
| role | USER / RESTAURANT | Default USER |
| phone | String | Optional |
| address | addressSchema | flat, area, locality, pincode |
| location | locationSchema | address + lat + lng |
| createdAt / updatedAt | Date | timestamps |

---

## 🍽️ Restaurant

| Field | Type | Notes |
|------|------|------|
| owner | ObjectId → User | Required |
| name | String | Restaurant name |
| address | String | Text address |
| phone | String | Contact number |
| location | locationSchema | Geo location |
| menu[] | Array | `{item, price}` |

---

## 🍕 Menu

| Field | Type | Default | Notes |
|------|------|------|------|
| restaurant | ObjectId → Restaurant | — | Required |
| name | String | — | Item name |
| price | Number | — | Item price |
| description | String | — | Optional |
| image | String | "" | Cloudinary URL |
| isVeg | Boolean | true | Veg / Non-veg |
| isBestSeller | Boolean | false | Badge |
| isAvailable | Boolean | true | Toggle item |
| createdAt / updatedAt | Date | — | timestamps |

---

## 📦 Order

| Field | Type | Notes |
|------|------|------|
| user | ObjectId → User | Required |
| restaurant | ObjectId → Restaurant | Required |
| items[] | Array | menuItemId, name, price, quantity |
| subtotal | Number | Before taxes |
| taxes | Number | Tax amount |
| deliveryFee | Number | Delivery charge |
| total | Number | subtotal + taxes + delivery |
| deliveryAddress | String | Address snapshot |
| status | Enum | Order state |
| orderDate | Date | Default Date.now |
| statusUpdatedAt | Date | Updated manually |

---

## 📍 locationSchema

| Field | Type | Notes |
|------|------|------|
| address | String | Readable address |
| lat | Number | Latitude |
| lng | Number | Longitude |

---

# 🔗 Model Relationships
User ───── owns ─────> Restaurant
Restaurant ── has many ──> Menu items
User ───── places ─────> Order
Restaurant ─ receives ─> Order
Order.items[] ─ snapshot of ─> Menu item
User + Restaurant ─ embed ─> locationSchema


⚠️ **Important:**  
`Order.items[]` stores a **price snapshot**, so price changes later do not affect old orders.

---

# 📋 Order Status Flow


PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED


Alternative path:


PLACED → CANCELLED
CONFIRMED → CANCELLED


Always update:


statusUpdatedAt = Date.now()


---

# ⚡ DB Indexes (Order model)


{ user: 1, orderDate: -1 }
{ restaurant: 1, orderDate: -1 }
{ status: 1 }


Used for:

- Orders by user
- Orders by restaurant
- Status filtering

---

# 🔐 Environment Variables

| Variable | Used By | Purpose |
|--------|--------|--------|
| MONGO_URI | server.js | MongoDB connection |
| SESSION_SECRET | express-session | Cookie encryption |
| ADMIN_PASSWORD | adminRoutes | Admin login |
| GOOGLE_CLIENT_ID | passport | OAuth |
| GOOGLE_CLIENT_SECRET | passport | OAuth |
| CLOUDINARY_CLOUD_NAME | Cloudinary | Upload |
| CLOUDINARY_API_KEY | Cloudinary | Upload |
| CLOUDINARY_API_SECRET | Cloudinary | Upload |
| PORT | server.js | Default 5000 |

---

# 🔌 API Route Map

| Prefix | File | Purpose | Auth |
|------|------|------|------|
| /api/auth | authRoutes.js | OAuth login/logout | Passport |
| /api/restaurants | restaurantRoutes.js | Restaurant CRUD | RESTAURANT role |
| /api/menu | menuRoutes.js | Menu CRUD + images | Restaurant owner |
| /api/orders | orderRoutes.js | Orders | User session |
| /api/profile | profileRoutes.js | Profile update | User |
| /admin | adminRoutes.js | Admin panel | Password |

---

# ✅ Feature Tracker

| Feature | Status | Notes |
|------|------|------|
| Google OAuth Login | ✅ DONE | Passport |
| User Roles | ✅ DONE | Enum |
| Restaurant Profiles | ✅ DONE | Geo support |
| Menu CRUD | ✅ DONE | Cloudinary |
| Order Placement | ✅ DONE | Pricing |
| Order Status | ✅ DONE | 6 stages |
| Geo Location | ✅ DONE | Leaflet |
| Admin Panel | ✅ DONE | EJS |
| Vercel Analytics | ✅ DONE | Tracking |
| WhatsApp Notifications | 🟦 Planned | Meta API |
| Payment Gateway | 🟦 Planned | Razorpay |
| Real-time Updates | 🟦 Planned | Socket.io |
| Admin Order Status | 🟦 Planned | Dropdown |
| Admin Delete | 🟦 Planned | Moderation |
| Pagination | 🟦 Planned | Skip/limit |
| Rate Limiting | 🟦 Planned | Security |

---

# 🚀 Next Steps

### HIGH PRIORITY
- WhatsApp notifications via **Meta Cloud API**
- Move `ADMIN_PASSWORD` to `.env`
- Add **rate limiting** on `/admin/login`

### MEDIUM
- Integrate **Razorpay payments**
- Admin **change order status**
- Admin **pagination**

### LOW
- Add **Socket.io real-time updates**
- Remove legacy `Restaurant.menu[]`
- Ensure `statusUpdatedAt` always updates

---

deliveryweb · @anurag_.tech  
Developer Notes · March 2026