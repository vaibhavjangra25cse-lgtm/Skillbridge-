const Skill = require('../../models/Skill');
const service = require('./skills.service');
const escapeRegex = require('../../utils/escapeRegex');
const { serializeSkill } = require('../../utils/records');

async function getById(req, res, next) {
    try {
        const skill = await service.getById(req.params.id);
        if (!skill) return res.status(404).json({ error: 'Skill not found.' });
        return res.json({ skill });
    } catch (error) {
        return next(error);
    }
}

async function create(req, res, next) {
    try {
        const skill = await service.create(req.body, req.user);
        return res.status(201).json({ skill });
    } catch (error) {
        return next(error);
    }
}

async function update(req, res, next) {
    try {
        const skill = await service.update(req.params.id, req.body);
        if (!skill) return res.status(404).json({ error: 'Skill not found.' });
        return res.json({ skill });
    } catch (error) {
        return next(error);
    }
}

async function remove(req, res, next) {
    try {
        if (!await service.remove(req.params.id)) return res.status(404).json({ error: 'Skill not found.' });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

async function list(req, res, next) {
    try {
        const query = {};
        if (req.query.search) query.title = { $regex: escapeRegex(String(req.query.search).slice(0, 100)), $options: 'i' };
        if (req.query.category) query.category = String(req.query.category);
        if (req.query.level) query.level = String(req.query.level);
        const skills = await Skill.find(query).sort({ legacyId: 1, title: 1 }).limit(500).lean();
        return res.json({ skills: skills.map(serializeSkill) });
    } catch (error) {
        return next(error);
    }
}

module.exports = { create, getById, list, remove, update };
