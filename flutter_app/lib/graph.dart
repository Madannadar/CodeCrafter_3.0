import 'package:flutter/material.dart';
import 'package:graphview/graphview.dart';
import 'package:codecrafter/quiz.dart';
import 'package:codecrafter/api_service.dart';
import 'package:codecrafter/models.dart';

class SubjectDependencyGraph extends StatefulWidget {
  const SubjectDependencyGraph({super.key});

  @override
  State<SubjectDependencyGraph> createState() => _SubjectDependencyGraphState();
}

class _SubjectDependencyGraphState extends State<SubjectDependencyGraph> {
  final TransformationController _transformationController =
      TransformationController();
  
  final ApiService _apiService = ApiService();
  SubjectData? _subjectData;

  Graph? graph;
  SugiyamaAlgorithm? algorithm;
  bool isReady = false;
  Set<String> completedIds = {};

  @override
  void initState() {
    super.initState();
    _fetchGraphData();
    WidgetsBinding.instance.addPostFrameCallback((_) => _resetView());
  }

  Future<void> _fetchGraphData() async {
    try {
      final data = await _apiService.fetchSubjectData();
      setState(() {
        _subjectData = data;
        _setupGraph();
        isReady = true;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading graph data: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _setupGraph() {
    if (_subjectData == null) return;

    final newGraph = Graph();
    final Map<String, Node> nodeMap = {};

    for (var subject in _subjectData!.subjects) {
      var node = Node.Id(subject.id);
      nodeMap[subject.id] = node;
    }

    for (var dep in _subjectData!.dependencies) {
      newGraph.addEdge(nodeMap[dep.from]!, nodeMap[dep.to]!);
    }

    final config = SugiyamaConfiguration()
      ..nodeSeparation = 80
      ..levelSeparation = 100
      ..orientation = SugiyamaConfiguration.ORIENTATION_TOP_BOTTOM;

    setState(() {
      graph = newGraph;
      algorithm = SugiyamaAlgorithm(config);
    });
  }

  void _resetView() {
    _transformationController.value = Matrix4.identity();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Learning Roadmap"),
        actions: [
          IconButton(
            onPressed: _resetView,
            icon: const Icon(Icons.center_focus_strong),
          )
        ],
        backgroundColor: theme.colorScheme.surface,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _resetView,
        backgroundColor: theme.colorScheme.primary,
        child: Icon(Icons.fullscreen_exit, color: theme.colorScheme.onPrimary),
      ),
      body: !isReady || _subjectData == null
          ? const Center(child: CircularProgressIndicator())
          : InteractiveViewer(
        transformationController: _transformationController,
        constrained: false,
        boundaryMargin: const EdgeInsets.all(500),
        minScale: 0.05,
        maxScale: 2.0,
        child: Padding(
          padding: const EdgeInsets.all(100.0),
          child: GraphView(
            graph: graph!,
            algorithm: algorithm!,
            paint: Paint()
              ..color = theme.colorScheme.primary
              ..strokeWidth = 2.0
              ..style = PaintingStyle.stroke,
            builder: (Node node) {
              var id = node.key!.value as String;
              var subject = _subjectData!.subjects.firstWhere(
                    (s) => s.id == id,
              );
              return GestureDetector(
                onTap: () => _showDetails(subject),
                child: _buildNodeBox(subject),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showDetails(Subject subject) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            final theme = Theme.of(context);
            return Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 50,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                      children: [
                        Text(
                          subject.name,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Chip(
                            label: Text(
                              subject.type.toUpperCase(),
                              style: TextStyle(
                                color: theme.colorScheme.onPrimaryContainer,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            backgroundColor: theme.colorScheme.primaryContainer,
                            side: BorderSide.none,
                            shape: const StadiumBorder(),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          "Overview",
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          subject.desc,
                          style: const TextStyle(fontSize: 16, height: 1.5),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => SubjectQuiz(
                                subjectId: subject.id,
                                subjectName: subject.name,
                                onComplete: () => setState(
                                  () => completedIds.add(subject.id),
                                ),
                              ),
                            ),
                          );
                        },
                        child: const Text(
                          "Start Quiz",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildNodeBox(Subject subject) {
    bool isDone = completedIds.contains(subject.id);
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDone ? Colors.green[50] : theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDone ? Colors.green : theme.colorScheme.primary,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            subject.name,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          if (isDone) ...[
            const SizedBox(width: 8),
            const Icon(Icons.check_circle, color: Colors.green, size: 18),
          ],
        ],
      ),
    );
  }
}
