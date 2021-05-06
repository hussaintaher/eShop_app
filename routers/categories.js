const {Category} = require('../models/category')
const router = require('express').Router();

// get all
router.get('/', async (req, res) => {
    const categories = await Category.find();
    if (!categories) res.status(404).json({status: 'Error', message:'no categories there'})
    res.status(200).json({status: 'Ok', categories})
    console.log('Get All Categories', categories)
})

// get one
router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) res.status(404).json({status: 'Error', message:'the category with the given ID not exist'})
    res.status(200).json({status: 'Ok', category})
})

// update one
router.put('/:id', async (req, res) => {
    const {name, color, icon} = req.body
    const category = await Category.findByIdAndUpdate(
        req.params.id, // which category you want to update
        {name,color,icon}, // the new req data
        {new: true} // yes I want to return the updated category not old one
    );
    if (!category) {
        res.status(404).json({status: 'Error', message:'the category with the given ID not exist'})
    } else {
        res.status(200).json({status: 'Ok', category})
    }
})

// create one
router.post('/', async (req, res) => {
    const {name, icon, color} = req.body
    const newCategory = await Category.create(req.body)
    console.log(newCategory)
    if(!newCategory) res.status(200).json({status: 'Error', message:'something wrong'})
    res.status(200).json({status: 'Ok', newCategory})
})

//http://localhost:3000/api/v1/category/:id
router.delete('/:id', async (req, res) => {
    await Category.findOneAndDelete(req.params.id)
        .then((category)=> {
            if (category) {
                res.status(200).json({status: 'Ok', message:'the category just deleted'})
            } else {
                res.status(404).json({status: 'Error', message:'the category not exist'})
            }
        }).catch(e => { // if any others fails happens like disconnection etc.
            return res.status(400).json({status: 'Error', message: e})
        })
})



module.exports = router
