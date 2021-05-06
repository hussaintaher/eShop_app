const errorHandler = (err, req, res, next) => {
    
    // authorization
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({status: 'Error', message: 'the user is not authorized'})
    }
    
    // maybe for images
    if (err.name === 'ValidationError') {
        return res.status(401).json({status: 'Error', message: err})
    }
    // default error
    return res.status(500).json({status: 'Error', message: err})
}

module.exports = errorHandler;