import 'package:flutter/material.dart';
import 'package:graphview/graphview.dart';
import 'package:codecrafter/quiz.dart';

class SubjectDependencyGraph extends StatefulWidget {
  const SubjectDependencyGraph({super.key});

  @override
  State<SubjectDependencyGraph> createState() => _SubjectDependencyGraphState();
}

class _SubjectDependencyGraphState extends State<SubjectDependencyGraph> {
  final TransformationController _transformationController =
      TransformationController();

  final Map<String, dynamic> apiData = {
    "subjects": [
      {
        "id": "CS101",
        "name": "Intro to Programming",
        "type": "core",
        "desc": "Learn Python basics and logic.",
      },
      {
        "id": "MA101",
        "name": "Calculus I",
        "type": "core",
        "desc": "Limits, derivatives, and integrals.",
      },
      {
        "id": "CS201",
        "name": "Data Structures",
        "type": "core",
        "desc": "Stacks, Queues, and Linked Lists.",
      },
      {
        "id": "CS301",
        "name": "Algorithms",
        "type": "core",
        "desc": "Big O notation and sorting algorithms.",
      },
      {
        "id": "AI401",
        "name": "Machine Learning",
        "type": "elective",
        "desc": "Neural networks and data models.",
      },
    ],
    "dependencies": [
      {"from": "CS101", "to": "CS201"},
      {"from": "CS201", "to": "CS301"},
      {"from": "CS301", "to": "AI401"},
      {"from": "MA101", "to": "CS301"},
      {"from": "MA101", "to": "AI401"},
    ],
  };

  Graph? graph;
  SugiyamaAlgorithm? algorithm;
  bool isReady = false;
  Set<String> completedIds = {};

  @override
  void initState() {
    super.initState();
    _setupGraph();
    WidgetsBinding.instance.addPostFrameCallback((_) => _resetView());
  }

  void _setupGraph() {
    final newGraph = Graph();
    final Map<String, Node> nodeMap = {};

    for (var subject in apiData['subjects']) {
      var node = Node.Id(subject['id']);
      nodeMap[subject['id']] = node;
    }

    for (var dep in apiData['dependencies']) {
      newGraph.addEdge(nodeMap[dep['from']]!, nodeMap[dep['to']]!);
    }

    final config = SugiyamaConfiguration()
      ..nodeSeparation = 80
      ..levelSeparation = 100
      ..orientation = SugiyamaConfiguration.ORIENTATION_TOP_BOTTOM;

    setState(() {
      graph = newGraph;
      algorithm = SugiyamaAlgorithm(config);
      isReady = true;
    });
  }

  void _resetView() {
    _transformationController.value = Matrix4.identity();
  }

  void _showDetails(Map<String, dynamic> subject) {
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
                          subject['name'],
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
                              subject['type'].toString().toUpperCase(),
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
                          subject['desc'],
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
                              builder: (context) => SubjectQuizManual(
                                subjectId: subject['id'],
                                subjectName: subject['name'],
                                onComplete: () => setState(
                                  () => completedIds.add(subject['id']),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text("Learning Roadmap"),
        elevation: 0,
        backgroundColor: theme.colorScheme.surface,
        foregroundColor: theme.colorScheme.onSurface,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _resetView,
        backgroundColor: theme.colorScheme.primary,
        child: Icon(Icons.fullscreen_exit, color: theme.colorScheme.onPrimary),
      ),
      body: !isReady
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
                    ..strokeCap = StrokeCap.round
                    ..style = PaintingStyle.stroke,
                  builder: (Node node) {
                    var id = node.key!.value as String;
                    var subject = apiData['subjects'].firstWhere(
                      (s) => s['id'] == id,
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

  Widget _buildNodeBox(Map<String, dynamic> subject) {
    bool isDone = completedIds.contains(subject['id']);
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
            subject['name'],
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
