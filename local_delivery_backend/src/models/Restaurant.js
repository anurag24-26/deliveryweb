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

  // 🆕 Restaurant images
  images: {
    type: [String],   // array of Cloudinary URLs
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 5; // max 5 images
      },
      message: "Maximum 5 images allowed"
    }
  },

  menu: [{ item: String, price: Number }]
});