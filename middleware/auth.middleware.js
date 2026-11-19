const jwt = require('jsonwebtoken');
const User = require('../models/User');

const cookieName = 'skillbridge_token';

function tokenOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    };
}

function setAuthCookie(res, user) {
    const token = jwt.sign(
        { sub: user._id.toString(), ver: user.tokenVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: '2h', issuer: 'skillbridge' }
    );
    res.cookie(cookieName, token, { ...tokenOptions(), maxAge: 2 * 60 * 60 * 1000 });
}

function clearAuthCookie(res) {
    res.clearCookie(cookieName, tokenOptions());
}

async function requireAuth(req, res, next) {
    try {
        const token = req.cookies[cookieName];
        if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
        const payload = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'skillbridge' });
        const user = await User.findById(payload.sub).select('+tokenVersion');
        if (!user) return res.status(401).json({ error: 'This account is no longer available. Please sign in again.' });
        if ((payload.ver || 0) !== user.tokenVersion) {
            return res.status(401).json({ error: 'Your session has ended. Please sign in again.' });
        }
        req.user = user;
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });
        }
        return next(error);
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'You do not have permission to perform this action.' });
        }
        return next();
    };
}

module.exports = { clearAuthCookie, requireAuth, requireRole, setAuthCookie };
