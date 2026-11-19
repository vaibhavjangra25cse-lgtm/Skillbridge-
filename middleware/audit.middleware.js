function auditAdmin(action) {
    return (req, res, next) => {
        if (req.user.role !== 'admin') return next();
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                console.info('Admin action', JSON.stringify({
                    actorId: req.user._id.toString(),
                    action,
                    resourceId: req.params.id || null,
                    status: res.statusCode,
                    timestamp: new Date().toISOString(),
                }));
            }
        });
        return next();
    };
}

module.exports = auditAdmin;
