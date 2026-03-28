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

  @override
  void initState() {
    super.initState();
    _fetchQuizData();
  }

  Future<void> _fetchQuizData() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final data = await _apiService.fetchQuizData(widget.subjectId);
      setState(() {
        _quizData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading quiz data: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _nextQuestion() {
    if (_quizData == null) return;

    final List<Question> questions = _quizData!.questions;
    if (currentIndex < questions.length - 1) {
      setState(() {
        currentIndex++;
        selectedIndex = null;
        isAnswered = false;
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

  void _resetQuiz() {
    setState(() {
      currentIndex = 0;
      score = 0;
      selectedIndex = null;
      isAnswered = false;
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

                  ...List.generate(
                    currentQuestion.options.length,
                    (index) => _buildOptionTile(index, currentQuestion),
                  ),

                  const SizedBox(height: 30),

                  if (isAnswered)
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
              ),
            ),
          ),
        ],
      ),
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
                if (isCorrect) score++;
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
