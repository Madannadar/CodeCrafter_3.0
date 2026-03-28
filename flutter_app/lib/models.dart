import 'package:flutter/material.dart';

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
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? 'Unknown',
      type: json['type'] ?? 'core',
      desc: json['desc'] ?? '',
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
    // debugPrint('JSON Received in SubjectData: $json');
    return SubjectData(
      subjects: (json['subjects'] as List?)?.map((i) => Subject.fromJson(i)).toList() ?? [],
      dependencies: (json['dependencies'] as List?)?.map((i) => Dependency.fromJson(i)).toList() ?? [],
    );
  }
}

// Quiz Models
class Question {
  final String questionText;
  final String? code;
  final String? language;
  final List<String> options;
  final int answerIndex;

  Question({
    required this.questionText,
    this.code,
    this.language,
    required this.options,
    required this.answerIndex,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      questionText: json['question'] ?? 'No Question',
      code: json['code'],
      language: json['language'],
      options: List<String>.from(json['options'] ?? []),
      answerIndex: json['answer'] ?? 0,
    );
  }
}

class QuizData {
  final String section;
  final List<Question> questions;

  QuizData({
    required this.section,
    required this.questions,
  });

  factory QuizData.fromJson(Map<String, dynamic> json) {
    return QuizData(
      section: json['section'] ?? '',
      questions: (json['questions'] as List?)?.map((i) => Question.fromJson(i)).toList() ?? [],
    );
  }
}
