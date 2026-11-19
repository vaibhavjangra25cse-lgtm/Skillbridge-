const test = require('node:test');
const assert = require('node:assert/strict');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

test('user password hash is private and email has a unique database index', () => {
    assert.equal(User.schema.path('passwordHash').options.select, false);
    assert.ok(User.schema.indexes().some(([keys, options]) => keys.email === 1 && options.unique === true));
});

test('feedback model accepts an omitted rating while requiring valid name and message', () => {
    const feedback = new Feedback({
        name: 'Test User',
        email: '',
        message: 'A helpful piece of feedback.',
    });
    assert.equal(feedback.validateSync(), undefined);
    assert.equal(feedback.rating, null);
});

test('feedback model rejects ratings outside the supported range', () => {
    const feedback = new Feedback({
        name: 'Test User',
        rating: 6,
        message: 'A helpful piece of feedback.',
    });
    assert.equal(feedback.validateSync().errors.rating.kind, 'max');
});
