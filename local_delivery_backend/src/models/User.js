const mongoose = require("mongoose");
const locationSchema = require("./locationSchema");

const addressSchema = new mongoose.Schema({
  flat: String,
  area: String,
  locality: String,
  pincode: String
});

const userSchema = new mongoose.Schema({
  googleId: String,
  name: String,
  email: String,
  avatar: String,
  role: {
    type: String,
    enum: ["USER", "RESTAURANT"],
    default: "USER"
  },
  phone: String,
  address: addressSchema,

  // 🆕 NEW
  location: locationSchema
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
