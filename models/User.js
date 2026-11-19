const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
    role: { type: String, enum: ['learner', 'mentor', 'admin'], default: 'learner', index: true },
    profileImage: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    department: { type: String, default: '', maxlength: 100 },
    year: { type: String, default: '', maxlength: 40 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
