const express = require('express');
const controller = require('./explore.controller');

const router = express.Router();
router.get('/skills', controller.search);
router.get('/categories', controller.categories);

module.exports = router;
