const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const catchAsync = require("../utils/catchAsync");
const Product = require("../models/productModel");

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
  // Pagination Setup
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;

  let goQuery = 1;
  let productsData = [];
  let totalProducts = 0;

  if (req.query.category && goQuery) {
    const category = req.query.category;

    // Query products in the specified category
    const productsInCategory = await Product.find({ category });
    totalProducts = productsInCategory.length;

    productsData = await Product.find({ category })
      .skip(skip)
      .limit(limit);

    goQuery = false;
  }

  // No parameter case
  if (goQuery) {
    // Query all products
    const allProducts = await Product.find();
    totalProducts = allProducts.length;

    productsData = await Product.find().skip(skip).limit(limit);
  }

  // Calculate the number of pages
  const totalPages = Math.ceil(totalProducts / limit);

  return res.status(200).json({
    status: "success",
    data: { products: productsData, totalPages },
  });
});


exports.uploadProductPhoto = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "alt1_img", maxCount: 1 },
  { name: "alt2_img", maxCount: 1 },
  { name: "alt3_img", maxCount: 1 },
]);

exports.createProduct = catchAsync(async (req, res, next) => {
  console.log(req.files);
  console.log(req.body);

  const productImage = req.files.image[0];
  const productAlt1Image = req.files.alt1_img ? req.files.alt1_img[0] : null;
  const productAlt2Image = req.files.alt2_img ? req.files.alt2_img[0] : null;
  const productAlt3Image = req.files.alt3_img ? req.files.alt3_img[0] : null;
  let productAlternatives = [productAlt1Image, productAlt2Image, productAlt3Image]

  const { name, category, references, alternatives, notes } = req.body;
  const referencesArr = references != null ? JSON.parse(references) : null;
  let alternativesArr = alternatives != null ? JSON.parse(alternatives) : null;
  alternativesArr = alternativesArr.map((alt, index) => {
    return { name: alt, imgFile: productAlternatives[index] };
  });

  try {
    console.log("Uploading to cloudinary...")
    let productImageUrl = await uploadImage(productImage.buffer);
    for (const alt of alternativesArr) {
      if (alt.imgFile) {
        alt.img_url = await uploadImage(alt.imgFile.buffer);
        delete alt.imgFile;
      }
    }
          
    console.log("Creating product...")
    console.log(alternativesArr)
    console.log("img_url: " + productImageUrl)
    const newProduct = await Product.create({
      name,
      category,
      img_url: productImageUrl,
      references: referencesArr,
      alternatives: alternativesArr,
      notes,
    });

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


exports.getAProduct = catchAsync(async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new Error();
    }

    return res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: "No such product found with id",
    });
  }
});

exports.searchProducts = catchAsync(async (req, res, next) => {
  // limit results to 10
  const limit = 10;
  const searchQuery = req.params.query || "";

  const products = await Product.find({
    name: { $regex: searchQuery, $options: "i" },
  }).limit(limit);

  return res.status(200).json({
    status: "success",
    data: products,
  });
});
