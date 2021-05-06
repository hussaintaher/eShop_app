const {Order} = require('../models/order')
const router = require('express').Router();
const {OrderItem} = require('../models/order-item')

// get all
router.get(`/`, async (req, res) => {
    // .sort({dateOrdered: -1}) newest to oldest 
    const allOrders = await Order.find().populate('user', 'name').sort({dateOrdered: -1}) //populate(path: any, select: )
    if (!allOrders) {
        res.status(400).json({status: 'Error', message: 'sorry there is no orders'})
    }
    console.log('Get All Orders: ', allOrders)
    res.status(200).json(allOrders)
})

router.get(`/:id`, async (req, res) =>{
    const order = await Order.findById({ _id: req.params.id})
    .populate('user', 'name')
    .populate({path: 'orderItems', populate: {path: 'product', populate: 'category'}}) // only works if we pushed refs to children
    if(!order) {
        res.status(500).json({status: 'Error', message: 'There is no order'})
    } 
    console.log('Get One Order: ', order)
    res.status(400).json({status: 'Ok', order});
})

// create one
router.post('/', async (req, res) => {
    const {
        orderItems,
        shippingAddress1,
        shippingAddress2,
        city,
        zip,
        country,
        phone,
        status,
        user
    } = req.body
    // first let's create orderItem 
    // because it is array, it will gives my many promises, I want to get one promise
    // after that I will resolve that promise
    const orderItemsIds = Promise.all(orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save()
        // I want to return only the id of the order item, not the all doc
        return newOrderItem._id
    }))

    const orderItemsIdsResolved = await orderItemsIds

    // we calculate total price from server not from client, because user can pass 
    // any price that he want.
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (itemId) => {
        const orderItem = await OrderItem.findById(itemId).populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice
    }))

    // combined(reduce) two numbers in array ==> [50, 75]
    const totalPrice = totalPrices.reduce((a,b) => a + b, 0)
    
    let newOrder = await Order.create({
        orderItems: orderItemsIdsResolved,
        shippingAddress1,
        shippingAddress2,
        city,
        zip,
        country,
        phone,
        status,
        totalPrice: totalPrice,
        user
    })
    if(!newOrder) res.status(200).json({status: 'Error', message:'something wrong'})
    console.log('New Order: ', newOrder)
    res.status(200).json({status: 'Ok', newOrder})
})

// update one
router.put('/:id', async (req, res) => {
    const {status} = req.body
    const order = await Order.findByIdAndUpdate(
        req.params.id, // which category you want to update
        {status}, // the new req data
        {new: true} // yes I want to return the updated category not old one
    );
    if (!order) {
        res.status(404).json({status: 'Error', message:'the order with the given ID not exist'})
    } else {
        console.log('Order updated: ', order)
        res.status(200).json({status: 'Ok', order})
    }
})

// Delete one
router.delete('/:id', async (req, res) => {
    await Order.findOneAndDelete(req.params.id)
        .then(async (order)=> {
            if (order) {
                // don't forget to delete the orderItems
                await order.orderItems.map(async (item) => {
                    await OrderItem.findOneAndDelete(orderItem)
                })
                console.log('Order deleted: ', order)
                res.status(200).json({status: 'Ok', message:'the order just deleted'})
            } else {
                res.status(404).json({status: 'Error', message:'the order not exist'})
            }
        }).catch(e => { // if any others fails happens like disconnection etc.
            return res.status(400).json({status: 'Error', message: e})
        })

})

// see the total price in dashboard
router.get('/get/totalsales', async (req, res) => {
    // group all documents in one field
    const totalSales = await Order.aggregate([
        {$group: {_id: null, totalsales: {$sum: '$totalPrice'}}}
    ])

    if (!totalSales) {
        return res.status(500).json({status: 'Error', message: 'the total sales cannot be generated'})
    }
    console.log('Total Sales: ', totalSales)
    return res.status(400).json({status: 'Ok', totalsales: totalSales.pop().totalsales})

})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments(count => count)
    if (!orderCount) return res.status(500).json({status: 'Error'})
    console.log('Numbers of Orders: ', orderCount)
    res.status(200).json({status: 'Ok', orderCount})
})

router.get(`/get/userorders/:id`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.id})
    .populate({path: 'orderItems', populate: {path: 'product', populate: 'category'}})
    .sort({'dataOrdered': -1})
    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    console.log('Orders: ', userOrderList)
    res.send(userOrderList);
})

module.exports = router
