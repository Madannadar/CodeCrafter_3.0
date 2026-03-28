// {
// "subject": "C programming",
// "questions":[
//   {
//     "id": "cp-q1",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Basics",
//     "question": "Who is the father of C language?",
//     "options": ["A) James Gosling", "B) Dennis Ritchie", "C) Bjarne Stroustrup", "D) Guido van Rossum"],
//     "answer": "B",
//     "explanation": "Dennis Ritchie developed C at Bell Labs in 1972."
//   },
//   {
//     "id": "cp-q2",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Syntax",
//     "question": "Every C statement must end with a colon (:).",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "Every C statement must end with a semicolon (;)."
//   },
//   {
//     "id": "cp-q3",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Variables",
//     "question": "Which of the following is not a valid C variable name?",
//     "options": ["A) int_age", "B) _age", "C) 2age", "D) age2"],
//     "answer": "C",
//     "explanation": "Variable names cannot start with a digit in C."
//   },
//   {
//     "id": "cp-q4",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "Keywords",
//     "question": "How many keywords are there in the original ANSI C89 standard?",
//     "options": null,
//     "answer": "32",
//     "explanation": "The original C89/C90 standard defined 32 keywords."
//   },
//   {
//     "id": "cp-q5",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Operators",
//     "question": "Which operator is used for finding the remainder of a division?",
//     "options": ["A) /", "B) %", "C) &", "D) \\"],
//     "answer": "B",
//     "explanation": "The modulo operator (%) returns the remainder of an integer division."
//   },
//   {
//     "id": "cp-q6",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Data Types",
//     "question": "In C, the value 0 is considered 'True' in a boolean context.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "In C, 0 is False and any non-zero value is True."
//   },
//   {
//     "id": "cp-q7",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Functions",
//     "question": "What is the mandatory entry point function for every C program?",
//     "options": ["A) start()", "B) begin()", "C) main()", "D) init()"],
//     "answer": "C",
//     "explanation": "The main() function is the entry point where program execution begins."
//   },
//   {
//     "id": "cp-q8",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "Format Specifiers",
//     "question": "What format specifier is used to print a double precision floating point value?",
//     "options": null,
//     "answer": "%lf",
//     "explanation": "While %f works for float, %lf (long float) is the standard for doubles in scanf/printf."
//   },
//   {
//     "id": "cp-q9",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Comments",
//     "question": "Which of these is used for a single-line comment in C99 and later?",
//     "options": ["A) # comment", "B) // comment", "C) /* comment", "D) -- comment"],
//     "answer": "B",
//     "explanation": "// is used for single-line comments; /* */ is for multi-line."
//   },
//   {
//     "id": "cp-q10",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Constants",
//     "question": "A variable declared with the 'const' qualifier can be modified later via assignment.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "Once a 'const' variable is initialized, its value cannot be changed via direct assignment."
//   },
//   {
//     "id": "cp-q11",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Arrays",
//     "question": "If an array is declared as 'int arr[5]', what is the index of the last element?",
//     "options": ["A) 5", "B) 4", "C) 6", "D) 0"],
//     "answer": "B",
//     "explanation": "C uses 0-based indexing, so a size-5 array has indices 0, 1, 2, 3, and 4."
//   },
//   {
//     "id": "cp-q12",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Pointers",
//     "question": "What does the '*' operator represent when used in a declaration like 'int *p;'?",
//     "options": ["A) Multiplication", "B) Pointer declaration", "C) Address of", "D) Division"],
//     "answer": "B",
//     "explanation": "In a declaration, the asterisk indicates that the variable is a pointer type."
//   },
//   {
//     "id": "cp-q13",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Strings",
//     "question": "Which standard header file is required to use the strlen() function?",
//     "options": null,
//     "answer": "string.h",
//     "explanation": "string.h contains standard string manipulation functions."
//   },
//   {
//     "id": "cp-q14",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Storage Classes",
//     "question": "Which storage class specifies that a variable should be stored in a CPU register?",
//     "options": ["A) auto", "B) register", "C) static", "D) extern"],
//     "answer": "B",
//     "explanation": "The 'register' keyword suggests the compiler store the variable in a register for faster access."
//   },
//   {
//     "id": "cp-q15",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "Structures",
//     "question": "A structure can contain members of different data types.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "Structures are user-defined types that group logically related variables of different types."
//   },
//   {
//     "id": "cp-q16",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Loops",
//     "question": "Which loop is guaranteed to execute at least once?",
//     "options": ["A) for", "B) while", "C) do-while", "D) switch"],
//     "answer": "C",
//     "explanation": "The condition in a do-while loop is checked at the bottom, ensuring at least one run."
//   },
//   {
//     "id": "cp-q17",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Scope",
//     "question": "What is the scope of a variable declared inside a function without the 'static' keyword?",
//     "options": null,
//     "answer": "Local Scope",
//     "explanation": "Local variables are only accessible within the function they are declared in."
//   },
//   {
//     "id": "cp-q18",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Unions",
//     "question": "How much memory does a union occupy?",
//     "options": ["A) Sum of all members", "B) Size of the largest member", "C) 4 bytes", "D) Size of the smallest member"],
//     "answer": "B",
//     "explanation": "Unions share the same memory location; the total size is the size of its largest member."
//   },
//   {
//     "id": "cp-q19",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "Memory Management",
//     "question": "The malloc() function initializes the allocated memory to zero.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "malloc() leaves memory uninitialized (garbage values); calloc() initializes it to zero."
//   },
//   {
//     "id": "cp-q20",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Preprocessors",
//     "question": "What is the purpose of #include <stdio.h>?",
//     "options": ["A) To start the program", "B) To define the main function", "C) To include standard I/O library definitions", "D) To compile the code"],
//     "answer": "C",
//     "explanation": "It tells the preprocessor to include the header for standard input/output functions."
//   },
//   {
//     "id": "cp-q21",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Pointer Arithmetic",
//     "question": "If 'ptr' is an int pointer (4 bytes) at address 1000, what is the value of 'ptr + 2'?",
//     "options": ["A) 1002", "B) 1004", "C) 1008", "D) 1016"],
//     "answer": "C",
//     "explanation": "Pointer arithmetic scales by the size of the data type: 1000 + (2 * 4 bytes) = 1008."
//   },
//   {
//     "id": "cp-q22",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Recursion",
//     "question": "What runtime error occurs if a recursive function lacks a proper base case?",
//     "options": null,
//     "answer": "Stack Overflow",
//     "explanation": "Infinite recursion exhausts the stack memory allocated for function calls."
//   },
//   {
//     "id": "cp-q23",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Bitwise Operators",
//     "question": "What is the result of the bitwise expression: 5 & 3?",
//     "options": ["A) 1", "B) 7", "C) 8", "D) 2"],
//     "answer": "A",
//     "explanation": "Binary 101 (5) AND 011 (3) is 001, which is 1."
//   },
//   {
//     "id": "cp-q24",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "File I/O",
//     "question": "Which function is used to move the file pointer to a specific location?",
//     "options": ["A) ftell()", "B) rewind()", "C) fseek()", "D) fgetpos()"],
//     "answer": "C",
//     "explanation": "fseek() allows random access to a file by moving the position pointer."
//   },
//   {
//     "id": "cp-q25",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "Pointers",
//     "question": "A function can return a pointer to a local automatic variable safely.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "Returning a pointer to a local variable leads to 'Dangling Pointers' because the local memory is freed when the function returns."
//   },
//   {
//     "id": "cp-q26",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Function Pointers",
//     "question": "What is the correct syntax to declare a pointer to a function that returns an int and takes an int as an argument?",
//     "options": ["A) int *p(int);", "B) int (*p)(int);", "C) int p*(int);", "D) *int p(int);"],
//     "answer": "B",
//     "explanation": "Parentheses around (*p) are necessary to distinguish it from a function returning an int pointer."
//   },
//   {
//     "id": "cp-q27",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Command Line",
//     "question": "In the main(int argc, char *argv[]) signature, what does argc represent?",
//     "options": null,
//     "answer": "Argument Count",
//     "explanation": "argc stores the number of command-line arguments passed to the program."
//   },
//   {
//     "id": "cp-q28",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Memory Management",
//     "question": "What happens if you use free() on a pointer that has already been freed?",
//     "options": ["A) Nothing", "B) Pointer becomes NULL", "C) Undefined Behavior / Crash", "D) Memory is reallocated"],
//     "answer": "C",
//     "explanation": "Double-freeing memory causes undefined behavior and often leads to security vulnerabilities or crashes."
//   },
//   {
//     "id": "cp-q29",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "Type Qualifiers",
//     "question": "The 'volatile' keyword tells the compiler that a variable's value may change at any time without any action being taken by the code.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "Volatile prevents the compiler from optimizing variables that might be changed by hardware or concurrent threads."
//   },
//   {
//     "id": "cp-q30",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Dynamic Memory",
//     "question": "Which function can resize a previously allocated block of memory?",
//     "options": ["A) resize()", "B) update()", "C) realloc()", "D) mallupdate()"],
//     "answer": "C",
//     "explanation": "realloc() changes the size of the memory block pointed to by ptr to the new size."
//   }
// ]
// }