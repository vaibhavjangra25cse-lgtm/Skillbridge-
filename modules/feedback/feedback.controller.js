const service = require('./feedback.service');

async function create(req, res, next) {
    try {
        const feedback = await service.create(req.body);
        return res.status(201).json({ message: 'Feedback saved successfully.', feedback });
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        return res.json({ feedback: await service.list() });
    } catch (error) {
        return next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!await service.remove(req.params.id)) return res.status(404).json({ error: 'Feedback entry not found.' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, list, remove };
