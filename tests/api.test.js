const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-only-secret-do-not-use-outside-tests';
process.env.CLIENT_ORIGIN = 'http://localhost:5000';

const createApp = require('../app');
const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Request = require('../models/Request');
const authService = require('../modules/auth/auth.service');
const requestService = require('../modules/requests/requests.service');
const { serializePublicMentor } = require('../modules/mentors/mentors.service');
const { setAuthCookie } = require('../middleware/auth.middleware');
const app = createApp();
const trustedOrigin = process.env.CLIENT_ORIGIN;

async function csrfAgent() {
    const agent = request.agent(app);
    const response = await agent.get('/api/csrf-token');
    assert.equal(response.status, 200);
    return { agent, token: response.body.csrfToken };
}

function signedToken(sub, payload = {}) {
    return jwt.sign({ sub, ...payload }, process.env.JWT_SECRET, { expiresIn: '1h', issuer: 'skillbridge' });
}

test('health endpoint reports database readiness instead of faking availability', async () => {
    const response = await request(app).get('/api/health');
    assert.ok([200, 503].includes(response.status));
    assert.ok(['connected', 'disconnected'].includes(response.body.database));
});

test('missing, malformed and expired JWT cookies are rejected', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', 'skillbridge_token=invalid')).status, 401);
    const expired = jwt.sign(
        { sub: new mongoose.Types.ObjectId().toString(), ver: 0 },
        process.env.JWT_SECRET,
        { expiresIn: '-1s', issuer: 'skillbridge' }
    );
    assert.equal((await request(app).get('/api/auth/me').set('Cookie', `skillbridge_token=${expired}`)).status, 401);
});

test('login uses an HttpOnly cookie and logout invalidates the signed token', async () => {
    const userId = new mongoose.Types.ObjectId();
    const passwordHash = await bcrypt.hash('correct-test-password', 12);
    const fakeUser = {
        _id: userId,
        name: 'Test Learner',
        email: 'learner@example.com',
        role: 'learner',
        tokenVersion: 0,
        passwordHash,
        department: 'Engineering',
        year: '1st',
        save: async function save() {},
    };
    const originalFindOne = User.findOne;
    const originalFindById = User.findById;
    User.findOne = () => ({ select: async () => fakeUser });
    User.findById = () => ({ select: async () => fakeUser });
    try {
        const { agent, token: csrfToken } = await csrfAgent();
        const login = await agent
            .post('/api/auth/login')
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', csrfToken)
            .send({ email: fakeUser.email, password: 'correct-test-password' });
        assert.equal(login.status, 200);
        assert.equal(Object.hasOwn(login.body.user, 'passwordHash'), false);
        const authCookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('skillbridge_token='));
        assert.match(authCookie, /HttpOnly/i);
        assert.match(authCookie, /SameSite=Strict/i);
        assert.doesNotMatch(authCookie, /Secure/i);

        const logout = await agent
            .post('/api/auth/logout')
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', csrfToken);
        assert.equal(logout.status, 200);
        assert.equal(fakeUser.tokenVersion, 1);
        const oldSession = await request(app)
            .get('/api/auth/me')
            .set('Cookie', authCookie.split(';')[0]);
        assert.equal(oldSession.status, 401);
    } finally {
        User.findOne = originalFindOne;
        User.findById = originalFindById;
    }
});

