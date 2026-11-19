const service = require('./requests.service');

async function create(req, res, next) {
    try {
        return res.status(201).json({ request: await service.create(req.body, req.user) });
    } catch (error) {
        return next(error);
    }
}

async function mine(req, res, next) {
    try {
        return res.json({ requests: await service.listForLearner(req.user) });
    } catch (error) {
        return next(error);
    }
}

async function assigned(req, res, next) {
    try {
        return res.json({ requests: await service.listForMentor(req.user) });
    } catch (error) {
        return next(error);
    }
}

async function all(req, res, next) {
    try {
        return res.json({ requests: await service.listAll() });
    } catch (error) {
        return next(error);
    }
}

async function updateStatus(req, res, next) {
    try {
        const request = await service.updateStatus(req.params.id, req.body.status, req.user);
        if (!request) return res.status(404).json({ error: 'Learning request not found.' });
        return res.json({ request });
    } catch (error) {
        return next(error);
    }
}

module.exports = { all, assigned, create, mine, updateStatus };
