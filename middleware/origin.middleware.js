function requireTrustedOrigin(req, res, next) {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    const origin = req.get('origin');
    const port = Number(process.env.PORT) || 5000;
    const trustedOrigin = process.env.CLIENT_ORIGIN || `http://localhost:${port}`;
    if (!origin || origin !== new URL(trustedOrigin).origin) {
        return res.status(403).json({ error: 'Requests from this website origin are not allowed.' });
    }
    return next();
}

module.exports = requireTrustedOrigin;
