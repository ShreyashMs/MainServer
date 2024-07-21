const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.post('/add', questionController.createQuestion);
router.get('/all', questionController.getQuestions);
router.put('/:questionId', questionController.updateQuestion);
router.delete('/:questionId', questionController.deleteQuestion);

module.exports = router;