test('production authentication cookies are marked Secure', () => {
    const previousEnvironment = process.env.NODE_ENV;
    let cookieOptions;
    process.env.NODE_ENV = 'production';
    try {
        setAuthCookie({
            cookie(name, value, options) {
                cookieOptions = options;
            },
        }, { _id: new mongoose.Types.ObjectId(), tokenVersion: 0 });
        assert.equal(cookieOptions.httpOnly, true);
        assert.equal(cookieOptions.secure, true);
        assert.equal(cookieOptions.sameSite, 'strict');
    } finally {
        if (previousEnvironment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousEnvironment;
    }
});

test('unsafe requests require a trusted origin and a matching CSRF cookie/header token', async () => {
    const noOrigin = await request(app).post('/api/feedback').send({});
    assert.equal(noOrigin.status, 403);

    const wrongOrigin = await request(app)
        .post('/api/feedback')
        .set('Origin', 'https://attacker.example')
        .send({});
    assert.equal(wrongOrigin.status, 403);

    const { agent, token } = await csrfAgent();
    const missingToken = await request(app)
        .post('/api/feedback')
        .set('Origin', trustedOrigin)
        .send({});
    assert.equal(missingToken.status, 403);

    const invalidToken = await agent
        .post('/api/feedback')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', `${token}invalid`)
        .send({});
    assert.equal(invalidToken.status, 403);
});

test('feedback submission validates server-side fields; retrieval is not public', async () => {
    const { agent, token } = await csrfAgent();
    const invalid = await agent
        .post('/api/feedback')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', token)
        .send({ name: 'A', email: 'not-an-email', rating: 7, message: '' });
    assert.equal(invalid.status, 400);
    assert.ok(Array.isArray(invalid.body.details));

    assert.equal((await request(app).get('/api/feedback')).status, 401);
    const unauthorizedDelete = await agent
        .delete('/api/feedback/507f1f77bcf86cd799439011')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', token);
    assert.equal(unauthorizedDelete.status, 401);
});

test('registration cannot assign administrator privileges from user input', async () => {
    const { agent, token } = await csrfAgent();
    const response = await agent
        .post('/api/auth/register')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', token)
        .send({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            department: 'Engineering',
            year: '1st',
            password: 'a-secure-test-password',
            role: 'admin',
        });
    assert.equal(response.status, 400);
});

test('unexpected signup field types and bcrypt-overlong passwords are rejected', async () => {
    const { agent, token } = await csrfAgent();
    const response = await agent
        .post('/api/auth/register')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', token)
        .send({
            firstName: { value: 'Test' },
            lastName: [],
            email: { address: 'test@example.com' },
            department: {},
            year: [],
            password: 'é'.repeat(40),
        });
    assert.equal(response.status, 400);
});

test('authentication role middleware denies learners administrative reads and writes', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeLearner = { _id: userId, tokenVersion: 0, role: 'learner' };
    const originalFindById = User.findById;
    User.findById = () => ({ select: async () => fakeLearner });
    try {
        const { agent, token } = await csrfAgent();
        const cookie = `skillbridge_token=${signedToken(userId.toString(), { ver: 0 })}; skillbridge_csrf=${token}`;
        assert.equal((await request(app).get('/api/feedback').set('Cookie', cookie)).status, 403);
        assert.equal((await request(app).get('/api/requests').set('Cookie', cookie)).status, 403);
        const mentorProfile = await request(app)
            .put('/api/mentors/me')
            .set('Cookie', cookie)
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', token)
            .send({ bio: 'Attempt to update a mentor profile.' });
        assert.equal(mentorProfile.status, 403);
        const update = await agent
            .patch(`/api/auth/users/${new mongoose.Types.ObjectId()}/role`)
            .set('Cookie', cookie)
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', token)
            .send({ role: 'admin' });
        assert.equal(update.status, 403);
    } finally {
        User.findById = originalFindById;
    }
});

test('learner and mentor request queries are scoped to their own account/profile', async () => {
    const learnerId = new mongoose.Types.ObjectId();
    const mentorUserId = new mongoose.Types.ObjectId();
    const mentorId = new mongoose.Types.ObjectId();
    const filters = [];
    const originalFind = Request.find;
    const originalMentorFindOne = Mentor.findOne;
    Request.find = filter => {
        filters.push(filter);
        return {
            populate() { return this; },
            sort() { return this; },
            limit: async () => [],
        };
    };
    Mentor.findOne = async () => ({ _id: mentorId });
    try {
        await requestService.listForLearner({ _id: learnerId });
        await requestService.listForMentor({ _id: mentorUserId });
        assert.equal(filters[0].learner.toString(), learnerId.toString());
        assert.equal(filters[1].mentor.toString(), mentorId.toString());
    } finally {
        Request.find = originalFind;
        Mentor.findOne = originalMentorFindOne;
    }
});

