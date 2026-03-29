// {
// "subject": "Digital Logic & Computer Architecture",
// "questions":[
//   {
//     "id": "dlca-q1",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Logic Gates",
//     "question": "Which logic gate is known as the 'Universal Gate'?",
//     "options": ["A) AND", "B) OR", "C) NAND", "D) XOR"],
//     "answer": "C",
//     "explanation": "NAND (and NOR) gates are universal because any boolean function can be implemented using only these gates."
//   },
//   {
//     "id": "dlca-q2",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Boolean Algebra",
//     "question": "According to De Morgan's Law, NOT (A AND B) is equal to (NOT A) OR (NOT B).",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "De Morgan's First Law states that the complement of a product is equal to the sum of the complements."
//   },
//   {
//     "id": "dlca-q3",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Number Systems",
//     "question": "What is the binary equivalent of the decimal number 10?",
//     "options": ["A) 1001", "B) 1010", "C) 1100", "D) 1111"],
//     "answer": "B",
//     "explanation": "10 in decimal is 8 + 2, which corresponds to 2^3 + 2^1, resulting in 1010 in binary."
//   },
//   {
//     "id": "dlca-q4",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "CPU Registers",
//     "question": "What is the function of the Program Counter (PC)?",
//     "options": null,
//     "answer": "To hold the address of the next instruction to be executed.",
//     "explanation": "The PC is incremented after every fetch cycle to point to the subsequent instruction in memory."
//   },
//   {
//     "id": "dlca-q5",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Combinational Circuits",
//     "question": "How many select lines are required for a 8-to-1 Multiplexer (MUX)?",
//     "options": ["A) 2", "B) 3", "C) 4", "D) 8"],
//     "answer": "B",
//     "explanation": "The number of select lines 'n' is related to inputs 'N' by 2^n = N. Since 2^3 = 8, 3 select lines are needed."
//   },
//   {
//     "id": "dlca-q6",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Memory",
//     "question": "RAM is a non-volatile memory.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "RAM is volatile; it loses its data when the power is turned off."
//   },
//   {
//     "id": "dlca-q7",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Computer Arithmetic",
//     "question": "Which method is commonly used to represent negative numbers in modern computers?",
//     "options": ["A) Sign-Magnitude", "B) 1's Complement", "C) 2's Complement", "D) 9's Complement"],
//     "answer": "C",
//     "explanation": "2's complement simplifies hardware design for addition and subtraction and eliminates the 'negative zero' problem."
//   },
//   {
//     "id": "dlca-q8",
//     "type": "Q&A",
//     "difficulty": "Easy",
//     "concept": "Logic Gates",
//     "question": "Draw the truth table for an XOR gate with two inputs A and B.",
//     "options": null,
//     "answer": "A=0,B=0: 0; A=0,B=1: 1; A=1,B=0: 1; A=1,B=1: 0",
//     "explanation": "The XOR gate output is high only when the inputs are different."
//   },
//   {
//     "id": "dlca-q9",
//     "type": "MCQ",
//     "difficulty": "Easy",
//     "concept": "Instruction Cycle",
//     "question": "In which phase is the instruction converted into control signals?",
//     "options": ["A) Fetch", "B) Decode", "C) Execute", "D) Store"],
//     "answer": "B",
//     "explanation": "During the decode phase, the control unit interprets the opcode of the instruction."
//   },
//   {
//     "id": "dlca-q10",
//     "type": "True/False",
//     "difficulty": "Easy",
//     "concept": "Flip-Flops",
//     "question": "A flip-flop is a 1-bit memory element.",
//     "options": ["True", "False"],
//     "answer": "True",
//     "explanation": "Flip-flops are bistable multivibrators used to store a single binary digit (0 or 1)."
//   },
//   {
//     "id": "dlca-q11",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "K-Maps",
//     "question": "In a 4-variable K-map, a group of 8 adjacent cells (octet) reduces how many variables?",
//     "options": ["A) 1", "B) 2", "C) 3", "D) 4"],
//     "answer": "C",
//     "explanation": "Grouping 2^n cells eliminates 'n' variables. For an octet (2^3), 3 variables are eliminated."
//   },
//   {
//     "id": "dlca-q12",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Sequential Circuits",
//     "question": "Which flip-flop has the 'Toggle' condition when both inputs are high?",
//     "options": ["A) SR", "B) D", "C) JK", "D) RS"],
//     "answer": "C",
//     "explanation": "In a JK flip-flop, J=1 and K=1 causes the output to switch to its complement on the next clock pulse."
//   },
//   {
//     "id": "dlca-q13",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Memory Hierarchy",
//     "question": "What is the purpose of Cache memory?",
//     "options": null,
//     "answer": "To bridge the speed gap between the fast CPU and the slow Main Memory.",
//     "explanation": "Cache stores frequently accessed data closer to the CPU to reduce access latency."
//   },
//   {
//     "id": "dlca-q14",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Bus Structure",
//     "question": "Which bus is bidirectional in a computer system?",
//     "options": ["A) Address Bus", "B) Control Bus", "C) Data Bus", "D) None"],
//     "answer": "C",
//     "explanation": "The Data Bus must be bidirectional to allow data to be both read from and written to memory/IO devices."
//   },
//   {
//     "id": "dlca-q15",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "I/O Organization",
//     "question": "DMA (Direct Memory Access) requires the CPU to manage every byte of data transfer.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "DMA allows I/O devices to transfer data directly to/from memory without continuous CPU involvement."
//   },
//   {
//     "id": "dlca-q16",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Combinational Circuits",
//     "question": "A Full Adder can be implemented using two Half Adders and which additional gate?",
//     "options": ["A) AND", "B) OR", "C) NOT", "D) NAND"],
//     "answer": "B",
//     "explanation": "The 'Carry' outputs of the two half adders are combined using an OR gate to produce the final carry."
//   },
//   {
//     "id": "dlca-q17",
//     "type": "Q&A",
//     "difficulty": "Medium",
//     "concept": "Instruction Formats",
//     "question": "What is the difference between a Zero-address and a One-address instruction?",
//     "options": null,
//     "answer": "Zero-address uses a Stack; One-address uses an Accumulator.",
//     "explanation": "Zero-address relies on implicit stack top operands, while One-address specifies one operand and assumes the other is in the AC."
//   },
//   {
//     "id": "dlca-q18",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Computer Architecture",
//     "question": "The Von Neumann architecture is characterized by:",
//     "options": ["A) Separate memory for data and instructions", "B) Stored-program concept with shared memory", "C) Parallel processing units", "D) No Control Unit"],
//     "answer": "B",
//     "explanation": "Von Neumann systems use a single memory space for both programs and data, leading to the 'Von Neumann Bottleneck'."
//   },
//   {
//     "id": "dlca-q19",
//     "type": "True/False",
//     "difficulty": "Medium",
//     "concept": "Pipelining",
//     "question": "Pipelining increases the instruction execution time for a single instruction.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "Pipelining improves throughput (instructions per second) but may slightly increase the latency of an individual instruction due to overhead."
//   },
//   {
//     "id": "dlca-q20",
//     "type": "MCQ",
//     "difficulty": "Medium",
//     "concept": "Addressing Modes",
//     "question": "In which addressing mode is the operand part of the instruction itself?",
//     "options": ["A) Direct", "B) Indirect", "C) Immediate", "D) Relative"],
//     "answer": "C",
//     "explanation": "Immediate addressing provides the actual value (e.g., ADD 5) instead of a memory address."
//   },
//   {
//     "id": "dlca-q21",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Memory Mapping",
//     "question": "In a 2-way Set Associative cache, a memory block can be mapped to how many locations in the cache?",
//     "options": ["A) 1", "B) 2", "C) 4", "D) Any"],
//     "answer": "B",
//     "explanation": "The block is mapped to a specific set, and within that set, it can occupy any of the 2 available slots."
//   },
//   {
//     "id": "dlca-q22",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Computer Arithmetic",
//     "question": "Explain Booth's Algorithm.",
//     "options": null,
//     "answer": "A multiplication algorithm that treats strings of 1s in the multiplier as a single shift-and-subtract operation.",
//     "explanation": "It speeds up multiplication by reducing the number of partial products for signed-binary integers."
//   },
//   {
//     "id": "dlca-q23",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Pipelining",
//     "question": "Data Hazards in a pipeline occur when:",
//     "options": ["A) Two instructions need the same hardware", "B) An instruction depends on the result of a previous one still in the pipe", "C) A branch instruction changes the PC", "D) Memory is slow"],
//     "answer": "B",
//     "explanation": "This is specifically a Read-After-Write (RAW) hazard, where the pipeline must stall or use forwarding."
//   },
//   {
//     "id": "dlca-q24",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Control Unit",
//     "question": "Hardwired control units are generally ________ than Microprogrammed control units.",
//     "options": ["A) Slower and more flexible", "B) Faster and less flexible", "C) Slower and less flexible", "D) Faster and more flexible"],
//     "answer": "B",
//     "explanation": "Hardwired units use combinational logic for speed; microprogrammed units use a control memory, making them easier to modify but slower."
//   },
//   {
//     "id": "dlca-q25",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "RISC vs CISC",
//     "question": "CISC architectures focus on reducing the number of cycles per instruction (CPI).",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "RISC focuses on low CPI. CISC focuses on reducing the number of instructions per program by using complex, multi-cycle instructions."
//   },
//   {
//     "id": "dlca-q26",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Sequential Circuits",
//     "question": "What is the maximum number of states in a 4-bit ripple counter?",
//     "options": ["A) 4", "B) 8", "C) 15", "D) 16"],
//     "answer": "D",
//     "explanation": "A counter with 'n' flip-flops has 2^n states. 2^4 = 16 (counting from 0 to 15)."
//   },
//   {
//     "id": "dlca-q27",
//     "type": "Q&A",
//     "difficulty": "Hard",
//     "concept": "Virtual Memory",
//     "question": "What is 'Thrashing' in the context of virtual memory?",
//     "options": null,
//     "answer": "A state where the system spends more time swapping pages in and out than executing instructions.",
//     "explanation": "It occurs when the working set of active processes exceeds the available physical memory."
//   },
//   {
//     "id": "dlca-q28",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "Interrupts",
//     "question": "In Vectored Interrupts, the device providing the interrupt also provides:",
//     "options": ["A) The priority level", "B) The address of the ISR", "C) The data to be processed", "D) The clock signal"],
//     "answer": "B",
//     "explanation": "The device sends a vector address that points the CPU directly to the Interrupt Service Routine (ISR)."
//   },
//   {
//     "id": "dlca-q29",
//     "type": "True/False",
//     "difficulty": "Hard",
//     "concept": "Logic Families",
//     "question": "TTL (Transistor-Transistor Logic) has lower power consumption than CMOS.",
//     "options": ["True", "False"],
//     "answer": "False",
//     "explanation": "CMOS (Complementary Metal-Oxide-Semiconductor) is known for extremely low static power consumption compared to TTL."
//   },
//   {
//     "id": "dlca-q30",
//     "type": "MCQ",
//     "difficulty": "Hard",
//     "concept": "RAID",
//     "question": "Which RAID level provides disk mirroring for high data reliability?",
//     "options": ["A) RAID 0", "B) RAID 1", "C) RAID 5", "D) RAID 10"],
//     "answer": "B",
//     "explanation": "RAID 1 duplicates data across two disks; RAID 0 is striping (no redundancy)."
//   }
// ]
// }