const express = require('express');
const { body, param } = require('express-validator');
const controller = require('./auth.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validation.middleware');
const authLimiter = require('../../middleware/rate-limit.middleware').authLimiter;
const auditAdmin = require('../../middleware/audit.middleware');

const router = express.Router();
const emailRule = body('email').isEmail().withMessage('Enter a valid email address.').normalizeEmail();
const passwordRule = body('password').isString().isLength({ min: 8, max: 72 })
    .custom(value => typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage('Password must be 8 to 72 characters and no more than 72 UTF-8 bytes.');

router.post('/register', authLimiter, [
    body('firstName').trim().isLength({ min: 1, max: 60 }),
    body('lastName').trim().isLength({ min: 1, max: 60 }),
    emailRule,
    body('department').trim().isLength({ min: 1, max: 100 }),
    body('year').trim().isLength({ min: 1, max: 40 }),
    body('role').optional().isIn(['learner', 'mentor']),
    passwordRule,
    validateRequest,
], controller.register);

router.post('/login', authLimiter, [emailRule, passwordRule, validateRequest], controller.login);
router.get('/me', requireAuth, controller.me);
router.post('/logout', requireAuth, controller.logout);
router.delete('/me', requireAuth, [
    body('password').isString().isLength({ min: 8, max: 72 })
        .custom(value => typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72),
    validateRequest,
], controller.removeAccount);
router.get('/users', requireAuth, requireRole('admin'), auditAdmin('users.list'), controller.listUsers);
router.patch('/users/:id/role', requireAuth, requireRole('admin'), [
    param('id').isMongoId(),
    body('role').isIn(['learner', 'mentor', 'admin']),
    validateRequest,
], auditAdmin('users.role.update'), controller.updateRole);

module.exports = router;
