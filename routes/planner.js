const express = require('express');
const { generatePlan, getPlan, toggleSession } = require('../controllers/plannerController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/generate', generatePlan);
router.get('/', getPlan);
router.post('/toggle-session/:id', toggleSession);

module.exports = router;
