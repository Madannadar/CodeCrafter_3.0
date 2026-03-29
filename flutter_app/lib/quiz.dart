import 'package:flutter/material.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/shades-of-purple.dart';
import 'package:codecrafter/api_service.dart';
import 'package:codecrafter/models.dart';

class SubjectQuiz extends StatefulWidget {
  final String subjectId;
  final String subjectName;
  final VoidCallback onComplete;

  const SubjectQuiz({
    super.key,
    required this.subjectId,
    required this.subjectName,
    required this.onComplete,
  });

  @override
  State<SubjectQuiz> createState() => _SubjectQuizState();
}

class _SubjectQuizState extends State<SubjectQuiz> {
  final ApiService _apiService = ApiService();
  QuizData? _quizData;
  bool _isLoading = true;

  int currentIndex = 0;
  int? selectedIndex;
  bool isAnswered = false;
  int score = 0;

  final TextEditingController _textController = TextEditingController();
  String? _textFeedback;

  @override
  void initState() {
    super.initState();
    _fetchQuizData();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _fetchQuizData() async {
    setState(() {
      _isLoading = true;
    });

    // Mock API response from the provided JSON
    final mockJsonResponse = {
      "subject": "Physics",
      "topic": "Dual Nature of Radiation and Matter",
      "questions": [
        {
          "id": "PHY_DUAL_1",
          "concept": "Photoelectric Effect",
          "difficulty": "Easy",
          "type": "MCQ",
          "question": "Who explained the photoelectric effect using quantum theory?",
          "options": ["Isaac Newton", "Albert Einstein", "Max Planck", "Niels Bohr"],
          "answer": "Albert Einstein",
          "explanation": "Einstein explained the photoelectric effect by proposing that light consists of photons."
        },
        {
          "id": "PHY_DUAL_2",
          "concept": "Photoelectric Effect",
          "difficulty": "Easy",
          "type": "Short Answer",
          "question": "Define photoelectric effect.",
          "answer": "Emission of electrons from a metal surface when light of sufficient frequency falls on it.",
          "explanation": "When photons strike a metal surface, electrons are emitted."
        },
        {
          "id": "PHY_DUAL_6",
          "concept": "Photoelectric Effect",
          "difficulty": "Medium",
          "type": "TrueFalse",
          "question": "Increasing light intensity increases the kinetic energy of emitted electrons.",
          "answer": "False",
          "explanation": "Kinetic energy depends on frequency, not intensity."
        },
        {
          "id": "PHY_DUAL_4",
          "concept": "Photoelectric Equation",
          "difficulty": "Medium",
          "type": "Numeric",
          "question": "Write Einstein's photoelectric equation.",
          "answer": "hv = phi + KE_max",
          "explanation": "Energy of incident photon equals work function plus maximum kinetic energy."
        }
      ]
    };

    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));

