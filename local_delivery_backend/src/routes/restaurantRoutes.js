const router = require("express").Router();
const Restaurant = require("../models/Restaurant");

/**
 * Get logged-in restaurant owner's restaurant
 */
router.get("/my", async (req, res) => {
  try {
    // Check if user is logged in and has the correct role
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const restaurant = await Restaurant.findOne({
      owner: req.user._id
    });

    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found for this owner" });
    }

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create restaurant (only once per owner)
 */
router.post("/create", async (req, res) => {
  try {
    // 1. Authorization check
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, address, phone, location } = req.body;

    // 2. Validation
    if (!name || !address || !phone) {
      return res.status(400).json({
        message: "Name, address, and phone are required"
      });
    }

    // Validate location if provided
    if (location && (!location.lat || !location.lng)) {
      return res.status(400).json({
        message: "Location must have lat and lng"
      });
    }

    // 3. Check if the owner already has a restaurant
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({ 
        message: "You have already created a restaurant" 
      });
    }

    // 4. Create the restaurant
    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name,
      address,
      phone,
      location,
      menu: []
    });

    res.status(201).json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE restaurant details
 */
router.put("/update", async (req, res) => {
  try {
    // 1. Authorization check
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, address, phone, location } = req.body;

    // 2. Find the restaurant
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ 
        message: "No restaurant found. Please create one first." 
      });
    }

    // 3. Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    
    if (location) {
      // Validate location has lat and lng
      if (!location.lat || !location.lng) {
        return res.status(400).json({ 
          message: "Location must have lat and lng" 
        });
      }
      updateData.location = location;
    }

    // 4. Update the restaurant
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      updateData,
      { new: true }
    );

    res.json(updatedRestaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUBLIC: Get all restaurants (for users)
 */
router.get("/", async (req, res) => {
  try {
    // Return only necessary fields for the public list
    const restaurants = await Restaurant.find()
      .select("name address phone location");

    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;