const express = require('express');
const { body, param } = require('express-validator');
const controller = require('./feedback.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validation.middleware');
const { feedbackLimiter } = require('../../middleware/rate-limit.middleware');
const auditAdmin = require('../../middleware/audit.middleware');

const router = express.Router();
router.post('/', feedbackLimiter, [
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
    body('rating').optional({ values: 'falsy' }).isInt({ min: 1, max: 5 }).toInt(),
    body('message').trim().isLength({ min: 5, max: 4000 }),
    validateRequest,
], controller.create);
router.get('/', requireAuth, requireRole('admin'), auditAdmin('feedback.list'), controller.list);
router.delete('/:id', requireAuth, requireRole('admin'), param('id').isMongoId(), validateRequest, auditAdmin('feedback.delete'), controller.remove);

module.exports = router;
