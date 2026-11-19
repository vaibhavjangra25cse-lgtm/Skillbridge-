const service = require('./home.service');

async function home(req, res, next) {
    try {
        return res.json(await service.home());
    } catch (error) {
        return next(error);
    }
}

async function featuredSkills(req, res, next) {
    try {
        return res.json({ skills: await service.featuredSkills() });
    } catch (error) {
        return next(error);
    }
}

async function statistics(req, res, next) {
    try {
        return res.json({ statistics: await service.statistics() });
    } catch (error) {
        return next(error);
    }
}

module.exports = { featuredSkills, home, statistics };
