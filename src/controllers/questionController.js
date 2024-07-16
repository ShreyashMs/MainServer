const Question = require('../models/Question');

exports.createQuestion = async (req, res) => {
    try {
      const { questionText, questionType, options } = req.body;
  
      const newQuestion = new Question({
        questionText,
        questionType,
        options
      });
  
      await newQuestion.save();
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { questionText, options, questionType } = req.body;

  try {
    const question = await Question.findByIdAndUpdate(
      questionId,
      { questionText, options, questionType },
      { new: true }
    );
    res.status(200).json(question);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteQuestion = async (req, res) => {
  const { questionId } = req.params;

  try {
    await Question.findByIdAndDelete(questionId);
    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
