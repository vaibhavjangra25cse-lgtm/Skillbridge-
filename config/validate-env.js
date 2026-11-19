function validateEnvironment(env = process.env) {
    if (!env.MONGODB_URI) {
        throw new Error('MONGODB_URI is missing. Add it to your .env file before starting SkillBridge.');
    }
    if (
        !env.JWT_SECRET
        || env.JWT_SECRET.length < 32
        || env.JWT_SECRET.toLowerCase().includes('replace-with')
    ) {
        throw new Error('Set JWT_SECRET to a securely generated random value of at least 32 characters.');
    }

    if (env.NODE_ENV === 'production' && !env.CLIENT_ORIGIN) {
        throw new Error('CLIENT_ORIGIN must be explicitly configured in production.');
    }

    let origin;
    let database;
    const port = Number(env.PORT) || 5000;
    try {
        origin = new URL(env.CLIENT_ORIGIN || `http://localhost:${port}`);
        database = new URL(env.MONGODB_URI);
    } catch (error) {
        throw new Error('CLIENT_ORIGIN and MONGODB_URI must be valid URLs.');
    }
    const configuredOrigin = env.CLIENT_ORIGIN || `http://localhost:${port}`;
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== configuredOrigin.replace(/\/$/, '')) {
        throw new Error('CLIENT_ORIGIN must be an HTTP(S) origin without a path.');
    }
    if (!['mongodb:', 'mongodb+srv:'].includes(database.protocol)) {
        throw new Error('MONGODB_URI must use the MongoDB protocol.');
    }

    if (env.NODE_ENV === 'production') {
        if (origin.protocol !== 'https:') {
            throw new Error('CLIENT_ORIGIN must use HTTPS in production.');
        }
        const tlsEnabled = database.protocol === 'mongodb+srv:'
            || ['true', '1'].includes((database.searchParams.get('tls') || '').toLowerCase())
            || ['true', '1'].includes((database.searchParams.get('ssl') || '').toLowerCase());
        if (!database.username || !database.password || !tlsEnabled) {
            throw new Error('Production MongoDB connections require authenticated credentials and TLS.');
        }
    }
}

module.exports = validateEnvironment;
