const mongoose = require("mongoose");
const validator = require("validator");

const categorySchema = new mongoose.Schema({
  name: {
    ar: {
      type: String,
      required: [true, "A category must have an Arabic name."],
      maxlength: [40, "A category name must be at most 40 characters"],
      minlength: [1, "A category name must be at least 1 character"],
    },
    en: {
      type: String,
      required: [true, "A category must have an English name."],
      maxlength: [40, "A category name must be at most 40 characters"],
      minlength: [1, "A category name must be at least 1 character"],
    },
  }
});

categorySchema.index(
  { name: 1 },
  {
    unique: true,
  }
);

const Category = mongoose.model("Category", categorySchema);



const productAlternativeSchema = new mongoose.Schema({
  name: {
    ar: {
      type: String,
      required: [true, "An alternative must have an Arabic name."],
      maxlength: [40, "An alternative name must be at most 40 characters"],
      minlength: [1, "An alternative name must be at least 1 character"],
    },
    en: {
      type: String,
      required: [true, "An alternative must have an English name."],
      maxlength: [40, "An alternative name must be at most 40 characters"],
      minlength: [1, "An alternative name must be at least 1 character"],
    },
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
    required: [false, "An alternative doesn't need to have an image."],
  },
});

const ProductAlternative = mongoose.model("ProductAlternative", productAlternativeSchema);

const productSchema = new mongoose.Schema({
  name: {
    ar: {
      type: String,
      required: [true, "A product must have an Arabic name."],
      maxlength: [40, "A product name must be at most 40 characters"],
      minlength: [1, "A product name must be at least 1 character"],
    },
    en: {
      type: String,
      required: [true, "A product must have an English name."],
      maxlength: [40, "A product name must be at most 40 characters"],
      minlength: [1, "A product name must be at least 1 character"],
    },
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: "Category",
    required: [true, "A product must have a category."],
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
  boycott_why: {
    en: {
      type: String,
      required: [true, "A product must have an English boycott reason."],
      maxlength: [200, "A boycott reason must be at most 200 characters"],
      minlength: [1, "A boycott reason must be at least 1 character"],
    },
    ar: {
      type: String,
      required: [true, "A product must have an Arabic boycott reason."],
      maxlength: [200, "A boycott reason must be at most 200 characters"],
      minlength: [1, "A boycott reason must be at least 1 character"],
    },
  },
  sources: {
    type: [String], // array of urls
    default: [],
  },
  alternatives: {
    type: [productAlternativeSchema],
    default: [],
  },
  isSuspected: {
    type: Boolean,
    default: false
  }
});

productSchema.index(
  { name: 1, category: 1 },
  {
    unique: true,
  }
);
productSchema.index(
  {'name.en': 'text', 'name.ar': 'text'}
)


// //All find querries
productSchema.pre(/^find/, function (next) {
  this.select({
    __v: 0,
  });
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = { Product, Category, ProductAlternative };
