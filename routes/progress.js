const express = require('express');
const { getOverallProgress, logPomodoroSession } = require('../controllers/progressController');
const { toggleTopicStatus } = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getOverallProgress);
router.post('/topic/:topicId/toggle', toggleTopicStatus);
router.post('/pomodoro', logPomodoroSession);

module.exports = router;
