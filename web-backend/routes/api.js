const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const User = require('../models/User');
const QuizHistory = require('../models/QuizHistory');
const SemDiagnostic = require('../models/SemDiagnostic');

// ─── Rating helper ────────────────────────────────────────────────────────────
function getRating(score, total) {
  if (total === 0) return 'No Data';
  const pct = score / total;
  if (pct === 1) return 'Perfect';
  if (pct >= 0.75) return 'Good';
  if (pct >= 0.5) return 'Needs Work';
  if (pct > 0) return 'Focus More';
  return 'Weak Subject';
}

// ─── GET /api/subjects ────────────────────────────────────────────────────────
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── GET /api/user/:id ────────────────────────────────────────────────────────
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
    res.status(500).send('Server Error');
  }
});

// ─── POST /api/history ────────────────────────────────────────────────────────
// Save a single regular quiz result
router.post('/history', auth, async (req, res) => {
  try {
    const { userId, subjectId, score, totalQuestions, answers, difficulty, attemptChain } = req.body;

    const history = new QuizHistory({
      userId,
      subjectId,
      score,
      totalQuestions,
      answers,
      quizType: 'regular',
      difficulty: difficulty || null,
      attemptChain: attemptChain || [],
    });

    await history.save();

    const threshold = totalQuestions * 0.7;
    if (score < threshold) {
      await User.findByIdAndUpdate(userId, { $addToSet: { weak_subjects: subjectId } });
    } else {
      await User.findByIdAndUpdate(userId, { $pull: { weak_subjects: subjectId } });
    }

    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── GET /api/history/user/:id ────────────────────────────────────────────────
// Get all regular quiz history for a user (excludes sem_diagnostic)
router.get('/history/user/:id', auth, async (req, res) => {
  try {
    const histories = await QuizHistory.find({
      userId: req.params.id,
      quizType: 'regular',
    }).sort({ timestamp: -1 });
    res.json(histories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── POST /api/sem-diagnostic ─────────────────────────────────────────────────
// Save ONE SemDiagnostic document for the entire session.
// Body: { userId, semId, results: [{ subjectId, subjectName, shortName, score, totalQuestions, answers[] }] }
router.post('/sem-diagnostic', auth, async (req, res) => {
  try {
    const { userId, semId, results } = req.body;

    if (!userId || !semId || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ msg: 'userId, semId, and results[] are required' });
    }

    const weakSubjectIds = [];

    const subjectResults = results.map((r) => {
      const rating = getRating(r.score, r.totalQuestions);
      if (r.score < r.totalQuestions * 0.5) {
        weakSubjectIds.push(r.subjectId);
      }
      return {
        subjectId: r.subjectId,
        subjectName: r.subjectName || r.subjectId,
        shortName: r.shortName || r.subjectId,
        score: r.score,
        totalQuestions: r.totalQuestions,
        rating,
        answers: r.answers || [],
      };
    });

    const diagnostic = new SemDiagnostic({
      userId,
      semId,
      subjectResults,
      totalSubjects: subjectResults.length,
      weakSubjectIds,
    });

    await diagnostic.save();

    // Update weak_subjects on the user
    for (const r of results) {
      if (r.score < r.totalQuestions * 0.5) {
        await User.findByIdAndUpdate(userId, { $addToSet: { weak_subjects: r.subjectId } });
      } else {
        await User.findByIdAndUpdate(userId, { $pull: { weak_subjects: r.subjectId } });
      }
    }

    res.json({ saved: true, diagnosticId: diagnostic._id, semId, weakCount: weakSubjectIds.length });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ─── GET /api/sem-diagnostic/user/:id ────────────────────────────────────────
// Get all sem diagnostic sessions for a user (one doc per session)
router.get('/sem-diagnostic/user/:id', auth, async (req, res) => {
  try {
    const diagnostics = await SemDiagnostic.find({ userId: req.params.id }).sort({ timestamp: -1 });
    res.json(diagnostics);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
