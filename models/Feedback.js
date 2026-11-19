const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254, default: '' },
    rating: { type: Number, default: null, min: 1, max: 5 },
    message: { type: String, required: true, trim: true, minlength: 5, maxlength: 4000 },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'feedback' });

feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
