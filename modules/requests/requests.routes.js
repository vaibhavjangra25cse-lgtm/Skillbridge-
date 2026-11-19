const express = require('express');
const { body, param } = require('express-validator');
const controller = require('./requests.controller');
const { requireAuth, requireRole } = require('../../middleware/auth.middleware');
const validateRequest = require('../../middleware/validation.middleware');
const auditAdmin = require('../../middleware/audit.middleware');
const requestLimiter = require('../../middleware/rate-limit.middleware').requestLimiter;

const router = express.Router();
router.use(requireAuth);
router.post('/', requestLimiter, [
    body('skillId').isString().isLength({ min: 1, max: 100 }),
    body('message').trim().isLength({ min: 5, max: 2000 }),
    body('mentorId').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
    body('mentorName').optional({ values: 'falsy' }).isString().isLength({ max: 120 }),
    validateRequest,
], controller.create);
router.get('/my', requireRole('learner', 'mentor', 'admin'), controller.mine);
router.get('/assigned', requireRole('mentor', 'admin'), auditAdmin('requests.assigned.list'), controller.assigned);
router.get('/', requireRole('admin'), auditAdmin('requests.list'), controller.all);
router.patch('/:id/status', [
    requireRole('mentor', 'admin'),
    param('id').isMongoId(),
    body('status').isIn(['accepted', 'rejected', 'completed']),
    validateRequest,
], auditAdmin('requests.status.update'), controller.updateStatus);

module.exports = router;
