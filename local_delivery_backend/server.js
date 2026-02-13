require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");

require("./src/config/passport");

const app = express();

/* =======================
   BODY PARSER
======================= */
app.use(express.json());

/* =======================
   CORS (CORRECT)
======================= */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

// handle preflight requests
app.options(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

/* =======================
   SESSION
======================= */
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax" // localhost safe
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
app.listen(5000, () =>
  console.log("Burning the backend at 5000")
);
