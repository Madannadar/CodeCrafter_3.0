import 'package:flutter/material.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/shades-of-purple.dart';

class SubjectQuizManual extends StatefulWidget {
  final String subjectId;
  final String subjectName;
  final VoidCallback onComplete;

  const SubjectQuizManual({
    super.key,
    required this.subjectId,
    required this.subjectName,
    required this.onComplete,
  });

  @override
  State<SubjectQuizManual> createState() => _SubjectQuizManualState();
}

class _SubjectQuizManualState extends State<SubjectQuizManual> {
  // Your full 10-question structured response
  final Map<String, dynamic> apiResponse = {
    "section": "Computer Engineering Core",
    "questions": [
      {
        "question":
            "What is the time complexity of a Bubble Sort in the worst case?",
        "code":
            "void sort(int arr[], int n) {\n  for(int i=0; i<n; i++)\n    for(int j=0; j<n-i-1; j++)\n      if(arr[j] > arr[j+1]) swap(arr[j], arr[j+1]);\n}",
        "options": ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
        "answer": 2,
        "language": "C++",
      },
      {
        "question":
        "What is the output of following code:",
        "code":
        "st = str(False+True)\nprint(st*3)",
        "options": ["Error", "111", "000", "3"],
        "answer": 1,
        "language": "Python"
      },
      {
        "question":
            "Which of the following is used to manage dynamic memory in C++?",
        "code": "int* ptr = new int(10);\ndelete ptr;",
        "options": ["malloc", "new", "alloc", "set"],
        "answer": 1,
        "language": "C++",
      },
      {
        "question": "What does a 404 HTTP status code signify?",
        "code": null,
        "options": [
          "Success",
          "Internal Server Error",
          "Not Found",
          "Forbidden",
        ],
        "answer": 2,
      },
    ],
  };

  int currentIndex = 0;
  int? selectedIndex;
  bool isAnswered = false;
  int score = 0;

  void _nextQuestion() {
    final List questions = apiResponse['questions'];
    if (currentIndex < questions.length - 1) {
      setState(() {
        currentIndex++;
        selectedIndex = null;
        isAnswered = false;
      });
    } else {
      // Threshold: 50% to pass
      bool passed = score >= (questions.length / 2);

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
    final List questions = apiResponse['questions'];
    final theme = Theme.of(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(passed ? "Quiz Passed! 🎉" : "Quiz Failed ❌"),
        content: Text(
          passed
              ? "Great job! You scored $score out of ${questions.length}. This subject is now marked as completed."
              : "You scored $score out of ${questions.length}. You need at least ${(questions.length / 2).ceil()} correct to complete this subject.",
        ),
        actions: [
          // Always allow returning to the roadmap
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // Close Dialog
              Navigator.pop(context); // Return to Roadmap
            },
            child: const Text("Return to Roadmap"),
          ),
          // Only show Retry if they failed (or always show it if you want to allow score improvement)
          if (!passed)
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx); // Close Dialog
                _resetQuiz(); // Reset local state
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
    final List questions = apiResponse['questions'];
    final currentData = questions[currentIndex];
    final theme = Theme.of(context);

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
          // Polished Progress Header from Version 2
          _buildProgressHeader(currentIndex + 1, questions.length),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    currentData['question'],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Dracula Code Theme
                  if (currentData['code'] != null)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: HighlightView(
                        currentData['code'],
                        language: currentData['language'],
                        theme: shadesOfPurpleTheme,
                        padding: const EdgeInsets.all(16),
                        textStyle: const TextStyle(
                          fontFamily: 'monospace',
                          fontSize: 14,
                        ),
                      ),
                    ),

                  const SizedBox(height: 25),

                  // Option Tiles with Circle Avatars
                  ...List.generate(
                    currentData['options'].length,
                    (index) => _buildOptionTile(index, currentData),
                  ),

                  const SizedBox(height: 30),

                  // Next Button
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

  Widget _buildOptionTile(int index, Map<String, dynamic> data) {
    bool isCorrect = index == data['answer'];
    bool isSelected = index == selectedIndex;
    final theme = Theme.of(context);

    Color color = theme.colorScheme.surface;
    if (isAnswered) {
      if (isCorrect) {
        color = Colors.green.shade50;
      } else if (isSelected) {
        color = Colors.red.shade50;
      }
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
                String.fromCharCode(65 + index), // A, B, C...
                style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Text(
                data['options'][index],
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
