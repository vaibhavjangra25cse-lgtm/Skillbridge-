const mongoose = require('mongoose');

async function findByIdOrLegacy(Model, id) {
    if (mongoose.isValidObjectId(id)) {
        const document = await Model.findById(id);
        if (document) return document;
    }
    if (/^\d+$/.test(String(id))) {
        return Model.findOne({ legacyId: Number(id) });
    }
    return null;
}

function publicUser(user) {
    const names = user.name.trim().split(/\s+/);
    return {
        id: user._id.toString(),
        firstName: names.shift() || '',
        lastName: names.join(' '),
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        role: user.role,
        profileImage: user.profileImage,
        bio: user.bio,
    };
}

function serializeSkill(skill) {
    const value = typeof skill.toObject === 'function' ? skill.toObject() : skill;
    const { createdBy, ...publicValue } = value;
    const safeImage = typeof value.image === 'string'
        && /^images\/(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9._/-]+\.(?:svg|png|jpe?g|webp)$/i.test(value.image)
        ? value.image
        : '';
    const safeDetailUrl = typeof value.detailUrl === 'string'
        && /^skill-details\.html(?:\?[a-zA-Z0-9_=&%-]*)?$/.test(value.detailUrl)
        ? value.detailUrl
        : 'skill-details.html';
    return { ...publicValue, image: safeImage, detailUrl: safeDetailUrl, id: value._id.toString() };
}

function serializeMentor(mentor) {
    const value = typeof mentor.toObject === 'function' ? mentor.toObject() : mentor;
    return { ...value, id: value._id.toString() };
}

function serializeRequest(request) {
    return {
        requestId: request._id.toString(),
        _id: request._id.toString(),
        studentId: request.learner?._id?.toString() || request.learner?.toString(),
        studentName: request.learner?.name || '',
        skillId: request.skill?._id?.toString() || request.skill?.toString(),
        skillName: request.skill?.title || '',
        description: request.message,
        mentorId: request.mentor?._id?.toString() || request.mentor?.toString() || '',
        mentorName: request.mentor?.name || '',
        status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
    };
}

module.exports = { findByIdOrLegacy, publicUser, serializeMentor, serializeRequest, serializeSkill };
