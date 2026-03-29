const mongoose = require('mongoose');

const quizHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subjectId: {
    type: String,
    ref: 'Subject',
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  answers: [
    {
      questionId: { type: String, required: true },
      selectedAnswer: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  // 'regular' = normal quiz, 'sem_diagnostic' = semester weak-subject finder
  quizType: {
    type: String,
    enum: ['regular', 'sem_diagnostic'],
    default: 'regular',
  },
  // Only set for sem_diagnostic entries
  semId: {
    type: String,
    default: null,
  },
  // Difficulty level chosen by the user (only for regular quizzes)
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', null],
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QuizHistory', quizHistorySchema);
