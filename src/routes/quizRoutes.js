const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

router.post('/submit', authMiddleware, quizController.submitQuiz);

module.exports = router;
