const Feedback = require('../../models/Feedback');

async function create(input) {
    return Feedback.create({
        name: input.name.trim(),
        email: input.email ? input.email.trim().toLowerCase() : '',
        rating: input.rating ?? null,
        message: input.message.trim(),
    });
}

async function list() {
    return Feedback.find().sort({ createdAt: -1 }).limit(500).lean();
}

async function remove(id) {
    const result = await Feedback.findByIdAndDelete(id);
    return Boolean(result);
}

module.exports = { create, list, remove };
