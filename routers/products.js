const { Category } = require('../models/category');
const {Product} = require('../models/product')
const router = require('express').Router();
const mongoose = require('mongoose')
const querystring = require('querystring');
const multer = require('multer');

/****************************/
    // Upload Images
/****************************/
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let errorHandler = new Error('Invalid Image')
        if (isValid) errorHandler = null;
      cb(errorHandler, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-')
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}` )
    }
  })
   
  var uploadOptions = multer({ storage: storage })

/****************************/
    // Routes
/****************************/
// categories Query parameters
// localhost:3000/api/v1/products?categories=23135646,56456465
// the code must be in the first 
router.get(`/`, async (req, res) => {
    let filter = {}
    if (req.query.categories) {
        filter = {category: req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category')
    if (!productList) return res.status(400).json({status: 'Error', message: "there is no products"})
    console.log('Get All Products: ', productList)
    res.status(200).json({status: 'Ok', productList})
})

// get all
router.get(`/`, async (req, res) => {
    const newProduct = await Product.find().populate('category')
    if (!newProduct) {
        console.log('Get All Products', newProduct)
        return res.status(400).json({status: 'Error'})
    }
    res.status(200).json(newProduct)
})

// get one
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')
    if (!product) {
        console.log('Get One Product', newProduct)
        return res.status(400).json({status: 'Error', message: "there is no product"})
    }
    res.status(200).json({status: 'Ok', product})
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const file = req.file
    if(!file) return res.status(400).json({status: 'Error', message: 'No file'})

    const fileName = req.file.filename;
    // req.protocol --> http 
    // req.get('host') --> hostName
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    const {
        name,
        description,
        richDescription,
        image,
        brand,
        price,
        category,
        countInStock,
        rating,
        numReviews,
        isFeatured,
        } = req.body
    const foundCategory = await Category.findById(category)
    if (!foundCategory) 
    return res.status(400).json({status: 'Error', message: 'Invalid Category'})
    const newProduct = new Product({
        name, description, richDescription,
        image: `${basePath}${fileName}`, // http://localhost:3000/public/upload
        brand, price, category, countInStock,
        rating, numReviews, isFeatured,
    })
    const product = await newProduct.save()
    if (!product) {
        console.log('Product cannot be created')
        return res.status(500).json({status: 'Error', message: 'The product cannot be created'})
    }
    console.log('New Product', product)
    res.status(200).json({status: 'Ok', product})

})

// update one
router.put('/:id',uploadOptions.single('image') ,async (req, res) => {
// request body
    const {name, description, richDescription,
        image, brand, price, category, countInStock,
        rating, numReviews, isFeatured,} = req.body

// is id valid ?
    if(!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({status: 'Error', message: 'Invalid Id'})
    }
// Find the product
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(400).json({status: 'Error', message: 'Invalid Product'});

// user want to update the image, we will see if image is new or not!
    const file = req.file;
    let imagePath;
    if (file) {
        // if user upload new path, create new url
        const fileName = req.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        // keep the old path
        imagePath = product.image;
    }

// check the category
    const foundCategory = await Category.findById(category)
    if (!foundCategory) return res.status(400).json({status: 'Error', message: 'Invalid Category'})

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, // which category you want to update
        {name, description, richDescription,
        image, brand, price, category, countInStock,
        rating, numReviews, isFeatured,}, // the new req data
        {new: true} // yes I want to return the updated category not old one
    );
    if (!updatedProduct) {
        res.status(404).json({status: 'Error', message:'cannot update product, it is not exist'})
    } else {
        console.log('Product updated', updatedProduct)
        res.status(200).json({status: 'Ok', updatedProduct})
    }
})


router.delete('/:id', async (req, res) => {
    await Product.findOneAndDelete(req.params.id)
        .then((product)=> {
            if (product) {
                console.log('Product deleted', updatedProduct)
                res.status(200).json({status: 'Ok', message:'the category just deleted'})
            } else {
                res.status(404).json({status: 'Error', message:'the category not exist'})
            }
        }).catch(e => { // if any others fails happens like disconnection etc.
            return res.status(400).json({status: 'Error', message: e})
        })
})

// get the number of documents in products (No of products)
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments(count => count)
    if (!productCount) return res.status(500).json({status: 'Error'})
    console.log('Number of Products ', productCount)
    res.status(200).json({status: 'Ok', productCount})
})

// get the featured products with limitations
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0; // It receives number
    const products = await Product.find({isFeatured: true}).limit(Number(count))
    if (!products) return res.status(500).json({status: 'Error'})
    console.log('Featured Products ', products)
    res.status(200).json({status: 'Ok', products})
})

router.put('/gallery-images/:id',uploadOptions.array('images', 10) ,async (req, res) => {
    // is id valid ?
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({status: 'Error', message: 'Invalid Id'})
    }

    // handle the images
    const files = req.files;
    let imagePaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    if (files) {
        files.map(file => {
            imagePaths.push(`${basePath}${file.filename}`)
        })
    }
    /*
        don't forget to serve static files using express.static()
    */

    // now update the product
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, 
        {images: imagePaths}, // the new images
        {new: true} // yes I want to return the updated product not old one
    );
    if (!updatedProduct) {
        res.status(404).json({status: 'Error', message:'cannot update product, it is not exist'})
    } else {
        console.log('images just updated', updatedProduct)
        res.status(200).json({status: 'Ok', updatedProduct})
    }
})
module.exports = router
