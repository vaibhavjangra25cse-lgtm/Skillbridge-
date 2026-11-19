const mongoose = require('mongoose');

async function connectDB() {
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is missing. Add it to your .env file before starting SkillBridge.');
    }

    await mongoose.connect(MONGODB_URI, { dbName: 'skillbridge', serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected.');
}

module.exports = connectDB;
