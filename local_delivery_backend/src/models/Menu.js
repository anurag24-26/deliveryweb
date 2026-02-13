const mongoose = require("mongoose");
const MenuSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: String,

    image: {
      type: String,
      default: ""
    },

    isVeg: {
      type: Boolean,
      default: true // true = Veg, false = Non-Veg
    },

    isBestSeller: {
      type: Boolean,
      default: false
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", MenuSchema);
