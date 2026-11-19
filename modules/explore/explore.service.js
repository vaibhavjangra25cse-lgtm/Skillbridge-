const Skill = require('../../models/Skill');
const escapeRegex = require('../../utils/escapeRegex');
const { serializeSkill } = require('../../utils/records');

async function search({ search = '', category = '', level = '', page = 1, limit = 12 }) {
    const filter = {};
    if (search) filter.$or = [
        { title: { $regex: escapeRegex(search), $options: 'i' } },
        { description: { $regex: escapeRegex(search), $options: 'i' } },
        { teacher: { $regex: escapeRegex(search), $options: 'i' } },
    ];
    if (category) filter.category = category;
    if (level) filter.level = level;

    const [records, total] = await Promise.all([
        Skill.find(filter).sort({ legacyId: 1, title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
        Skill.countDocuments(filter),
    ]);
    return {
        skills: records.map(serializeSkill),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}

async function categories() {
    return Skill.distinct('category');
}

module.exports = { categories, search };
