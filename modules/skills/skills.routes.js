const express = require('express');
const { body } = require('express-validator');
const controller = require('./skills.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validation.middleware');
const auditAdmin = require('../../middleware/audit.middleware');

const router = express.Router();
const admin = [requireAuth, requireRole('admin')];
const skillFields = [
    body('title').trim().isLength({ min: 2, max: 120 }),
    body('description').trim().isLength({ min: 1, max: 2000 }),
    body('category').trim().isLength({ min: 1, max: 80 }),
    body('level').optional().trim().isLength({ max: 40 }),
    body('resources').optional().isArray({ max: 30 }),
    body('resources.*').optional().isString().isLength({ max: 500 }),
    body('image').optional().isString().isLength({ max: 300 }).matches(/^(|images\/[a-zA-Z0-9._/-]+)$/),
    body('alt').optional().isString().isLength({ max: 200 }),
    body('categoryClass').optional().isString().isLength({ max: 80 }).matches(/^[a-zA-Z0-9 _-]*$/),
    body('teacher').optional().isString().isLength({ max: 120 }),
    body('mentorCount').optional().isInt({ min: 0, max: 100000 }).toInt(),
    body('detailUrl').optional().isString().isLength({ max: 200 }).matches(/^(|skill-details\.html(?:\?.*)?)$/),
    body('details').optional().isObject(),
];

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', admin, skillFields, validateRequest, auditAdmin('skills.create'), controller.create);
router.put('/:id', admin, skillFields, validateRequest, auditAdmin('skills.update'), controller.update);
router.delete('/:id', ...admin, auditAdmin('skills.delete'), controller.remove);

module.exports = router;
