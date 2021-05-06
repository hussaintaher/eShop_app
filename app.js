const express = require('express');
const app = express()
const morgan = require('morgan')
const dotenv = require('dotenv');
const mongoose = require('mongoose')
const cors = require('cors')
dotenv.config()
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error_handler')

app.use(cors());
app.options('*', cors())

//middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads')) // serving images or videos
app.use(errorHandler);

// models
const {Product} = require('./models/product')

// dev environment var
const {DB_URL, API} = process.env

// Routes
const productsRouter = require('./routers/products')
const ordersRouter = require('./routers/orders')
const usersRouter = require('./routers/users')
const categoriesRouter = require('./routers/categories')

app.use(`${API}/products`, productsRouter)
app.use(`${API}/categories`, categoriesRouter)
app.use(`${API}/users`, usersRouter)
app.use(`${API}/orders`, ordersRouter)




mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eShop'
})
    .then(() => console.log('DB connection is ready...'))
    .catch((err) => console.log(err))


// Development
//app.listen(3000)

// Production
var server = app.listen(process.env.PORT || 3000, function() {
    var port = server.address().port;
    console.log("Express is working in port " + port)
})