test('mentor self-service profile updates only allow profile fields', async () => {
    const userId = new mongoose.Types.ObjectId();
    const mentor = {
        user: userId,
        expertise: [],
        bio: '',
        save: async function save() {},
        _id: new mongoose.Types.ObjectId(),
    };
    const originalFindOne = Mentor.findOne;
    Mentor.findOne = async () => mentor;
    try {
        await require('../modules/mentors/mentors.service').updateByUser(userId, {
            expertise: [' Python ', ''],
            bio: 'A mentor profile.',
            role: 'admin',
            email: 'private@example.com',
        });
        assert.deepEqual(mentor.expertise, ['Python']);
        assert.equal(mentor.bio, 'A mentor profile.');
        assert.equal(mentor.role, undefined);
        assert.equal(mentor.email, undefined);
    } finally {
        Mentor.findOne = originalFindOne;
    }
});

test('a mentor can update their own profile through the authenticated API', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeMentor = {
        _id: new mongoose.Types.ObjectId(),
        user: userId,
        expertise: [],
        bio: '',
        save: async function save() {},
    };
    const fakeUser = { _id: userId, tokenVersion: 0, role: 'mentor' };
    const originalUserFindById = User.findById;
    const originalMentorFindOne = Mentor.findOne;
    User.findById = () => ({ select: async () => fakeUser });
    Mentor.findOne = async () => fakeMentor;
    try {
        const { token } = await csrfAgent();
        const cookie = `skillbridge_token=${signedToken(userId.toString(), { ver: 0 })}; skillbridge_csrf=${token}`;
        const response = await request(app)
            .put('/api/mentors/me')
            .set('Cookie', cookie)
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', token)
            .send({ bio: 'A database-backed profile.' });
        assert.equal(response.status, 200);
        assert.equal(response.body.mentor.bio, 'A database-backed profile.');
        assert.equal(fakeMentor.bio, 'A database-backed profile.');
    } finally {
        User.findById = originalUserFindById;
        Mentor.findOne = originalMentorFindOne;
    }
});

test('a mentor cannot update a request assigned to another mentor', async () => {
    const unrelatedMentorId = new mongoose.Types.ObjectId();
    const requestMentorId = new mongoose.Types.ObjectId();
    const originalFindById = Request.findById;
    const originalMentorFindOne = Mentor.findOne;
    Request.findById = () => ({
        populate: async () => ({
            _id: new mongoose.Types.ObjectId(),
            mentor: { _id: requestMentorId },
            status: 'pending',
        }),
    });
    Mentor.findOne = async () => ({ _id: unrelatedMentorId });
    try {
        await assert.rejects(
            requestService.updateStatus(new mongoose.Types.ObjectId().toString(), 'accepted', {
                _id: new mongoose.Types.ObjectId(),
                role: 'mentor',
            }),
            error => error.status === 403
        );
    } finally {
        Request.findById = originalFindById;
        Mentor.findOne = originalMentorFindOne;
    }
});

test('registration service hashes passwords and public user data excludes hashes', async () => {
    const originalExists = User.exists;
    const originalCreate = User.create;
    let savedUser;
    User.exists = async () => false;
    User.create = async input => {
        savedUser = input;
        return { ...input, _id: new mongoose.Types.ObjectId() };
    };
    try {
        const user = await authService.register({
            firstName: 'Test',
            lastName: 'User',
            email: 'hashing@example.com',
            password: 'a-secure-test-password',
            department: 'Engineering',
            year: '1st',
        });
        assert.notEqual(savedUser.passwordHash, 'a-secure-test-password');
        assert.equal(bcrypt.getRounds(savedUser.passwordHash), 12);
        assert.equal(await bcrypt.compare('a-secure-test-password', savedUser.passwordHash), true);
        assert.equal(Object.hasOwn(authService.publicUser(user), 'passwordHash'), false);
    } finally {
        User.exists = originalExists;
        User.create = originalCreate;
    }
});

test('duplicate registration and invalid credentials return authentication errors', async () => {
    const originalExists = User.exists;
    const originalFindOne = User.findOne;
    User.exists = async () => true;
    User.findOne = () => ({ select: async () => null });
    try {
        await assert.rejects(
            authService.register({
                firstName: 'Test',
                lastName: 'User',
                email: 'duplicate@example.com',
                password: 'a-secure-test-password',
                department: 'Engineering',
                year: '1st',
            }),
            error => error.status === 409
        );
        await assert.rejects(
            authService.login('missing@example.com', 'wrong-password'),
            error => error.status === 401
        );
    } finally {
        User.exists = originalExists;
        User.findOne = originalFindOne;
    }
});

