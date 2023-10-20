const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.route('/')
.get(productController.getProducts)
.post(productController.uploadProductPhoto, productController.createProduct);
router.route('/:id').get(productController.getAProduct);
module.exports = router;