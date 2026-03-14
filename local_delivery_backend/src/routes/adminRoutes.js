const express        = require("express");
const router         = express.Router();
const adminAuth      = require("../middleware/adminAuth");
const User           = require("../models/User");
const Restaurant     = require("../models/Restaurant");
const Order          = require("../models/Order");
const Menu           = require("../models/Menu");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// ─── Auth ──────────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.redirect("/admin/login");
});

router.get("/login", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.render("admin/login", { error: null });
});

router.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { error: "Incorrect password." });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get("/dashboard", adminAuth, async (req, res) => {
  try {
    const [users, restaurants, orders, menus] = await Promise.all([
      User.find().lean(),
      Restaurant.find().populate("owner").lean(),
      Order.find()
        .populate("user",       "name email")
        .populate("restaurant", "name")
        .sort({ orderDate: -1 })
        .lean(),
      Menu.find().populate("restaurant", "name").lean(),
    ]);

    const today      = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);

    const stats = {
      totalUsers:        users.length,
      activeUsers:       users.filter(u => !u.isBanned).length,
      bannedUsers:       users.filter(u => u.isBanned).length,
      totalRestaurants:  restaurants.length,
      visibleRestaurants: restaurants.filter(r => !r.isHidden).length,
      hiddenRestaurants:  restaurants.filter(r => r.isHidden).length,
      totalOrders:       orders.length,
      todayOrders:       todayOrders.length,
      totalRevenue:      orders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + (o.total || 0), 0),
      todayRevenue:      todayOrders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + (o.total || 0), 0),
      pendingOrders:     orders.filter(o => o.status === "PLACED").length,
      activeOrders:      orders.filter(o => ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY"].includes(o.status)).length,
      totalMenuItems:    menus.length,
      availableMenuItems: menus.filter(m => m.isAvailable).length,
    };

    res.render("admin/dashboard", { users, restaurants, orders, menus, stats, query: req.query });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

// ─── RESTAURANTS ───────────────────────────────────────────────────────────

// Hide restaurant (soft delete)
router.post("/restaurants/:id/hide", adminAuth, async (req, res) => {
  try {
    await Restaurant.findByIdAndUpdate(req.params.id, { isHidden: true });
    res.redirect("/admin/dashboard#restaurants");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Unhide restaurant
router.post("/restaurants/:id/unhide", adminAuth, async (req, res) => {
  try {
    await Restaurant.findByIdAndUpdate(req.params.id, { isHidden: false });
    res.redirect("/admin/dashboard#restaurants");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ─── USERS ─────────────────────────────────────────────────────────────────

// Ban user
router.post("/users/:id/ban", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBanned: true });
    res.redirect("/admin/dashboard#users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Unban user
router.post("/users/:id/unban", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isBanned: false });
    res.redirect("/admin/dashboard#users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Change user role
router.post("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ["user", "restaurant_owner", "admin"];
    if (!allowed.includes(role)) return res.status(400).send("Invalid role");
    await User.findByIdAndUpdate(req.params.id, { role });
    res.redirect("/admin/dashboard#users");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ─── ORDERS ────────────────────────────────────────────────────────────────

// Force-update order status
router.post("/orders/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PLACED","CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];
    if (!allowed.includes(status)) return res.status(400).send("Invalid status");
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.redirect("/admin/dashboard#orders");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete order permanently
router.post("/orders/:id/delete", adminAuth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard#orders");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ─── MENU ──────────────────────────────────────────────────────────────────

// Toggle menu item availability
router.post("/menu/:id/toggle", adminAuth, async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).send("Not found");
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.redirect("/admin/dashboard#menu");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete menu item
router.post("/menu/:id/delete", adminAuth, async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.redirect("/admin/dashboard#menu");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;