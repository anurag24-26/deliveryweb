const mongoose = require("mongoose");
const locationSchema = require("./locationSchema");

const RestaurantSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: String,
  address: String,
  phone: String,

  // 🆕 NEW
  location: locationSchema,

  menu: [
    {
      item: String,
      price: Number
    }
  ]
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);