    setState(() {
      _quizData = QuizData.fromJson(mockJsonResponse);
      _isLoading = false;
    });
  }

  void _nextQuestion() {
    if (_quizData == null) return;

    final List<Question> questions = _quizData!.questions;
    if (currentIndex < questions.length - 1) {
      setState(() {
        currentIndex++;
        selectedIndex = null;
        isAnswered = false;
        _textController.clear();
        _textFeedback = null;
      });
    } else {
      final threshold = (_quizData!.questions.length * 0.7).ceil();
      bool passed = score >= threshold;

      if (passed) {
        widget.onComplete();
      }

      _showResults(passed);
    }
  }

  void _submitTextAnswer(Question question) {
    if (_textController.text.trim().isEmpty) return;

    final userAnswer = _textController.text.trim().toLowerCase();
    final correctAnswer = (question.correctAnswer ?? '').trim().toLowerCase();
    
    setState(() {
      isAnswered = true;
      // Note: In real scenarios, fuzzy matching or LLM grading would be used here.
      // For this prototype, we'll do a simple contains check to be more forgiving.
      if (userAnswer.contains(correctAnswer) || correctAnswer.contains(userAnswer)) {
        score++;
        _textFeedback = "Correct!";
      } else {
        _textFeedback = "Incorrect. Expected: ${question.correctAnswer}";
      }
    });
  }

  void _resetQuiz() {
    setState(() {
      currentIndex = 0;
      score = 0;
      selectedIndex = null;
      isAnswered = false;
      _textController.clear();
      _textFeedback = null;
    });
  }

  void _showResults(bool passed) {
    if (_quizData == null) return;

    final List<Question> questions = _quizData!.questions;
    final threshold = (_quizData!.questions.length * 0.7).ceil();
    final theme = Theme.of(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(passed ? "Quiz Passed! 🎉" : "Quiz Failed ❌"),
        content: Text(
          passed
              ? "Great job! You scored $score out of ${questions.length}. This subject is now marked as completed."
              : "You scored $score out of ${questions.length}. You need at least $threshold questions correct to complete this subject.",
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text("Return to Roadmap"),
          ),
          if (!passed)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _resetQuiz();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                foregroundColor: theme.colorScheme.onPrimary,
              ),
              child: const Text("Try Again"),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading || _quizData == null) {
      return Scaffold(
        appBar: AppBar(
          title: Text(widget.subjectName),
          backgroundColor: theme.colorScheme.surface,
          foregroundColor: theme.colorScheme.onSurface,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final List<Question> questions = _quizData!.questions;
    final currentQuestion = questions[currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.subjectName),
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      backgroundColor: theme.colorScheme.surfaceContainer,
      body: Column(
        children: [
          _buildProgressHeader(currentIndex + 1, questions.length),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Concept Badge
                  if (currentQuestion.concept != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        currentQuestion.concept!,
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.onPrimaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  
                  Text(
                    currentQuestion.questionText,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),

                  if (currentQuestion.code != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: HighlightView(
                        currentQuestion.code!,
                        language: currentQuestion.language,
                        theme: shadesOfPurpleTheme,
                        padding: const EdgeInsets.all(16),
                        textStyle: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 14,
                        ),
                      ),
                    ),

                  const SizedBox(height: 25),

                  if (currentQuestion.type == QuestionType.text)
                    _buildTextInputField(currentQuestion)
                  else
                    ...List.generate(
                      currentQuestion.options.length,
                      (index) => _buildOptionTile(index, currentQuestion),
                    ),

                  const SizedBox(height: 30),

                  if (isAnswered) ...[
                    // Explanation Section
                    if (currentQuestion.explanation != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondaryContainer.withOpacity(0.4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: theme.colorScheme.secondary.withOpacity(0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Explanation",
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Text(currentQuestion.explanation!),
                          ],
                        ),
                      ),

                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        onPressed: _nextQuestion,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          currentIndex == questions.length - 1
                              ? "Finish Quiz"
                              : "Next Question",
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextInputField(Question question) {
    final theme = Theme.of(context);
    final isCorrect = _textFeedback?.startsWith("Correct") ?? false;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _textController,
          enabled: !isAnswered,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: "Type your answer here...",
            filled: true,
            fillColor: theme.colorScheme.surface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        if (!isAnswered) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: () => _submitTextAnswer(question),
              child: const Text("Submit Answer"),
            ),
          ),
        ],
        if (isAnswered && _textFeedback != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            width: double.infinity,
            decoration: BoxDecoration(
              color: isCorrect ? Colors.green.shade50 : Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isCorrect ? Colors.green : Colors.red),
            ),
            child: Text(
              _textFeedback!,
              style: TextStyle(
                color: isCorrect ? Colors.green.shade900 : Colors.red.shade900,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildProgressHeader(int cur, int tot) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      color: theme.colorScheme.surface,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Question $cur of $tot",
                style: TextStyle(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text("${((cur / tot) * 100).toInt()}%"),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: cur / tot,
            backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1),
            valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.primary),
            borderRadius: BorderRadius.circular(10),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionTile(int index, Question question) {
    bool isCorrect = index == question.answerIndex;
    bool isSelected = index == selectedIndex;
    final theme = Theme.of(context);

    Color color = theme.colorScheme.surface;
    if (isAnswered) {
      color = isCorrect ? Colors.green.shade50 : isSelected ? Colors.red.shade50 : theme.colorScheme.surface;
    }

    return GestureDetector(
      onTap: isAnswered
          ? null
          : () {
              setState(() {
                selectedIndex = index;
                isAnswered = true;
                if (question.isMultipleChoice && isCorrect) score++;
              });
            },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isAnswered && isCorrect
                ? Colors.green
                : (isSelected ? Colors.red : theme.colorScheme.outlineVariant),
            width: 2,
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: isAnswered && isCorrect
                  ? Colors.green
                  : theme.colorScheme.surfaceContainerHighest,
              child: Text(
                String.fromCharCode(65 + index),
                style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Text(
                question.options[index],
                style: const TextStyle(fontSize: 15),
              ),
            ),
            if (isAnswered && isCorrect)
              const Icon(Icons.check_circle, color: Colors.green),
          ],
        ),
      ),
    );
  }
}
