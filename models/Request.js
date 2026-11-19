const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor', default: null, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    message: { type: String, required: true, trim: true, minlength: 5, maxlength: 2000 },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending',
        index: true,
    },
}, { timestamps: true });

requestSchema.index({ learner: 1, createdAt: -1 });
requestSchema.index({ mentor: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Request', requestSchema);
