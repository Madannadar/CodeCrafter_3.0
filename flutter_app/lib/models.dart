// Roadmap / Graph Models
class Subject {
  final String id;
  final String name;
  final String type;
  final String desc;

  Subject({
    required this.id,
    required this.name,
    required this.type,
    required this.desc,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id']?.toString() ?? json['subject'] ?? '',
      name: json['name'] ?? json['subject'] ?? 'Unknown',
      type: json['type'] ?? 'core',
      desc: json['desc'] ?? json['why'] ?? '',
    );
  }
}

class Dependency {
  final String from;
  final String to;

  Dependency({
    required this.from,
    required this.to,
  });

  factory Dependency.fromJson(Map<String, dynamic> json) {
    return Dependency(
      from: json['from']?.toString() ?? '',
      to: json['to']?.toString() ?? '',
    );
  }
}

class SubjectData {
  final List<Subject> subjects;
  final List<Dependency> dependencies;

  SubjectData({
    required this.subjects,
    required this.dependencies,
  });

  factory SubjectData.fromJson(Map<String, dynamic> json) {
    if (json.containsKey('prerequisites') && json['prerequisites'] is List) {
      List<Subject> subs = [];
      List<Dependency> deps = [];
      String mainSubject = json['subject'] ?? 'Target';
      
      var prereqs = json['prerequisites'] as List;
      for (int i = 0; i < prereqs.length; i++) {
        var p = prereqs[i];
        subs.add(Subject.fromJson(p));
        if (i > 0) {
          deps.add(Dependency(
            from: prereqs[i-1]['subject']?.toString() ?? '',
            to: p['subject']?.toString() ?? '',
          ));
        }
      }
      if (subs.isNotEmpty) {
        subs.add(Subject(id: mainSubject, name: mainSubject, type: 'target', desc: 'Main Goal'));
        deps.add(Dependency(
          from: subs[subs.length - 2].id,
          to: mainSubject,
        ));
      } else {
        subs.add(Subject(id: mainSubject, name: mainSubject, type: 'target', desc: 'Main Goal'));
      }
      return SubjectData(subjects: subs, dependencies: deps);
    }

    return SubjectData(
      subjects: (json['subjects'] as List?)?.map((i) => Subject.fromJson(i)).toList() ?? [],
      dependencies: (json['dependencies'] as List?)?.map((i) => Dependency.fromJson(i)).toList() ?? [],
    );
  }
}

// Quiz Models
enum QuestionType { mcq, text }

class Question {
  final String id;
  final String? concept;
  final String? difficulty;
  final String questionText;
  final String? code;
  final String? language;
  final List<String> options;
  final int answerIndex;
  final String correctAnswer; 
  final String? explanation;
  final QuestionType type;

  Question({
    required this.id,
    this.concept,
    this.difficulty,
    required this.questionText,
    this.code,
    this.language,
    required this.options,
    required this.answerIndex,
    required this.correctAnswer,
    this.explanation,
    required this.type,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    List<String> optionsList = [];
    int index = -1;
    String correctAns = (json['correct_answer'] ?? json['answer'] ?? '').toString();

    var rawOptions = json['options'];
    if (rawOptions is List && rawOptions.isNotEmpty) {
      optionsList = List<String>.from(rawOptions);
    } else if (rawOptions is Map && rawOptions.isNotEmpty) {
      // Handle A, B, C, D format from FastAPI
      optionsList = [
        rawOptions['A']?.toString() ?? '',
        rawOptions['B']?.toString() ?? '',
        rawOptions['C']?.toString() ?? '',
        rawOptions['D']?.toString() ?? '',
      ];
      // Filter out empty options
      optionsList = optionsList.where((o) => o.isNotEmpty).toList();
    }

    // Determine MCQ Answer Index
    if (optionsList.isNotEmpty) {
      if (correctAns.length == 1 && "ABCD".contains(correctAns.toUpperCase())) {
        index = "ABCD".indexOf(correctAns.toUpperCase());
        // Cap index to available options
        if (index >= optionsList.length) index = 0;
      } else {
        index = optionsList.indexOf(correctAns);
      }
    }

    // TYPE DETECTION: If answer is a single letter (A-D), it's always MCQ regardless of type field
    final String rawType = (json['type'] ?? '').toString().toLowerCase();
    bool isLetterAnswer = correctAns.length == 1 && "ABCD".contains(correctAns.toUpperCase());
    QuestionType type = isLetterAnswer 
        ? QuestionType.mcq 
        : (rawType == 'theory' || rawType == 'text' || optionsList.isEmpty) 
          ? QuestionType.text 
          : QuestionType.mcq;

    return Question(
      id: json['id']?.toString() ?? '',
      concept: json['concept'] ?? json['topic'],
      difficulty: json['difficulty'],
      questionText: json['question'] ?? 'No Question',
      code: json['code'],
      language: json['language'],
      options: optionsList,
      answerIndex: index,
      correctAnswer: correctAns,
      explanation: json['explanation'],
      type: type,
    );
  }
}

class QuizData {
  final String subject;
  final List<Question> questions;
  final String? level;

  QuizData({required this.subject, required this.questions, this.level});

  factory QuizData.fromJson(Map<String, dynamic> json) {
    return QuizData(
      subject: json['subject'] ?? json['section'] ?? 'Unknown Subject',
      level: json['level'],
      questions: (json['questions'] as List?)
          ?.map((i) => Question.fromJson(i))
          .toList() ?? [],
    );
  }
}
