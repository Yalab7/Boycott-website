const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const catchAsync = require("../utils/catchAsync");
const { Product, Category, ProductAlternative } = require("../models/productModel");

//Multer
const multerTempStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/octet-stream" //for cross platform compatibility
  ) {
    callback(null, true);
  } else {
    callback(
      new AppError("Not an image please upload only images", 400),
      false
    );
  }
};
const upload = multer({
  storage: multerTempStorage,
  fileFilter: multerFilter,
});

exports.getProducts = catchAsync(async (req, res, next) => {

  try {

    // Pagination Setup
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 20;
    const skip = (page - 1) * limit;

    let goQuery = 1;
    let productsData = [];
    let totalProducts = 0;

    if (req.query.category && goQuery) {
      const category = req.query.category;
      // category is a ref to the category model inside the product model
      const categoryId = await Category.find({
        $or: [
          { 'name.en': { $regex: category, $options: 'i' } },
          { 'name.ar': { $regex: category, $options: 'i' } }
        ]
      }).select('_id').limit(1);

      if (categoryId.length === 0) {
        throw new Error("No such category found");
      }


      // Query products in the specified category
      const productsInCategory = await Product.find({ category: categoryId[0]._id });
      totalProducts = productsInCategory.length;

      productsData = await Product.find({ category: categoryId[0]._id })
        .skip(skip)
        .limit(limit)
        .populate('category');

      goQuery = false;
    }

    // No parameter case
    if (goQuery) {
      // Query all products
      const allProducts = await Product.find();
      totalProducts = allProducts.length;

      productsData = await Product.find().skip(skip).limit(limit).populate('category');
    }

    // Calculate the number of pages
    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      status: "success",
      data: { products: productsData, totalPages },
    });
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }


 
});


exports.uploadProductPhoto = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "alt1_img", maxCount: 1 },
  { name: "alt2_img", maxCount: 1 },
  { name: "alt3_img", maxCount: 1 },
]);

exports.uploadPhoto = upload.single("image");

exports.createProduct = catchAsync(async (req, res, next) => {
  try {
    const { name_ar, name_en, category, boycott_why_ar, boycott_why_en, sources, isSuspected } = req.body;
    // product image maybe uploaded as a file or a url in img_url
    let img_url = req.body.img_url;
    const image = req.file

    if (!img_url) {
      if (!image) {
        throw new Error("You must provide an image either as a file in a key named image or a url in img_url");
      }
      img_url = await uploadImage(image.buffer);
    }

    const newProduct = await Product.create({
      name: {
        en: name_en,
        ar: name_ar,
      },
      category,
      boycott_why: {
        en: boycott_why_en,
        ar: boycott_why_ar,
      },
      sources,
      isSuspected,
      img_url
    });

    // return product but with populated category
    await newProduct.populate('category')

    return res.status(201).json({
      status: "success",
      data: newProduct,
    });

  } catch (err) {
    console.log(err)
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
  
});

async function uploadImage(imageBuffer) {
  return new Promise((resolve, reject) => {
    // Create a writable stream to upload the image to Cloudinary
    const cloudUploadStream = cloudinary.uploader.upload_stream(
      { folder: "product_images" },
      (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          reject(error);
        } else {
          console.log('Image uploaded to Cloudinary:', result);
          resolve(result.secure_url);
        }
      }
    );

    // Create a readable stream from the image buffer and pipe it to the Cloudinary upload stream
    streamifier.createReadStream(imageBuffer).pipe(cloudUploadStream);
  });
}


exports.updateProduct = catchAsync(async (req, res, next) => {
  try {
    const { name_ar, name_en, category, boycott_why_ar, boycott_why_en, sources, alternatives, isSuspected } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new Error();
    }

    // product image maybe uploaded as a file or a url in img_url
    let img_url = req.body.img_url;
    const image = req.file

    if (!img_url) {
      if (!image) {
        throw new Error("You must provide an image either as a file in a key named image or a url in img_url");
      }
      img_url = await uploadImage(image.buffer);
    }

    product.name = {
      en: name_en,
      ar: name_ar,
    };
    product.category = category;
    product.boycott_why = {
      en: boycott_why_en,
      ar: boycott_why_ar,
    };
    product.sources = sources;
    product.alternatives = alternatives;
    product.isSuspected = isSuspected;
    product.img_url = img_url;

    await product.save();

    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (err) {
    console.log(err)
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new Error();
    }

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: "No such product found with id",
    });
  }
});

exports.addAlternativeProduct = catchAsync(async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      throw new Error('You must provide a product id in the url')
    }
    const product = await Product.findById(productId).populate('category')
    if (!product) {
      throw new Error('No such product found with id')
    }

    const { name_ar, name_en } = req.body;
    // alternative product image maybe uploaded as a file or a url in img_url
    let img_url = req.body.img_url;
    const image = req.file

    if (!img_url) {
      if (!image) {
        throw new Error("You must provide an image either as a file in a key named image or a url in img_url");
      }
      img_url = await uploadImage(image.buffer);
    }

    const alternative = {
      name: {
        en: name_en,
        ar: name_ar,
      },
      img_url,
    };

    product.alternatives.push(alternative);

    console.log("Adding alternative to product: " + product.name.en)
    console.log(product.alternatives)

    await product.save();


    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.getAProduct = catchAsync(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      throw new Error('No such product found with id')
    }

    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.searchProducts = catchAsync(async (req, res, next) => {
  // limit results to 10
  const limit = 10;
  const searchQuery = req.params.query || "";

  const searchQueries = ['en', 'ar'].map((language) => ({
    [`name.${language}`]: { $regex: searchQuery, $options: 'i' },
  }));

  const products = await Product.find({ $or: searchQueries }).limit(limit).populate('category')

  console.log("searching for: " + searchQuery)
  console.log("found: " + products.length + " products")
  console.log(products)


  return res.status(200).json({
    status: "success",
    data: products,
  });
});
