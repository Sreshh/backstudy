const express = require('express');
const { getClassrooms } = require('../controllers/classroomController');
const router = express.Router();

router.get('/', getClassrooms);

module.exports = router;
