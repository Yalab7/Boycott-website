const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A product must have a name."],
    maxlength: [40, "A product name must be at most 40 characters"],
    minlength: [1, "A product name must be at least 1 character"],
  },
  category: {
    type: String,
    required: [true, "A product must have a category."],
    maxlength: [40, "A product category name must be at most 40 characters"],
    minlength: [1, "A product category name must be at least 1 character"],
  },
  img_url: {
    type: String,
    default: "",
    validate: [
      //wrapper for making it not required
      (val) => {
        if (val.length !== 0) validator.isURL(val);
        else {
          return 1;
        }
      },
      "The image URL must be valid.",
    ],
    required: [true, "A product must have an image."],
  },
  references: {
    type: [String],
    default: [],
    validator: function (array) {
      return array.every(
        (v) => typeof v === "string" && v.length > 0 && v.length < 80
      );
    },
    required: [true, "A product must have at least one reference."],
  },
  alternatives: {
    type: [String],
    default: [],
    validator: function (array) {
      return array.every(
        (v) => typeof v === "string" && v.length > 0 && v.length < 80
      );
    },
    required: [true, "A product must have at least one alternative."],
  },
  notes: {
    type: String,
    required: [false, ""],
  },
});

productSchema.index({ name: 1, category: 1 }, { unique: true });

// //All find querries
productSchema.pre(/^find/, function (next) {
  this.select({
    __v: 0,
  });
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
