const mongoose = require('mongoose');
require('dotenv').config();
const QuizHistory = require('./models/QuizHistory');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        console.log("Connected to DB");
        const dummyUserId = new mongoose.Types.ObjectId();
        const history = new QuizHistory({
          userId: dummyUserId,
          subjectId: 'math1',
          score: 5,
          totalQuestions: 10,
          answers: [
            { questionId: 'MATH_Q1', selectedAnswer: 'Option A', isCorrect: false },
            { questionId: 'MATH_Q2', selectedAnswer: '', isCorrect: false } // Testing empty string
          ]
        });
        
        await history.save();
        console.log("Save OK!");
    } catch(err) {
        console.error("Save ERROR:", err.message);
    }
    process.exit(0);
}).catch(err => {
    console.error("DB conn err:", err);
    process.exit(1);
});
