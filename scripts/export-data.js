/**
 * SkillBridge — Export MongoDB Data to JSON Files
 *
 * Usage:  node scripts/export-data.js
 *
 * Connects to the MongoDB database defined in .env, reads every collection,
 * and writes the documents to individual JSON files inside the exports/ directory.
 */

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');

const User = require('../models/User');
const Skill = require('../models/Skill');
const Mentor = require('../models/Mentor');
const Request = require('../models/Request');
const Feedback = require('../models/Feedback');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

async function exportCollection(Model, filename) {
    const documents = await Model.find().lean();
    const filePath = path.join(EXPORTS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
    console.log(`  Exported ${documents.length} ${Model.modelName} documents → ${filename}`);
    return documents.length;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is missing. Add it to your .env file.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: 'skillbridge' });
    console.log('Connected.\n');

    // Ensure exports directory exists
    if (!fs.existsSync(EXPORTS_DIR)) {
        fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    console.log('Exporting collections:');
    const counts = {};
    counts.users = await exportCollection(User, 'users.json');
    counts.skills = await exportCollection(Skill, 'skills.json');
    counts.mentors = await exportCollection(Mentor, 'mentors.json');
    counts.requests = await exportCollection(Request, 'requests.json');
    counts.feedback = await exportCollection(Feedback, 'feedback.json');

    console.log('\nExport complete.');
    console.log(`Total documents exported: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
    console.log(`Files saved to: ${EXPORTS_DIR}`);

    await mongoose.disconnect();
}

main().catch(error => {
    console.error('Export failed:', error.message);
    process.exit(1);
});
