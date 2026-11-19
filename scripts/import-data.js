/**
 * SkillBridge — Import JSON Files into MongoDB
 *
 * Usage:  node scripts/import-data.js
 *
 * Reads JSON files from the exports/ directory and inserts their documents
 * into the corresponding MongoDB collections. Existing documents with the
 * same _id are skipped (not overwritten) to prevent data loss.
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

const FILE_MODEL_MAP = [
    { filename: 'users.json', Model: User },
    { filename: 'skills.json', Model: Skill },
    { filename: 'mentors.json', Model: Mentor },
    { filename: 'requests.json', Model: Request },
    { filename: 'feedback.json', Model: Feedback },
];

async function importFile(Model, filename) {
    const filePath = path.join(EXPORTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`  Skipped ${filename} (file not found)`);
        return 0;
    }

    const documents = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`  Skipped ${filename} (empty or invalid)`);
        return 0;
    }

    // Use ordered:false so one duplicate doesn't stop the entire batch
    let inserted = 0;
    try {
        const result = await Model.insertMany(documents, { ordered: false });
        inserted = result.length;
    } catch (error) {
        // E11000 duplicate key errors are expected when re-importing
        if (error.code === 11000 || error.writeErrors) {
            inserted = error.insertedDocs?.length || 0;
            const skipped = documents.length - inserted;
            console.log(`  ${filename}: ${inserted} imported, ${skipped} skipped (already exist)`);
            return inserted;
        }
        throw error;
    }

    console.log(`  Imported ${inserted} ${Model.modelName} documents from ${filename}`);
    return inserted;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is missing. Add it to your .env file.');
        process.exit(1);
    }

    if (!fs.existsSync(EXPORTS_DIR)) {
        console.error(`No exports directory found at: ${EXPORTS_DIR}`);
        console.error('Run "node scripts/export-data.js" first to create export files.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: 'skillbridge' });
    console.log('Connected.\n');

    console.log('Importing collections:');
    let total = 0;
    for (const { filename, Model } of FILE_MODEL_MAP) {
        total += await importFile(Model, filename);
    }

    console.log(`\nImport complete. ${total} documents imported.`);

    await mongoose.disconnect();
}

main().catch(error => {
    console.error('Import failed:', error.message);
    process.exit(1);
});
