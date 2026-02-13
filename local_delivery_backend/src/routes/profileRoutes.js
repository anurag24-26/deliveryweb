const router = require("express").Router();
const User = require("../models/User");

/**
 * GET /auth/me - Get current logged-in user with address
 */
router.get("/me", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.user._id)
      .select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE profile - Combined endpoint for phone, address, and location
 */
router.put("/update", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const { phone, address, location } = req.body;

    // Build update object
    const updateData = {};
    
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (location) {
      // Validate location has lat and lng
      if (!location.lat || !location.lng) {
        return res.status(400).json({ 
          message: "Location must have lat and lng" 
        });
      }
      updateData.location = location;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;