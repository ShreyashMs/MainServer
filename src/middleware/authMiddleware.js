const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');

module.exports = async (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        console.log("Token required");
        return res.status(403).json({ message: 'No token provided.' });
    }

    try {
        console.log("Token provided:", token);
        const decoded = jwt.verify(token.replace('Bearer ', ''), jwtSecret); // Remove 'Bearer ' prefix
        console.log("Decoded JWT:", decoded);

        req.user = await User.findById(decoded.id);

        const loginAttempt = await LoginAttempt.findOne({ user_id: req.user.id });
        if (loginAttempt && loginAttempt.lock_until > Date.now()) {
            console.log("Account locked due to login attempts.");
            return res.status(403).json({ message: 'Account is locked. Try again later.' });
        }

        req.loginAttempt = loginAttempt;
        next();
    } catch (error) {
        console.error("Error verifying token:", error.message);
        return res.status(401).json({ message: 'Invalid token.' });
    }
};
