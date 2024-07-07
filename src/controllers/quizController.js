const QuizResponse = require('../models/QuizResponse');
const { errorHandler } = require('../utils/errorHandler');

exports.submitQuiz = async (req, res) => {
    try {
        const { responses } = req.body;

        const quizResponse = new QuizResponse({
            user_id: req.user.id,
            responses
        });

        await quizResponse.save();

        res.status(200).json({ message: 'Quiz responses submitted successfully.' });
    } catch (error) {
        errorHandler(res, error);
    }
};
