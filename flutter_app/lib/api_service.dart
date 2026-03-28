import 'package:dio/dio.dart';
import 'package:codecrafter/models.dart';

class ApiService {
  final Dio _dio = Dio();
  final String _baseUrl = "http://localhost:8000"; // Replace with your FastAPI backend URL

  // Fetches SubjectData for the graph
  Future<SubjectData> fetchSubjectData() async {
    try {
      final response = await _dio.get('$_baseUrl/roadmap');
      if (response.statusCode == 200) {
        return SubjectData.fromJson(response.data);
      } else {
        throw Exception('Failed to load subject data');
      }
    } catch (e) {
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
        throw Exception('Failed to load quiz data for $subjectId');
      }
    } catch (e) {
      throw Exception('Failed to connect to API: $e');
    }
  }
}