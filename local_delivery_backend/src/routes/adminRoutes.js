const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const Menu = require("../models/Menu");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

router.get("/", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.redirect("/admin/login");
});

router.get("/login", (req, res) => {
  res.render("admin/login", { error: null });
});

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { error: "Wrong password 💀" });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const users = await User.find().lean();
    const restaurants = await Restaurant.find().populate("owner").lean();
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("restaurant", "name")
      .sort({ orderDate: -1 })
      .lean();
    const menus = await Menu.find().populate("restaurant", "name").lean();

    const stats = {
      totalUsers: users.length,
      totalRestaurants: restaurants.length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
    };

    res.render("admin/dashboard", { users, restaurants, orders, menus, stats });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

module.exports = router;