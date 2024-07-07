const mongoose = require('mongoose');

const quizResponseSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    responses: { type: Map, of: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResponse', quizResponseSchema);
