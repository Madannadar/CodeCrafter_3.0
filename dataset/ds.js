// {
// "subject": "Data Structures",
// "questions":[
//   {
//     "id": "ds-q1",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Arrays",
//     "question": "What is the time complexity to access an element in an array if the index is known?",
//     "options": ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n^2)"],
//     "answer": "A",
//     "explanation": "Arrays provide constant time access because the memory address can be calculated directly using the base address and the index."
//   },
//   {
//     "id": "ds-q2",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Stacks",
//     "question": "A stack follows the FIFO (First-In, First-Out) principle.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "A stack follows the LIFO (Last-In, First-Out) principle. Queues follow FIFO."
//   },
//   {
//     "id": "ds-q3",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Linked Lists",
//     "question": "Which node in a singly linked list does not have a successor?",
//     "options": ["A) Head node", "B) Middle node", "C) Tail node", "D) Any node"],
//     "answer": "C",
//     "explanation": "The tail node is the last node in the list; its 'next' pointer is typically set to NULL."
//   },
//   {
//     "id": "ds-q4",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "Queues",
//     "question": "What are the two primary operations of a queue?",
//     "options": null,
//     "answer": "Enqueue and Dequeue",
//     "explanation": "Enqueue adds an element to the rear, and Dequeue removes an element from the front."
//   },
//   {
//     "id": "ds-q5",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Trees",
//     "question": "A binary tree node can have a maximum of how many children?",
//     "options": ["A) 1", "B) 2", "C) 3", "D) Unlimited"],
//     "answer": "B",
//     "explanation": "By definition, each node in a binary tree can have at most two children (left and right)."
//   },
//   {
//     "id": "ds-q6",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Searching",
//     "question": "Binary Search can be applied to an unsorted array.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "Binary search requires the data to be sorted to effectively eliminate half of the search space in each step."
//   },
//   {
//     "id": "ds-q7",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Strings",
//     "question": "Which character is used to signify the end of a string in C-style strings?",
//     "options": ["A) \\n", "B) \\t", "C) \\0", "D) \\s"],
//     "answer": "C",
//     "explanation": "The null character '\\0' is used to terminate strings in memory."
//   },
//   {
//     "id": "ds-q8",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "Recursion",
//     "question": "What is the result of a recursive function that lacks a base case?",
//     "options": null,
//     "answer": "Infinite recursion / Stack Overflow",
//     "explanation": "Without a base case to stop the calls, the function will fill the call stack until the program crashes."
//   },
//   {
//     "id": "ds-q9",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Hashing",
//     "question": "The process of mapping large data to small keys using a function is called:",
//     "options": ["A) Sorting", "B) Hashing", "C) Paging", "D) Mapping"],
//     "answer": "B",
//     "explanation": "Hashing uses a hash function to transform input data into a fixed-size string or number (the hash value)."
//   },
//   {
//     "id": "ds-q10",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Graphs",
//     "question": "A graph can contain cycles.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "Unlike trees, graphs are allowed to have paths that start and end at the same vertex."
//   },
//   {
//     "id": "ds-q11",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Linked Lists",
//     "question": "What is the time complexity to insert a node at the beginning of a singly linked list?",
//     "options": ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n log n)"],
//     "answer": "A",
//     "explanation": "Insertion at the head only requires updating the new node's next pointer and the head pointer, regardless of list size."
//   },
//   {
//     "id": "ds-q12",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Stacks",
//     "question": "Which data structure is mainly used to implement the UNDO/REDO feature in editors?",
//     "options": ["A) Queue", "B) Stack", "C) Linked List", "D) Hash Table"],
//     "answer": "B",
//     "explanation": "Two stacks are typically used: one for actions to undo and another for actions to redo."
//   },
//   {
//     "id": "ds-q13",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Trees",
//     "question": "Which traversal of a Binary Search Tree (BST) produces the elements in sorted order?",
//     "options": null,
//     "answer": "In-order Traversal",
//     "explanation": "In-order traversal visits nodes in the order: Left, Root, Right, which naturally sorts a BST."
//   },
//   {
//     "id": "ds-q14",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Queues",
//     "question": "In a circular queue of size 'n', how is the next position of the 'rear' pointer calculated?",
//     "options": ["A) rear + 1", "B) (rear + 1) / n", "C) (rear + 1) % n", "D) n % (rear + 1)"],
//     "answer": "C",
//     "explanation": "The modulo operator ensures that when the pointer reaches the end of the array, it wraps back to the beginning."
//   },
//   {
//     "id": "ds-q15",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "Binary Trees",
//     "question": "In a complete binary tree, every level except possibly the last is completely filled.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "All nodes are as far left as possible, and all levels are filled except the bottom one."
//   },
//   {
//     "id": "ds-q16",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Graphs",
//     "question": "Which algorithm is used to find the shortest path from a single source to all other vertices?",
//     "options": ["A) Prim's", "B) Kruskal's", "C) Dijkstra's", "D) Floyd-Warshall"],
//     "answer": "C",
//     "explanation": "Dijkstra's algorithm is the standard for single-source shortest path problems in non-negative weighted graphs."
//   },
//   {
//     "id": "ds-q17",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Sorting",
//     "question": "Which sorting algorithm is considered the best for small datasets or nearly sorted data?",
//     "options": null,
//     "answer": "Insertion Sort",
//     "explanation": "Insertion sort is very efficient for small n and has O(n) performance for already sorted lists."
//   },
//   {
//     "id": "ds-q18",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Heaps",
//     "question": "In a Max-Heap, where is the largest element located?",
//     "options": ["A) Leaf node", "B) Root node", "C) Leftmost node", "D) Rightmost node"],
//     "answer": "B",
//     "explanation": "The Max-Heap property ensures that the parent is always greater than or equal to its children, placing the maximum at the root."
//   },
//   {
//     "id": "ds-q19",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "Hashing",
//     "question": "Chaining is a technique used to resolve collisions in a Hash Table.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "Chaining involves creating a linked list at each index of the hash table to store multiple items that hash to the same value."
//   },
//   {
//     "id": "ds-q20",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Asymptotic Analysis",
//     "question": "Which notation provides a tight bound on the time complexity?",
//     "options": ["A) Big O", "B) Omega (Ω)", "C) Theta (Θ)", "D) Small o"],
//     "answer": "C",
//     "explanation": "Theta notation represents both the upper and lower bounds of the function's growth rate."
//   },
//   {
//     "id": "ds-q21",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Trees",
//     "question": "What is the height of an AVL tree with 'n' nodes in the worst case?",
//     "options": ["A) O(n)", "B) O(log n)", "C) O(n log n)", "D) O(1)"],
//     "answer": "B",
//     "explanation": "AVL trees are strictly self-balancing, ensuring that the height remains logarithmic even in the worst case."
//   },
//   {
//     "id": "ds-q22",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Graphs",
//     "question": "What is the difference between a Prim's and Kruskal's algorithm?",
//     "options": null,
//     "answer": "Prim's grows a tree from a starting vertex; Kruskal's builds a forest by adding the smallest edges.",
//     "explanation": "Both find the Minimum Spanning Tree (MST), but Prim's is vertex-centric while Kruskal's is edge-centric."
//   },
//   {
//     "id": "ds-q23",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Linked Lists",
//     "question": "To detect a cycle in a linked list, which algorithm is most efficient?",
//     "options": ["A) Binary Search", "B) Floyd's Tortoise and Hare", "C) Breadth-First Search", "D) Selection Sort"],
//     "answer": "B",
//     "explanation": "This algorithm uses two pointers moving at different speeds; if they meet, a cycle exists."
//   },
//   {
//     "id": "ds-q24",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Advanced Structures",
//     "question": "A B-tree of order 'm' can have at most how many keys in a single node?",
//     "options": ["A) m", "B) m - 1", "C) m / 2", "D) 2m"],
//     "answer": "B",
//     "explanation": "A node in a B-tree of order m can have at most m children and m-1 keys."
//   },
//   {
//     "id": "ds-q25",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "Complexity",
//     "question": "The time complexity of QuickSort is always O(n log n).",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "QuickSort has a worst-case complexity of O(n^2) when the pivot selection is poor (e.g., already sorted data)."
//   },
//   {
//     "id": "ds-q26",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Hashing",
//     "question": "Which collision resolution technique is prone to primary clustering?",
//     "options": ["A) Chaining", "B) Linear Probing", "C) Quadratic Probing", "D) Double Hashing"],
//     "answer": "B",
//     "explanation": "Linear probing creates long runs of occupied slots, which increases search time for new insertions."
//   },
//   {
//     "id": "ds-q27",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Heaps",
//     "question": "What is the time complexity to 'Heapify' an array of n elements?",
//     "options": null,
//     "answer": "O(n)",
//     "explanation": "Although it looks like O(n log n), a tighter analysis of the bottom-up construction shows it is linear O(n)."
//   },
//   {
//     "id": "ds-q28",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Sorting",
//     "question": "Which sorting algorithm is 'Stable' and uses O(n) extra space?",
//     "options": ["A) QuickSort", "B) MergeSort", "C) HeapSort", "D) Selection Sort"],
//     "answer": "B",
//     "explanation": "MergeSort preserves the relative order of equal elements (stable) but requires a temporary array of size n."
//   },
//   {
//     "id": "ds-q29",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "Trees",
//     "question": "Red-Black Trees provide faster lookups than AVL trees.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "AVL trees are more strictly balanced than Red-Black trees, leading to faster lookups but slower insertions/deletions."
//   },
//   {
//     "id": "ds-q30",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Graphs",
//     "question": "Which graph representation is best for a sparse graph (few edges)?",
//     "options": ["A) Adjacency Matrix", "B) Adjacency List", "C) Incidence Matrix", "D) Array of Vertices"],
//     "answer": "B",
//     "explanation": "Adjacency lists save space by only storing the edges that actually exist, whereas a matrix uses O(V^2) regardless of edge count."
//   }
// ]
// }