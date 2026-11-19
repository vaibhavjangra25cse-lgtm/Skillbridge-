const crypto = require('node:crypto');

const cookieName = 'skillbridge_csrf';
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function issueCsrfToken(req, res) {
    const token = crypto.randomBytes(32).toString('base64url');
    res.cookie(cookieName, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 2 * 60 * 60 * 1000,
    });
    res.set('Cache-Control', 'no-store');
    return res.json({ csrfToken: token });
}

function requireCsrfToken(req, res, next) {
    if (!unsafeMethods.has(req.method)) return next();

    const cookieToken = req.cookies[cookieName];
    const headerToken = req.get('x-csrf-token');
    if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
        return res.status(403).json({ code: 'CSRF_TOKEN_REQUIRED', error: 'Refresh the page and try again.' });
    }

    const cookie = Buffer.from(cookieToken);
    const header = Buffer.from(headerToken);
    if (cookie.length !== header.length || !crypto.timingSafeEqual(cookie, header)) {
        return res.status(403).json({ code: 'CSRF_TOKEN_INVALID', error: 'Refresh the page and try again.' });
    }
    return next();
}

module.exports = { issueCsrfToken, requireCsrfToken };
