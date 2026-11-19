const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Mentor = require('../../models/Mentor');
const Request = require('../../models/Request');
const { publicUser } = require('../../utils/records');

async function register(input) {
    const role = input.role || 'learner';
    if (!['learner', 'mentor'].includes(role)) {
        const error = new Error('Choose a learner or mentor account type.');
        error.status = 400;
        throw error;
    }
    const email = input.email.trim().toLowerCase();
    if (await User.exists({ email })) {
        const error = new Error('An account with this email already exists.');
        error.status = 409;
        throw error;
    }
    const user = await User.create({
        name: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
        email,
        passwordHash: await bcrypt.hash(input.password, 12),
        role,
        department: input.department.trim(),
        year: input.year.trim(),
    });
    if (user.role === 'mentor') {
        await Mentor.create({
            user: user._id,
            name: user.name,
            email: user.email,
            department: user.department,
            year: user.year,
            bio: user.bio,
            expertise: [],
        });
    }
    return user;
}

async function login(email, password) {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash +tokenVersion');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        const error = new Error('Incorrect email or password.');
        error.status = 401;
        throw error;
    }
    return user;
}

async function listUsers() {
    const users = await User.find().sort({ createdAt: -1 }).limit(500);
    return users.map(publicUser);
}

async function updateRole(id, role) {
    const user = await User.findById(id);
    if (!user) return null;
    user.role = role;
    await user.save();
    if (role === 'mentor') {
        await Mentor.findOneAndUpdate(
            { user: user._id },
            { $setOnInsert: { user: user._id, name: user.name, email: user.email, expertise: [] } },
            { upsert: true, new: true }
        );
    }
    return publicUser(user);
}

async function logout(user) {
    user.tokenVersion += 1;
    await user.save();
}

async function removeAccount(user, password) {
    const account = await User.findById(user._id).select('+passwordHash +tokenVersion');
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        const error = new Error('The password was not accepted.');
        error.status = 401;
        throw error;
    }

    const session = await User.startSession();
    try {
        await session.withTransaction(async () => {
            if (account.role === 'admin') {
                const otherAdmins = await User.countDocuments({
                    role: 'admin',
                    _id: { $ne: account._id },
                }).session(session);
                if (otherAdmins === 0) {
                    const error = new Error('Promote another administrator before deleting this account.');
                    error.status = 409;
                    throw error;
                }
            }

            const mentor = await Mentor.findOne({ user: account._id }).session(session);
            if (mentor) {
                const activeRequests = await Request.countDocuments({
                    mentor: mentor._id,
                    status: { $in: ['pending', 'accepted'] },
                }).session(session);
                if (activeRequests > 0) {
                    const error = new Error('Resolve assigned learning requests before deleting this mentor account.');
                    error.status = 409;
                    throw error;
                }
                await Request.updateMany(
                    { mentor: mentor._id },
                    { $set: { mentor: null } },
                    { session }
                );
                await Mentor.deleteOne({ _id: mentor._id }, { session });
            }

            await Request.deleteMany({ learner: account._id }, { session });
            await User.deleteOne({ _id: account._id }, { session });
        });
    } finally {
        await session.endSession();
    }
}

module.exports = { listUsers, login, logout, publicUser, register, removeAccount, updateRole };
