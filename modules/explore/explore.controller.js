const service = require('./explore.service');

async function search(req, res, next) {
    try {
        const result = await service.search({
            search: typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '',
            category: typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 80) : '',
            level: typeof req.query.level === 'string' ? req.query.level.trim().slice(0, 40) : '',
            page: Math.max(1, Number.parseInt(req.query.page, 10) || 1),
            limit: Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12)),
        });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
}

async function categories(req, res, next) {
    try {
        return res.json({ categories: await service.categories() });
    } catch (error) {
        return next(error);
    }
}

module.exports = { categories, search };
