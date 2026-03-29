const express = require('express');
const router = express.Router();
const { buildSubjects, getSubjectById, SUBJECT_DEFINITIONS } = require('../quiz/loadQuizData');
const { readQuestionsForSubject } = require('../quiz/loadQuizData');

// ─── GET /quiz/subjects ───────────────────────────────────────────────────────
// Full catalog for the web app (all subjects + questions)
router.get('/subjects', (req, res) => {
  try {
    const subjects = buildSubjects();
    res.json({ subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to load quiz data' });
  }
});

// ─── GET /quiz/subjects/:subjectId ────────────────────────────────────────────
// Single subject — matches legacy /quiz/:id shape for mobile clients
router.get('/subjects/:subjectId', (req, res) => {
  try {
    const subject = getSubjectById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ msg: 'Subject not found' });
    }
    res.json({
      section: subject.name,
      subjectId: subject.id,
      questions: subject.questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to load quiz data' });
  }
});

// ─── GET /quiz/sem/:semId/diagnostic ─────────────────────────────────────────
// Returns 4 random questions per subject in the given semester.
// Subjects with no data are returned with available: false, questions: []
router.get('/sem/:semId/diagnostic', (req, res) => {
  try {
    const { semId } = req.params;

    const validSems = ['sem1', 'sem2', 'sem3', 'sem4'];
    if (!validSems.includes(semId)) {
      return res.status(400).json({ msg: 'Invalid semesterId. Use sem1–sem4.' });
    }

    const semDefs = SUBJECT_DEFINITIONS.filter(
      (d) => d.semesterId === semId
    );

    if (semDefs.length === 0) {
      return res.status(404).json({ msg: 'No subjects found for this semester' });
    }

    const subjects = semDefs.map((def) => {
      const allQuestions = readQuestionsForSubject(def.file);
      const available = allQuestions.length > 0;

      // Pick 4 random questions
      const picked = available
        ? [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 4)
        : [];

      const { file, ...meta } = def;
      return {
        ...meta,
        available,
        questions: picked,
      };
    });

    res.json({ semId, subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to load diagnostic data' });
  }
});

module.exports = router;
