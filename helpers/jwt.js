const expressJwt = require('express-jwt')

// check if our token is based on our secret
// we created middleware in index.js
function authJwt () {
    const {JWT_SECRET, API} = process.env
    return expressJwt({
        secret: JWT_SECRET, // our token secret
        algorithms: ['HS256'], // got to https://jwt.io/ and you will se the correct algorithm
        isRevoked: isRevoked
    }).unless({ // people can go through these urls without any authentications
        path: [
            {url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS']}, // user can only GET
            {url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS']}, // user can only GET
            {url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS']}, // user can only GET
            `${API}/users/login`, // user can post in login
            `${API}/users/register`, // new user can post in register
        ]
    })
}

/*
 we specify only get, what about post and delete products or categories
 we have admin and user and we don't want the user to delete or add products 
 only the admin can, we will use isRevoked method to handle token data 
 and check if he's admin or not
*/
async function isRevoked(req, payload, done) {
    /*
        {
            userId: '6071cf5ba58c833e44b8b4de',
            isAdmin: true,
            iat: 1618151671,
            exp: 1618238071
        } 
    */
    if(!payload.isAdmin) {
        done(null, true) // if it is not admin, reject the request
    }
    done()
}

module.exports = authJwt