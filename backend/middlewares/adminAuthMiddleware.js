const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        console.log('Decoded Token:', decoded); // Log the decoded token for debugging

        // Check if the user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Authorization denied' });
        }

        next();
    } catch (err) {
        console.error('Token is not valid', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
