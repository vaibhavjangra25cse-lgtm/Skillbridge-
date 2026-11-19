const express = require('express');
const { body } = require('express-validator');
const controller = require('./mentors.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validation.middleware');
const auditAdmin = require('../../middleware/audit.middleware');

const router = express.Router();
const admin = [requireAuth, requireRole('admin')];
const mentorProfileFields = [
    body('expertise').optional().isArray({ max: 30 }),
    body('expertise.*').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('experience').optional().isString().trim().isLength({ max: 100 }),
    body('bio').optional().isString().trim().isLength({ max: 2000 }),
    body('availability').optional().isString().trim().isLength({ max: 500 }),
    body('teaches').optional().isString().trim().isLength({ max: 500 }),
    body('wantsToLearn').optional().isString().trim().isLength({ max: 500 }),
];
const mentorFields = [
    body('name').trim().isLength({ min: 2, max: 120 }),
    body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
    body('expertise').optional().isArray({ max: 30 }),
    body('expertise.*').optional().isString().isLength({ min: 1, max: 100 }),
    body('experience').optional().isString().isLength({ max: 100 }),
    body('bio').optional().isString().isLength({ max: 2000 }),
    body('availability').optional().isString().isLength({ max: 500 }),
    body('department').optional().isString().isLength({ max: 100 }),
    body('year').optional().isString().isLength({ max: 40 }),
    body('rating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
    body('reviews').optional().isInt({ min: 0, max: 100000 }).toInt(),
    body('teaches').optional().isString().isLength({ max: 500 }),
    body('wantsToLearn').optional().isString().isLength({ max: 500 }),
    body('avatar').optional({ values: 'falsy' }).isObject(),
    body('user').optional({ values: 'falsy' }).isMongoId(),
];

router.get('/', controller.list);
router.get('/me', requireAuth, requireRole('mentor'), controller.getMine);
router.put('/me', requireAuth, requireRole('mentor'), mentorProfileFields, validateRequest, controller.updateMine);
router.get('/:id', controller.getById);
router.post('/', admin, mentorFields, validateRequest, auditAdmin('mentors.create'), controller.create);
router.put('/:id', admin, mentorFields, validateRequest, auditAdmin('mentors.update'), controller.update);
router.delete('/:id', ...admin, auditAdmin('mentors.delete'), controller.remove);

module.exports = router;
