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
exports.uploadProductPhoto = upload.single("image");
exports.uploadProductPhoto = upload.single("image");

exports.getProducts = catchAsync(async (req, res, next) => {
  //Pagination Setup
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 20;
  const skip = (page - 1) * limit;

  let goQuery = 1;
  let productsData = [];
  if (req.query.category && goQuery) {
    productsData = await Product.find({
      category: req.query.category,
    })
      .skip(skip)
      .limit(limit);
    goQuery = false;
  }

  //no parameter case
  if (goQuery) {
    productsData = await Product.find().skip(skip).limit(limit);
  }

  return res.status(200).json({
    status: "success",
    data: { products: productsData },
  });
});

exports.createProduct = catchAsync(async (req, res, next) => {
  const imageFile = req.file != null ? req.file : null;
  console.log(req.file);
  const { name, category, references, alternatives, notes } = req.body;
  const referencesArr = references != null ? references.split(",") : null;
  const alternativesArr = alternatives != null ? alternatives.split(",") : null;
  console.log("references", references);
  console.log("alternatives", alternatives);
  const cloudUploadStream = cloudinary.uploader.upload_stream(
    { folder: "products" },
    async (error, result) => {
      const createdProduct = await Product.create({
        name,
        category,
        references: referencesArr,
        alternatives: alternativesArr,
        notes,
        img_url: result.secure_url,
      }).catch((err) => {
        console.log("lolxd");
        return res.status(400).json({
          status: "fail",
          message: "Could not Create Product",
        });
      });
      //if an error happned while uploading the image
      if (res.headersSent) return;
      console.log("still trying to send");
      res.status(200).json({
        status: "success",
        data: {
          product: createdProduct,
        },
      });
    }
  );
  streamifier.createReadStream(imageFile.buffer).pipe(cloudUploadStream);
});

exports.getAProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      status: "fail",
      message: "No such product found with id",
    });
  }

  return res.status(200).json({
    status: "success",
    data: product,
  });
});
