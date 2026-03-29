const mongoose = require('mongoose');

/**
 * SemDiagnostic — stores ONE document per semester diagnostic session.
 * Contains all subject results for that session in a single nested array.
 */
const semDiagnosticSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  semId: {
    type: String,
    required: true,
    enum: ['sem1', 'sem2', 'sem3', 'sem4'],
  },
  // One entry per subject that was tested
  subjectResults: [
    {
      subjectId: { type: String, required: true },
      subjectName: { type: String, required: true },
      shortName: { type: String },
      score: { type: Number, required: true },
      totalQuestions: { type: Number, required: true },
      // rating label stored for quick display
      rating: {
        type: String,
        enum: ['Perfect', 'Good', 'Needs Work', 'Focus More', 'Weak Subject', 'No Data'],
        required: true,
      },
      answers: [
        {
          questionId: { type: String },
          selectedAnswer: { type: String },
          isCorrect: { type: Boolean },
        },
      ],
    },
  ],
  // Aggregate stats
  totalSubjects: { type: Number, required: true },
  weakSubjectIds: [{ type: String }], // subjects with score < 50%
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SemDiagnostic', semDiagnosticSchema);
