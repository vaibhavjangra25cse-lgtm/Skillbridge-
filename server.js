require('dotenv').config();

const mongoose = require('mongoose');
const createApp = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./scripts/seed');
const validateEnvironment = require('./config/validate-env');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Mentor = require('./models/Mentor');
const Request = require('./models/Request');
const Feedback = require('./models/Feedback');

async function startServer() {
    validateEnvironment();
    await connectDB();
    await Promise.all([User.init(), Skill.init(), Mentor.init(), Request.init(), Feedback.init()]);
    await seedDatabase();
    const port = Number(process.env.PORT) || 5000;
    const server = createApp().listen(port, () => {
        console.log(`SkillBridge is running at http://localhost:${port}`);
    });

    const shutdown = async () => {
        server.close(async () => {
            await mongoose.disconnect();
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

if (require.main === module) {
    startServer().catch(error => {
    console.error('\nUnable to start SkillBridge.');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    process.exit(1);
});
}

module.exports = startServer;
