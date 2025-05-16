// middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const blacklist = new Set(); 

exports.isAuth = (req, res, next) => {
    const token = req.headers['x_auth_token'];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Check if the token is in the blacklist
    if (blacklist.has(token)) {
        return res.status(401).json({ message: 'Token has been invalidated' });
    }

    try {
        // Verify the token's validity
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Attach user details to the request object
        next();
    } catch (err) {
        console.error('Invalid token:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
