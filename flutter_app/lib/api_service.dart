import 'package:dio/dio.dart';
import 'package:codecrafter/models.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio _dio = Dio();
  String? _userId;

  // Node.js Express API (Static Quiz & Auth)
  final String _expressBase = "http://web-backend.sourishkanna.me/api";

  // Python FastAPI (Dynamic Graph, Chat & Adaptive Quiz)
  final String _fastApiBase = "http://backend.sourishkanna.me";

  String? get userId => _userId;

  void setToken(String token, String? userId) {
    debugPrint('[ApiService] Setting Token: ${token.substring(0, 10)}... UserID: $userId');
    _userId = userId;
    _dio.options.headers['x-auth-token'] = token;
  }

  /// AUTH: Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    debugPrint('[ApiService] Attempting Login for: $email');
    try {
      final response = await _dio.post('$_expressBase/auth/login', data: {
        'email': email,
        'password': password,
      });
      debugPrint('[ApiService] Login Response: ${response.data}');
      if (response.data['token'] != null) {
        setToken(response.data['token'], response.data['user']['id']);
      }
      return response.data;
    } catch (e) {
      debugPrint('[ApiService] Login error: $e');
      throw Exception('Login failed: $e');
    }
  }

  /// AUTH: Register
  Future<Map<String, dynamic>> register(String name, String email, String password) async {
    debugPrint('[ApiService] Attempting Registration for: $email');
    try {
      final response = await _dio.post('$_expressBase/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
      });
      debugPrint('[ApiService] Register Response: ${response.data}');
      if (response.data['token'] != null) {
        setToken(response.data['token'], response.data['user']['id']);
      }
      return response.data;
    } catch (e) {
      debugPrint('[ApiService] Registration error: $e');
      throw Exception('Registration failed: $e');
    }
  }

  /// AUTH: Google Login
  Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    debugPrint('[ApiService] Attempting Google Login');
    try {
      final response = await _dio.post('$_expressBase/auth/google', data: {
        'token': idToken,
      });
      debugPrint('[ApiService] Google Login Response: ${response.data}');
      if (response.data['token'] != null) {
        setToken(response.data['token'], response.data['user']['id']);
      }
      return response.data;
    } catch (e) {
      debugPrint('[ApiService] Google Login error: $e');
      throw Exception('Google login failed: $e');
    }
  }

  /// NODE.JS: Fetches all available quiz subjects (for mapping)
  Future<List<Map<String, dynamic>>> fetchAllQuizSubjects() async {
    debugPrint('[ApiService] Fetching all quiz subjects from Node.js');
    try {
      final response = await _dio.get('$_expressBase/quiz/subjects');
      debugPrint('[ApiService] Fetch Subjects Response Status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final List subjects = response.data['subjects'] ?? [];
        return subjects.map((s) => s as Map<String, dynamic>).toList();
      }
      return [];
    } catch (e) {
      debugPrint('[ApiService] Error fetching all subjects: $e');
      return [];
    }
  }

  /// NODE.JS: Fetches Static Quiz Data
  Future<QuizData> fetchQuizData(String subjectId) async {
    debugPrint('[ApiService] Fetching quiz data for: $subjectId');
    try {
      final response = await _dio.get('$_expressBase/quiz/subjects/$subjectId');
      debugPrint('[ApiService] Fetch Quiz Data Response Status: ${response.statusCode}');
      if (response.statusCode == 200) {
        return QuizData.fromJson(response.data);
      } else {
        throw Exception('Failed to load quiz data');
      }
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 404) {
        debugPrint('[ApiService] Quiz data not found (404)');
        throw Exception('404');
      }
      debugPrint('[ApiService] Error (fetchQuizData): $e');
      throw Exception('Failed to connect to Node server: $e');
    }
  }

  /// NODE.JS: Save Quiz History
  Future<void> saveQuizHistory({
    required String userId,
    required String subjectId,
    required int score,
    required int totalQuestions,
    required List<Map<String, dynamic>> answers,
    String? difficulty,
  }) async {
    debugPrint('[ApiService] Saving quiz history for $userId on $subjectId (Score: $score/$totalQuestions)');
    try {
      await _dio.post('$_expressBase/history', data: {
        'userId': userId,
        'subjectId': subjectId,
        'score': score,
        'totalQuestions': totalQuestions,
        'answers': answers,
        'difficulty': difficulty,
      });
      debugPrint('[ApiService] Save History request completed');
    } catch (e) {
      debugPrint('[ApiService] Error saving history: $e');
    }
  }

  /// FASTAPI: Fetches Prerequisite Graph
  Future<SubjectData> fetchSubjectData(String subject) async {
    debugPrint('[ApiService] Fetching prerequisite graph for: $subject');
    try {
      final response = await _dio.post(
        '$_fastApiBase/json',
        data: {'subject': subject},
      );
      debugPrint('[ApiService] Fetch Graph Response Status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final graphData = response.data['prerequisite_data'];
        return SubjectData.fromJson(graphData ?? response.data);
      }
      throw Exception('Failed to load graph');
    } catch (e) {
      debugPrint('[ApiService] Error (fetchSubjectData): $e');
      throw Exception('Failed to connect to FastAPI: $e');
    }
  }

  /// FASTAPI: Chat Agent (Returns intents, next steps, or quiz/graph data)
  Future<dynamic> chat({
    String? message,
    String? subject,
    String? step,
    String? intent,
    String? level,
    Map<String, dynamic>? prerequisiteData,
  }) async {
    debugPrint('[ApiService] Chat Request: msg=$message, subj=$subject, step=$step, intent=$intent, level=$level');
    try {
      final response = await _dio.post(
        '$_fastApiBase/chat',
        data: {
          'message': message,
          'subject': subject,
          'step': step,
          'intent': intent,
          'level': level,
          'prerequisite_data': prerequisiteData,
        },
      );
      debugPrint('[ApiService] Chat Response Status: ${response.statusCode}');
      return response.data;
    } catch (e) {
      debugPrint('[ApiService] Error (chat): $e');
      throw Exception('Chat connection failed: $e');
    }
  }

  /// FASTAPI: Evaluate Quiz (Adaptive Learning)
  Future<Map<String, dynamic>> evaluateQuiz({
    required Map<String, dynamic> quizData,
    required Map<String, String?> answers,
    List<Map<String, dynamic>>? failedQuestions,
    Map<String, dynamic>? prerequisiteData,
    String? targetSubject,
    int? currentPrereqIndex,
    bool? remediationMode,
  }) async {
    debugPrint('[ApiService] Evaluating Quiz for: ${quizData['subject']}');
    try {
      final response = await _dio.post(
        '$_fastApiBase/evaluate-quiz',
        data: {
          'quiz_data': quizData,
          'answers': answers,
          'failed_questions': failedQuestions,
          'prerequisite_data': prerequisiteData,
          'target_subject': targetSubject,
          'current_prereq_index': currentPrereqIndex,
          'remediation_mode': remediationMode,
        },
      );
      debugPrint('[ApiService] Evaluation Response Status: ${response.statusCode}');
      return response.data;
    } catch (e) {
      debugPrint('[ApiService] Evaluation error: $e');
      throw Exception('Failed to evaluate quiz');
    }
  }
}
