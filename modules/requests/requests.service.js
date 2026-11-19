const Mentor = require('../../models/Mentor');
const Request = require('../../models/Request');
const Skill = require('../../models/Skill');
const { findByIdOrLegacy, serializeRequest } = require('../../utils/records');

async function create(input, learner) {
    const skill = await findByIdOrLegacy(Skill, input.skillId);
    if (!skill) {
        const error = new Error('The selected skill does not exist.');
        error.status = 400;
        throw error;
    }

    let mentor = null;
    if (input.mentorId) mentor = await findByIdOrLegacy(Mentor, input.mentorId);
    else if (input.mentorName) mentor = await Mentor.findOne({ name: input.mentorName.trim() });
    if (input.mentorId && !mentor) {
        const error = new Error('The selected mentor does not exist.');
        error.status = 400;
        throw error;
    }

    const request = await Request.create({
        learner: learner._id,
        skill: skill._id,
        mentor: mentor?._id || null,
        message: input.message,
    });
    return serializeRequest(await request.populate('learner skill mentor'));
}

async function listForLearner(learner) {
    const requests = await Request.find({ learner: learner._id })
        .populate('learner', 'name')
        .populate('skill', 'title')
        .populate('mentor', 'name')
        .sort({ createdAt: -1 })
        .limit(500);
    return requests.map(serializeRequest);
}

async function listForMentor(user) {
    const mentor = await Mentor.findOne({ user: user._id });
    if (!mentor) return [];
    const requests = await Request.find({ mentor: mentor._id })
        .populate('learner', 'name')
        .populate('skill', 'title')
        .populate('mentor', 'name')
        .sort({ createdAt: -1 })
        .limit(500);
    return requests.map(serializeRequest);
}

async function listAll() {
    const requests = await Request.find()
        .populate('learner', 'name')
        .populate('skill', 'title')
        .populate('mentor', 'name')
        .sort({ createdAt: -1 })
        .limit(500);
    return requests.map(serializeRequest);
}

async function updateStatus(id, status, user) {
    const request = await Request.findById(id).populate('learner skill mentor');
    if (!request) return null;
    if (user.role !== 'admin') {
        if (user.role !== 'mentor') {
            const error = new Error('Only the assigned mentor can update this request.');
            error.status = 403;
            throw error;
        }
        const mentor = await Mentor.findOne({ user: user._id });
        if (!mentor || !request.mentor || !request.mentor._id.equals(mentor._id)) {
            const error = new Error('This request is not assigned to your mentor profile.');
            error.status = 403;
            throw error;
        }
    }
    const allowed = {
        pending: ['accepted', 'rejected'],
        accepted: ['completed'],
        rejected: [],
        completed: [],
    };
    if (!allowed[request.status].includes(status)) {
        const error = new Error(`A ${request.status} request cannot be changed to ${status}.`);
        error.status = 400;
        throw error;
    }
    request.status = status;
    await request.save();
    return serializeRequest(request);
}

module.exports = { create, listAll, listForLearner, listForMentor, updateStatus };
