const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/error.middleware');
const requireTrustedOrigin = require('./middleware/origin.middleware');
const { issueCsrfToken, requireCsrfToken } = require('./middleware/csrf.middleware');
const { rejectUnsafeInput } = require('./middleware/input-safety.middleware');

const pageFiles = new Set([
    'index.html', 'explore.html', 'login.html', 'signup.html',
    'mentors.html', 'requests.html', 'feedback.html', 'skill-details.html',
    'explore.css', 'home.css', 'login.css', 'signup.css',
    'mentors.css', 'requests.css', 'skill-details.css',
]);
const staticDirectories = new Set(['css', 'data', 'images', 'js']);
const frontendScripts = new Set([
    'api.js', 'explore.js', 'feedback.js', 'home.js', 'login.js',
    'mentors.js', 'requests.js', 'signup.js', 'skill-details.js', 'storage.js',
]);
const frontendData = new Set([
    'explore.json', 'feedback.json', 'home.json', 'login.json',
    'mentors.json', 'requests.json', 'signup.json', 'skill-details.json',
]);

function isFrontendAsset(urlPath) {
    const segments = urlPath.split('/').filter(Boolean);
    if (segments.some(segment => segment === '.' || segment === '..' || segment.includes('\\') || segment.includes('%'))) return false;
    if (segments.length === 0) return true;
    if (segments.length === 1) return pageFiles.has(segments[0]);
    if (!staticDirectories.has(segments[0])) return false;
    if (segments[0] === 'data') return segments.length === 2 && frontendData.has(segments[1]);
    if (segments[0] === 'js') return segments.length === 2 && frontendScripts.has(segments[1]);
    if (segments[0] === 'css') return segments.length === 2 && segments[1].endsWith('.css');
    return segments[0] === 'images'
        && /\.(?:svg|png|jpe?g|webp|gif)$/i.test(segments[segments.length - 1]);
}

function createApp() {
    const app = express();
    const port = Number(process.env.PORT) || 5000;
    const clientOrigin = new URL(process.env.CLIENT_ORIGIN || `http://localhost:${port}`).origin;

    if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
                'img-src': ["'self'", 'data:'],
            },
        },
    }));
    app.use(cors({
        origin: clientOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    }));
    app.use(express.json({ limit: '20kb' }));
    app.use(cookieParser());
    app.use('/api', rejectUnsafeInput, requireTrustedOrigin, requireCsrfToken);

    app.get('/api/csrf-token', issueCsrfToken);

    app.get('/api/health', (req, res) => {
        const mongoose = require('mongoose');
        const connected = mongoose.connection.readyState === 1;
        res.status(connected ? 200 : 503).json({
            status: connected ? 'ok' : 'unavailable',
            database: connected ? 'connected' : 'disconnected',
        });
    });

    app.use('/api/auth', require('./modules/auth/auth.routes'));
    app.use('/api/home', require('./modules/home/home.routes'));
    app.use('/api/explore', require('./modules/explore/explore.routes'));
    app.use('/api/skills', require('./modules/skills/skills.routes'));
    app.use('/api/mentors', require('./modules/mentors/mentors.routes'));
    app.use('/api/requests', require('./modules/requests/requests.routes'));
    app.use('/api/feedback', require('./modules/feedback/feedback.routes'));
    app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
    app.use((req, res, next) => {
        if ((req.method === 'GET' || req.method === 'HEAD') && isFrontendAsset(decodeURIComponent(req.path).replace(/^\/+/, ''))) {
            return express.static(__dirname, { dotfiles: 'deny', index: false })(req, res, next);
        }
        return next();
    });
    app.use((req, res) => res.status(404).send('Page not found.'));
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
