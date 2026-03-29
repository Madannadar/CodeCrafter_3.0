import 'package:flutter/material.dart';
import 'package:codecrafter/api_service.dart';
import 'package:codecrafter/graph.dart';
import 'package:codecrafter/quiz.dart';
import 'package:codecrafter/models.dart';

class ChatView extends StatefulWidget {
  final String? initialSubject;
  const ChatView({super.key, this.initialSubject});

  @override
  State<ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends State<ChatView> {
  final ApiService _apiService = ApiService();
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  // Session State tracking
  String? _currentSubject;
  String? _currentStep;
  Map<String, dynamic>? _lastPrerequisiteData;

  @override
  void initState() {
    super.initState();
    debugPrint('[ChatView] Initializing with subject: ${widget.initialSubject}');
    _currentSubject = widget.initialSubject;
    _addSystemMessage("Hello! I'm your Learning Assistant. What would you like to learn today?");
  }

  void _addSystemMessage(String text) {
    debugPrint('[ChatView] Adding system message: $text');
    setState(() {
      _messages.add({"role": "assistant", "content": text});
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage({String? overrideMessage}) async {
    final userMessage = overrideMessage ?? _controller.text;
    if (userMessage.trim().isEmpty) return;

    debugPrint('[ChatView] _sendMessage: $userMessage');
    setState(() {
      if (overrideMessage == null) {
        _messages.add({"role": "user", "content": userMessage});
        _controller.clear();
      }
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      debugPrint('[ChatView] Requesting AI response for subject: $_currentSubject');
      final response = await _apiService.chat(
        message: userMessage, 
        subject: _currentSubject,
        step: _currentStep,
        prerequisiteData: _lastPrerequisiteData,
      );
      
      debugPrint('[ChatView] AI Response received: $response');
      _currentSubject = response['subject'] ?? _currentSubject;
      _currentStep = response['step'];
      if (response['prerequisite_data'] != null) {
        debugPrint('[ChatView] Prerequisite data found in response');
        _lastPrerequisiteData = response['prerequisite_data'];
      }

      String botResponse = response['response'] ?? "I'm not sure how to respond to that.";
      
      setState(() {
        _messages.add({
          "role": "assistant", 
          "content": botResponse,
          "data": response 
        });
        _isLoading = false;
      });

      // AUTO-NAVIGATION: If the AI generated a quiz, open it immediately
      if (response['quiz_data'] != null && mounted) {
        debugPrint('[ChatView] Quiz data detected, auto-launching SubjectQuiz');
        final quizData = QuizData.fromJson(response['quiz_data']);
        Navigator.push(context, MaterialPageRoute(builder: (context) => SubjectQuiz(
          subjectId: _currentSubject ?? 'gen', 
          subjectName: _currentSubject ?? 'General', 
          initialQuizData: quizData,
          onComplete: () => _addSystemMessage("Great job! Ready for more?"),
        )));
      }

    } catch (e) {
      debugPrint('[ChatView] Error in _sendMessage: $e');
      setState(() {
        _messages.add({"role": "assistant", "content": "Sorry, I'm having trouble connecting. Please try again."});
        _isLoading = false;
      });
    }
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text("CodeCrafter AI"),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              debugPrint("[ChatView] Resetting session");
              setState(() {
                _messages.clear();
                _currentSubject = null;
                _currentStep = null;
                _lastPrerequisiteData = null;
              });
              _addSystemMessage("Session reset. What would you like to learn?");
            }, 
            icon: const Icon(Icons.refresh, color: Color(0xFF6B7280))
          )
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg["role"] == "user";
                return Column(
                  crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    _buildMessageBubble(msg, isUser, theme),
                    if (!isUser && msg["data"] != null) _buildActionButtons(msg["data"]),
                    const SizedBox(height: 16),
                  ],
                );
              },
            ),
          ),
          if (_isLoading) 
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8.0),
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
              ),
            ),
          _buildInputArea(theme),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg, bool isUser, ThemeData theme) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isUser ? const Color(0xFF8B5CF6) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4))],
        border: !isUser ? Border.all(color: const Color(0xFFE5E7EB)) : null,
      ),
      child: Text(
        msg["content"]!,
        style: TextStyle(color: isUser ? Colors.white : const Color(0xFF374151), fontSize: 16),
      ),
    );
  }

  Widget _buildActionButtons(Map<String, dynamic> data) {
    List<Widget> buttons = [];
    final String? subjectName = data['subject'] ?? _currentSubject;

    // View Roadmap Button (Purple)
    if (data['prerequisite_data'] != null) {
      buttons.add(_actionButton('View Roadmap', Icons.map_outlined, const Color(0xFF8B5CF6), () {
         debugPrint('[ChatView] View Roadmap clicked for $subjectName');
         final roadmapData = SubjectData.fromJson(data['prerequisite_data']);
         Navigator.push(context, MaterialPageRoute(builder: (context) => SubjectDependencyGraph(
           subjectName: subjectName ?? "Subject",
           initialData: roadmapData,
         )));
      }));
    }

    // Test Me Button (Orange - Navigation to Quiz)
    if (subjectName != null && data['step'] != 'get_subject') {
      buttons.add(_actionButton('Test Me', Icons.quiz_outlined, Colors.orange, () {
         debugPrint('[ChatView] Test Me clicked for $subjectName');
         final quizData = data['quiz_data'] != null ? QuizData.fromJson(data['quiz_data']) : null;
         Navigator.push(context, MaterialPageRoute(builder: (context) => SubjectQuiz(
           subjectId: subjectName, 
           subjectName: subjectName, 
           initialQuizData: quizData,
           onComplete: () => _addSystemMessage("Great job! Ready for more?"),
         )));
      }));
    }

    if (buttons.isEmpty) return const SizedBox.shrink();
    return Padding(padding: const EdgeInsets.only(top: 12), child: Wrap(spacing: 8, runSpacing: 8, children: buttons));
  }

  Widget _actionButton(String label, IconData icon, Color color, VoidCallback onPressed) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: color,
        elevation: 0,
        side: BorderSide(color: color.withValues(alpha: 0.2)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildInputArea(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Colors.white),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: "Ask AI anything...",
                filled: true,
                fillColor: const Color(0xFFF3F4F6),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () {
              debugPrint('[ChatView] Send button pressed');
              _sendMessage();
            }, 
            icon: const Icon(Icons.send_rounded, color: Color(0xFF8B5CF6))
          ),
        ],
      ),
    );
  }
}
