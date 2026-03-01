require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");

require("./src/config/passport");

const app = express();

/* =======================
   BODY PARSER
======================= */
app.use(express.json());

/* =======================
   CORS (CORRECT)
======================= */
app.use(cors({
  origin: "https://deliveryweb-navy.vercel.app",
  credentials: true
}));

// handle preflight requests
app.options(
  "*",
  cors({
    origin: "https://deliveryweb-navy.vercel.app",
    credentials: true
  })
);

app.set("trust proxy", 1);
/* =======================
   SESSION
======================= */

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions"
    }),
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);
/* =======================
   PASSPORT
======================= */
app.use(passport.initialize());
app.use(passport.session());

/* =======================
   DATABASE
======================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* =======================
   ROUTES
======================= */
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/restaurants", require("./src/routes/restaurantRoutes"));
app.use("/api/orders", require("./src/routes/orderRoutes"));
app.use("/api/menu", require("./src/routes/menuRoutes"));
app.use("/api/profile", require("./src/routes/profileRoutes"));

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);