import 'package:dio/dio.dart';
import 'package:codecrafter/models.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  final Dio _dio = Dio();
  final String _baseUrl = "http://10.0.2.2:8000";

  // Fetches SubjectData for the graph using POST /json as per spec
  Future<SubjectData> fetchSubjectData(String subject) async {
    try {
      final response = await _dio.post(
        '$_baseUrl/json',
        data: {'subject': subject},
      );
      if (response.statusCode == 200) {
        debugPrint('API Response (fetchSubjectData): ${response.data}');
        
        // The API wraps the graph in a 'prerequisite_data' field
        final graphData = response.data['prerequisite_data'];
        if (graphData != null) {
          return SubjectData.fromJson(graphData);
        } else {
          // Fallback in case 'prerequisite_data' is missing but structure matches top level
          return SubjectData.fromJson(response.data);
        }
      } else {
        debugPrint('API Error (fetchSubjectData): Status Code ${response.statusCode}');
        throw Exception('Failed to load subject data');
      }
    } catch (e) {
      debugPrint('Connection Error (fetchSubjectData): $e');
      throw Exception('Failed to connect to API: $e');
    }
  }

  // POST /chat as per spec
  Future<dynamic> chat(String? message, String? subject) async {
    try {
      final response = await _dio.post(
        '$_baseUrl/chat',
        data: {
          'message': message,
          'subject': subject,
        },
      );
      if (response.statusCode == 200) {
        return response.data;
      } else {
        debugPrint('API Error (chat): Status Code ${response.statusCode}');
        throw Exception('Failed to chat');
      }
    } catch (e) {
      debugPrint('Connection Error (chat): $e');
      throw Exception('Failed to connect to API: $e');
    }
  }

  // Fetches QuizData for a specific subject
  Future<QuizData> fetchQuizData(String subjectId) async {
    try {
      final response = await _dio.get('$_baseUrl/quiz/$subjectId');
      if (response.statusCode == 200) {
        return QuizData.fromJson(response.data);
      } else {
        debugPrint('API Error (fetchQuizData): Status Code ${response.statusCode} for subject $subjectId');
        throw Exception('Failed to load quiz data for $subjectId');
      }
    } catch (e) {
      debugPrint('Connection Error (fetchQuizData): $e');
      throw Exception('Failed to connect to API: $e');
    }
  }
}
