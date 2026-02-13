const router = require("express").Router();
const Menu = require("../models/Menu");
const Restaurant = require("../models/Restaurant");
const { parser } = require("../config/cloudinary");

/**
 * GET menu for a restaurant (PUBLIC)
 * NOW INCLUDES RESTAURANT DATA WITH LOCATION
 */
router.get("/:restaurantId", async (req, res) => {
  try {
    const menu = await Menu.find({
      restaurant: req.params.restaurantId,
      isAvailable: true
    }).populate("restaurant", "name address phone location"); // ADD THIS// ADD THIS LINE

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ADD menu item (RESTAURANT ONLY)
 * Supports: image upload via Cloudinary or direct URL
 */
router.post("/add", parser.single("image"), async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(400).json({ message: "Restaurant not found" });
    }

    let imageUrl = "";

    // If file uploaded, take Cloudinary URL
    if (req.file && req.file.path) {
      imageUrl = req.file.path;
    } else if (req.body.image) {
      // If direct URL provided in request body
      imageUrl = req.body.image;
    }

    const menu = await Menu.create({
      restaurant: restaurant._id,
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      image: imageUrl,
      isVeg: req.body.isVeg,
      isBestSeller: req.body.isBestSeller
    });

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE menu item (OWNER ONLY)
 */
router.delete("/:id", async (req, res) => {
  try {
    if (!req.user || req.user.role !== "RESTAURANT") {
      return res.status(403).json({ message: "Access denied" });
    }

    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;