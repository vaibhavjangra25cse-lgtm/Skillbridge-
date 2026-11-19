const test = require('node:test');
const assert = require('node:assert/strict');
const validateEnvironment = require('../config/validate-env');

test('environment validation rejects missing values and template secrets', () => {
    assert.throws(() => validateEnvironment({}), /MONGODB_URI is missing/);
    assert.throws(() => validateEnvironment({
        MONGODB_URI: 'mongodb://localhost/skillbridge',
        JWT_SECRET: 'replace-with-a-random-secret-at-least-32-characters',
    }), /securely generated/);
});

test('production requires HTTPS frontend origin and authenticated TLS MongoDB', () => {
    const base = {
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://app-user:fake-test-password@cluster.example/skillbridge',
        JWT_SECRET: 'test-only-secret-that-is-long-enough-123456',
        CLIENT_ORIGIN: 'https://skillbridge.example',
    };
    assert.doesNotThrow(() => validateEnvironment(base));
    assert.throws(() => validateEnvironment({ ...base, CLIENT_ORIGIN: 'http://skillbridge.example' }), /HTTPS/);
    assert.throws(() => validateEnvironment({
        ...base,
        MONGODB_URI: 'mongodb://app-user:fake-test-password@localhost/skillbridge',
    }), /TLS/);
});
