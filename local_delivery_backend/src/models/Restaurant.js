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
  location: locationSchema,

  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 5;
      },
      message: "Maximum 5 images allowed"
    }
  },

  menu: [{ item: String, price: Number }]
});

module.exports = mongoose.model("Restaurant", RestaurantSchema);