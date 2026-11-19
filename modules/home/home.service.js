const Skill = require('../../models/Skill');
const Mentor = require('../../models/Mentor');
const Request = require('../../models/Request');
const { serializePublicMentor } = require('../mentors/mentors.service');
const { serializeSkill } = require('../../utils/records');

async function featuredSkills() {
    const skills = await Skill.find().sort({ mentorCount: -1, legacyId: 1, _id: 1 }).limit(6).lean();
    return skills.map(serializeSkill);
}

async function statistics() {
    const [skills, mentors, requests] = await Promise.all([
        Skill.countDocuments(),
        Mentor.countDocuments(),
        Request.countDocuments(),
    ]);
    return { skills, mentors, requests };
}

async function home() {
    const [skills, mentors, stats] = await Promise.all([
        featuredSkills(),
        Mentor.find().sort({ rating: -1 }).limit(3).lean(),
        statistics(),
    ]);
    return {
        featuredSkills: skills,
        mentors: mentors.map(mentor => serializePublicMentor(mentor)),
        statistics: stats,
    };
}

module.exports = { featuredSkills, home, statistics };
