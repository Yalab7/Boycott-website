const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.route('/')
.get(productController.getProducts)
.post(productController.uploadPhoto,
    productController.createProduct);

router.route('/:id')
.get(productController.getAProduct)
.patch(productController.updateProduct)
.delete(productController.deleteProduct);

router.route('/:id/alternatives')
.post(productController.uploadPhoto, productController.addAlternativeProduct);


router.route('/search/:query').get(productController.searchProducts);


module.exports = router;