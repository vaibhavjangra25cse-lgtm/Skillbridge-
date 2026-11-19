const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

function hasUnsafeKeys(value) {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasUnsafeKeys);
    return Object.entries(value).some(([key, child]) =>
        key.startsWith('$') || key.includes('.') || forbiddenKeys.has(key) || hasUnsafeKeys(child)
    );
}

function rejectUnsafeInput(req, res, next) {
    const params = new URL(req.originalUrl, 'http://localhost').searchParams;
    const seen = new Set();
    for (const key of params.keys()) {
        if (seen.has(key)) {
            return res.status(400).json({ error: 'Duplicate query parameters are not allowed.' });
        }
        seen.add(key);
    }

    if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
        return res.status(400).json({ error: 'The request contains unsupported input fields.' });
    }
    return next();
}

module.exports = { hasUnsafeKeys, rejectUnsafeInput };
