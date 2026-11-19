const Skill = require('../../models/Skill');
const { findByIdOrLegacy, serializeSkill } = require('../../utils/records');
const skillFields = ['title', 'description', 'category', 'level', 'resources', 'image', 'alt', 'categoryClass', 'teacher', 'mentorCount', 'detailUrl', 'details'];

function pickSkillFields(input) {
    return Object.fromEntries(skillFields.filter(key => input[key] !== undefined).map(key => [key, input[key]]));
}

async function getById(id) {
    const skill = await findByIdOrLegacy(Skill, id);
    if (!skill) return null;
    return serializeSkill(skill);
}

async function create(input, user) {
    const skill = await Skill.create({ ...pickSkillFields(input), createdBy: user._id });
    return serializeSkill(skill);
}

async function update(id, input) {
    const skill = await findByIdOrLegacy(Skill, id);
    if (!skill) return null;
    Object.assign(skill, pickSkillFields(input));
    await skill.save();
    return serializeSkill(skill);
}

async function remove(id) {
    const skill = await findByIdOrLegacy(Skill, id);
    if (!skill) return false;
    await skill.deleteOne();
    return true;
}

module.exports = { create, getById, remove, update };
