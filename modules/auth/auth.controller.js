const authService = require('./auth.service');
const { clearAuthCookie, setAuthCookie } = require('../../middleware/auth.middleware');

async function register(req, res, next) {
    try {
        const user = await authService.register(req.body);
        setAuthCookie(res, user);
        return res.status(201).json({ user: authService.publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

async function login(req, res, next) {
    try {
        const user = await authService.login(req.body.email, req.body.password);
        setAuthCookie(res, user);
        return res.json({ user: authService.publicUser(user) });
    } catch (error) {
        return next(error);
    }
}

function me(req, res) {
    res.json({ user: authService.publicUser(req.user) });
}

async function logout(req, res, next) {
    try {
        await authService.logout(req.user);
    } catch (error) {
        return next(error);
    }
    clearAuthCookie(res);
    return res.json({ message: 'Signed out successfully.' });
}

async function removeAccount(req, res, next) {
    try {
        await authService.removeAccount(req.user, req.body.password);
        clearAuthCookie(res);
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}

async function listUsers(req, res, next) {
    try {
        return res.json({ users: await authService.listUsers() });
    } catch (error) {
        return next(error);
    }
}

async function updateRole(req, res, next) {
    try {
        if (req.params.id === req.user._id.toString() && req.body.role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own administrator role.' });
        }
        const user = await authService.updateRole(req.params.id, req.body.role);
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.json({ user });
    } catch (error) {
        return next(error);
    }
}

module.exports = { listUsers, login, logout, me, register, removeAccount, updateRole };
