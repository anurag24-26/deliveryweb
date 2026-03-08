const router = require("express").Router();
const Restaurant = require("../models/Restaurant");

const { parser } = require("../config/cloudinary"); // ← change this
/**
 * Get logged-in restaurant owner's restaurant
 */
router.get("/my", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found for this owner" });
    }

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Create restaurant (only once per owner) — min 1 image required
 */
router.post("/create", parser.array("images", 5), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, address, phone, location } = req.body;

    if (!name || !address || !phone) {
      return res.status(400).json({ message: "Name, address, and phone are required" });
    }

    // At least 1 image required
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one restaurant image is required" });
    }

    // Parse location — FormData sends it as a string
    let parsedLocation;
    if (location) {
      try {
        parsedLocation = typeof location === "string" ? JSON.parse(location) : location;
        if (!parsedLocation.lat || !parsedLocation.lng) {
          return res.status(400).json({ message: "Location must have lat and lng" });
        }
      } catch (e) {
        return res.status(400).json({ message: "Invalid location format" });
      }
    }

    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You have already created a restaurant" });
    }

    const imageUrls = req.files.map(file => file.path);

    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name,
      address,
      phone,
      location: parsedLocation,
      images: imageUrls,
      menu: []
    });

    res.status(201).json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * Update restaurant details — optionally replace images
 */
router.put("/update", parser.array("images", 5), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, address, phone, location } = req.body;

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found. Please create one first." });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;

    if (location) {
      try {
        const loc = typeof location === "string" ? JSON.parse(location) : location;
        if (!loc.lat || !loc.lng) {
          return res.status(400).json({ message: "Location must have lat and lng" });
        }
        updateData.location = loc;
      } catch (e) {
        return res.status(400).json({ message: "Invalid location format" });
      }
    }

    // If new images uploaded — replace all existing ones
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedRestaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/**
 * Delete one specific image from restaurant
 */
router.delete("/image", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Must keep at least 1 image
    if (restaurant.images.length <= 1) {
      return res.status(400).json({ message: "Cannot delete — restaurant must have at least 1 image" });
    }

    restaurant.images = restaurant.images.filter(img => img !== imageUrl);
    await restaurant.save();

    // Delete from Cloudinary
    try {
      const publicId = imageUrl.split("/").slice(-2).join("/").split(".")[0];
      await require("cloudinary").v2.uploader.destroy(publicId);
    } catch (cloudErr) {
      console.error("Cloudinary delete failed:", cloudErr);
      // Don't fail the request — DB already updated
    }

    res.json({ message: "Image deleted", images: restaurant.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUBLIC: Get all restaurants
 */
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .select("name address phone location images");  // ← added images

    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;