test('public mentor serialization excludes email and linked user identifiers', () => {
    const mentor = serializePublicMentor({
        _id: new mongoose.Types.ObjectId(),
        name: 'Public Mentor',
        email: 'private@example.com',
        user: new mongoose.Types.ObjectId(),
        expertise: ['Design'],
        avatar: { type: 'image', src: 'javascript:alert(1)', user: 'private-id' },
    });
    assert.equal(Object.hasOwn(mentor, 'email'), false);
    assert.equal(Object.hasOwn(mentor, 'user'), false);
    assert.equal(Object.hasOwn(mentor.avatar, 'user'), false);
    assert.equal(Object.hasOwn(mentor.avatar, 'src'), false);
});

test('operator injection, HTTP parameter pollution and invalid IDs are rejected safely', async () => {
    assert.equal((await request(app).get('/api/mentors?search%5B%24ne%5D=value')).status, 400);
    assert.equal((await request(app).get('/api/mentors?search=one&search=two')).status, 400);
    assert.equal((await request(app).get('/api/skills/not-an-object-id')).status, 404);
    const { agent, token } = await csrfAgent();
    const injectedBody = await agent
        .post('/api/feedback')
        .set('Origin', trustedOrigin)
        .set('X-CSRF-Token', token)
        .send({ name: 'Test User', message: 'A valid feedback message', $where: 'this.secret' });
    assert.equal(injectedBody.status, 400);
});

test('malformed and oversized JSON bodies receive client errors', async () => {
    const malformed = await request(app)
        .post('/api/feedback')
        .set('Content-Type', 'application/json')
        .send('{"message":');
    assert.equal(malformed.status, 400);

    const oversized = await request(app)
        .post('/api/feedback')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ message: 'x'.repeat(21 * 1024) }));
    assert.equal(oversized.status, 413);
});

test('the login limiter returns 429 after repeated requests', async () => {
    const { agent, token } = await csrfAgent();
    let response;
    for (let attempt = 0; attempt < 21; attempt += 1) {
        response = await agent
            .post('/api/auth/login')
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', token)
            .send({});
    }
    assert.equal(response.status, 429);
});

test('feedback submission limiter returns 429 after repeated attempts', async () => {
    const { agent, token } = await csrfAgent();
    let response;
    for (let attempt = 0; attempt < 11; attempt += 1) {
        response = await agent
            .post('/api/feedback')
            .set('Origin', trustedOrigin)
            .set('X-CSRF-Token', token)
            .send({});
    }
    assert.equal(response.status, 429);
});

test('learning-request creation limiter returns 429 for an authenticated account', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeLearner = { _id: userId, tokenVersion: 0, role: 'learner' };
    const originalFindById = User.findById;
    User.findById = () => ({ select: async () => fakeLearner });
    try {
        const { agent, token } = await csrfAgent();
        const cookie = `skillbridge_token=${signedToken(userId.toString(), { ver: 0 })}`;
        let response;
        for (let attempt = 0; attempt < 21; attempt += 1) {
            response = await agent
                .post('/api/requests')
                .set('Cookie', cookie)
                .set('Origin', trustedOrigin)
                .set('X-CSRF-Token', token)
                .send({});
        }
        assert.equal(response.status, 429);
    } finally {
        User.findById = originalFindById;
    }
});

test('frontend scripts avoid unsafe HTML sinks and API returns safe static assets', async () => {
    const scriptsPath = path.join(__dirname, '..', 'js');
    const scripts = fs.readdirSync(scriptsPath).filter(file => file.endsWith('.js'));
    for (const script of scripts) {
        const source = fs.readFileSync(path.join(scriptsPath, script), 'utf8');
        assert.doesNotMatch(source, /\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML\s*\(|document\.write\s*\(/, script);
    }
    const page = await request(app).get('/login.html');
    assert.equal(page.status, 200);
    assert.match(page.headers['content-security-policy'], /default-src 'self'/);
    assert.doesNotMatch(page.headers['content-security-policy'], /script-src[^;]*unsafe-inline/);
    assert.equal(page.headers['x-powered-by'], undefined);
    assert.equal((await request(app).get('/js/mentors.js')).status, 200);
    assert.equal((await request(app).get('/models/User.js')).status, 404);
    assert.equal((await request(app).get('/data/private.json')).status, 404);
});
