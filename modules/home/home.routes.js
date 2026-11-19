const express = require('express');
const controller = require('./home.controller');

const router = express.Router();
router.get('/', controller.home);
router.get('/featured-skills', controller.featuredSkills);
router.get('/statistics', controller.statistics);

module.exports = router;
