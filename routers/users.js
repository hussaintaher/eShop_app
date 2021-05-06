const {User} = require('../models/user')
const router = require('express').Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// get all
router.get('/', async (req, res) => {
    const users = await User.find().select('-passwordHash');
    if (!users) return res.status(404).json({status: 'Error', message:'no users there'})
    res.status(200).json({status: 'Ok', users})
})

router.get('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({status: 'Error', message:'the user with the given ID not exist'})
    res.status(200).json({status: 'Ok', user})
})

router.post(`/`, async (req, res) => {
    const {
        name,email,passwordHash,phone,isAdmin,street,apartment,zip,city,country,
    } = req.body
    const hashedPassword = bcrypt.hashSync(passwordHash, 10)
    const user = new User({
        name,email,passwordHash: hashedPassword,phone,isAdmin,street,apartment,zip,city,country,
    })
    const newUser = await user.save()
    if (!newUser)   
    return res.status(500).json({status: 'Error', message: 'The user cannot be created'})
    res.status(200).json({status: 'Ok', newUser})
})

router.post('/login', async (req, res) => {
    const {email, passwordHash} = req.body
    const user = await User.findOne({email})
    if (!user) return res.status(404).json({status: 'Error', message:'user not found'})
    if (user && bcrypt.compareSync(passwordHash, user.passwordHash)) {
        const token = jwt.sign({
            userId: user._id,
            isAdmin: user.isAdmin
        }, process.env.JWT_SECRET, {expiresIn: '1d'})
        res.status(200).json({status: 'Ok', user: {_id: user._id, email: user.email, name: user.name}, token})
    } else {
        res.status(400).json({status: 'Error', message: 'password is wrong'})
    }
})

router.post('/register', async (req,res)=>{
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        passwordHash: bcrypt.hashSync(req.body.password, 10),
        phone: req.body.phone,
        isAdmin: req.body.isAdmin,
        street: req.body.street,
        apartment: req.body.apartment,
        zip: req.body.zip,
        city: req.body.city,
        country: req.body.country,
    })
    user = await user.save();

    if(!user)
    return res.status(400).send('the user cannot be created!')

    res.send(user);
})

// get the number of documents in users (No of products) for (Admin)
router.get(`/get/count`, async (req, res) => {
    const userCount = await User.countDocuments(count => count)
    if (!userCount) return res.status(500).json({status: 'Error'})
    res.status(200).json({status: 'Ok', userCount})
})

// delete one user
router.delete('/:id', async (req, res) => {
    await User.findOneAndDelete(req.params.id)
        .then((User)=> {
            if (User) {
                res.status(200).json({status: 'Ok', message:'the User just deleted'})
            } else {
                res.status(404).json({status: 'Error', message:'the User not exist'})
            }
        }).catch(e => { // if any others fails happens like disconnection etc.
            return res.status(400).json({status: 'Error', message: e})
        })
})

module.exports = router
