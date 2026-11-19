const service = require('./mentors.service');

async function list(req, res, next) {
    try {
        return res.json({
            mentors: await service.list({
                search: typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '',
                expertise: typeof req.query.expertise === 'string' ? req.query.expertise.trim().slice(0, 300) : '',
                department: typeof req.query.department === 'string' ? req.query.department.trim().slice(0, 80) : '',
                year: typeof req.query.year === 'string' ? req.query.year.trim().slice(0, 40) : '',
                experience: typeof req.query.experience === 'string' ? req.query.experience.trim().slice(0, 40) : '',
            }),
        });
    } catch (error) {
        return next(error);
    }
}

async function getById(req, res, next) {
    try {
        const mentor = await service.getById(req.params.id);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
        return res.json({ mentor });
    } catch (error) {
        return next(error);
    }
}

async function getMine(req, res, next) {
    try {
        const mentor = await service.getByUser(req.user._id);
        if (!mentor) return res.status(404).json({ error: 'Your mentor profile was not found.' });
        return res.json({ mentor });
    } catch (error) {
        return next(error);
    }
}

async function updateMine(req, res, next) {
    try {
        const mentor = await service.updateByUser(req.user._id, req.body);
        if (!mentor) return res.status(404).json({ error: 'Your mentor profile was not found.' });
        return res.json({ mentor });
    } catch (error) {
        return next(error);
    }
}

async function create(req, res, next) {
    try {
        return res.status(201).json({ mentor: await service.create(req.body) });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const mentor = await service.update(req.params.id, req.body);
        if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
        return res.json({ mentor });
    } catch (error) {
        return next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!await service.remove(req.params.id)) return res.status(404).json({ error: 'Mentor not found.' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, getById, getMine, list, remove, update, updateMine };
