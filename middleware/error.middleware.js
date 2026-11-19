function errorHandler(error, req, res, next) {
    console.error('Request failed:', JSON.stringify({
        method: req.method,
        path: req.path,
        name: error.name || 'Error',
        status: error.status || 500,
    }));
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body must contain valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body is too large.' });
    }
    if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: 'The submitted data is invalid.' });
    }
    if (error.name === 'CastError' || error instanceof SyntaxError) {
        return res.status(400).json({ error: 'The request contains invalid data.' });
    }
    if (error.code === 11000) {
        return res.status(409).json({ error: 'A record with that value already exists.' });
    }
    return res.status(500).json({ error: 'The server could not complete this request.' });
}

module.exports = errorHandler;
