const jwt = require('jsonwebtoken')
const authUser = (req, res, next) => {
    if(req.url.contains('categories') || req.url.contains('products') && req.method === 'GET') {
        next()
    } else if() {

    }
    const user = jwt.verify()
}
