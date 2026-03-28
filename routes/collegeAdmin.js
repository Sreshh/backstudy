const express = require('express');
const { getCollegeAdminStats } = require('../controllers/collegeAdminController');
const router = express.Router();

router.get('/stats', getCollegeAdminStats);

module.exports = router;
