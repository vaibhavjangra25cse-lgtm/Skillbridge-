const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
    legacyId: { type: Number, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254, default: '' },
    expertise: { type: [String], default: [] },
    experience: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 2000 },
    availability: { type: String, default: 'Contact for availability', maxlength: 500 },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0, min: 0 },
    teaches: { type: String, default: '' },
    wantsToLearn: { type: String, default: '' },
    avatar: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

mentorSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
mentorSchema.index({ expertise: 1 });

module.exports = mongoose.model('Mentor', mentorSchema);
