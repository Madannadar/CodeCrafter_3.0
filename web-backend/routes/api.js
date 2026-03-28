const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Subject = require('../models/Subject');
const User = require('../models/User');
const QuizHistory = require('../models/QuizHistory');

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Public
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/user/:id
// @desc    Get user data including weak subjects
// @access  Private
router.get('/user/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/history
// @desc    Save quiz history and evaluate weak_subjects
// @access  Private
router.post('/history', auth, async (req, res) => {
  try {
    const { userId, subjectId, score, totalQuestions, answers } = req.body;
    
    const history = new QuizHistory({
      userId,
      subjectId,
      score,
      totalQuestions,
      answers
    });
    
    await history.save();

    // Update weak_subjects if score is below 70% threshold
    const threshold = totalQuestions * 0.7;
    if (score < threshold) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { weak_subjects: subjectId }
      });
    } else {
      // Optional: Remove from weak subjects if they improved? 
      // User only asked to "have the id of sub from the other collection", we'll just add for now.
    }

    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/history/user/:id
// @desc    Get all historical quiz data based on user id
// @access  Private
router.get('/history/user/:id', auth, async (req, res) => {
  try {
    const histories = await QuizHistory.find({ userId: req.params.id }).sort({ timestamp: -1 });
    res.json(histories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
