const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  address: String, // full readable address from map
  lat: Number,
  lng: Number
}, { _id: false });

module.exports = locationSchema;
