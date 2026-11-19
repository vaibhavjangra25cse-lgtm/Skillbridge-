const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    legacyId: { type: Number, unique: true, sparse: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    level: { type: String, default: 'All Levels', trim: true, maxlength: 40 },
    resources: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    image: { type: String, default: '' },
    alt: { type: String, default: '' },
    categoryClass: { type: String, default: '' },
    teacher: { type: String, default: '' },
    mentorCount: { type: Number, default: 0 },
    detailUrl: { type: String, default: 'skill-details.html' },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

skillSchema.index({ category: 1, level: 1, title: 1 });

module.exports = mongoose.model('Skill', skillSchema);
