const fs = require('node:fs');
const path = require('node:path');
const Skill = require('../models/Skill');
const Mentor = require('../models/Mentor');

function readData(filename) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', filename), 'utf8'));
}

async function seedSkills() {
    const { skills } = readData('explore.json');
    const details = readData('skill-details.json').skill;
    await Skill.bulkWrite(skills.map(skill => {
        const { id, difficulty, ...record } = skill;
        return {
            updateOne: {
                filter: { legacyId: id },
                update: {
                    $setOnInsert: {
                        ...record,
                        legacyId: id,
                        level: difficulty,
                        resources: id === 1 ? details.whatYoullLearn : [],
                        details: id === 1 ? details : null,
                    },
                },
                upsert: true,
            },
        };
    }));
    console.log(`Imported ${skills.length} existing sample skills without overwriting database records.`);
}

async function seedMentors() {
    const { mentors } = readData('mentors.json');
    await Mentor.bulkWrite(mentors.map(mentor => {
        const { id, ...record } = mentor;
        return {
            updateOne: {
                filter: { legacyId: id },
                update: {
                    $setOnInsert: {
                        ...record,
                        legacyId: id,
                        email: '',
                        expertise: (record.teaches || '').split(',').map(value => value.trim()).filter(Boolean),
                        availability: 'Contact for availability',
                    },
                },
                upsert: true,
            },
        };
    }));
    console.log(`Imported ${mentors.length} existing sample mentors without overwriting database records.`);
}

async function seedDatabase() {
    await seedSkills();
    await seedMentors();
}

module.exports = seedDatabase;
