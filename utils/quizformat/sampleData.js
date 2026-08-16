'use client';
export const SAMPLE_MESSY_DATA = `
VU SIGMA Exam Question Bank Extraction Log

\`\`\`json
[
  {
    "category": "MCQ",
    "questionText": "Consider a C++ class with dynamic memory allocation. Which component MUST be implemented to prevent resource leaks when an object goes out of scope?",
    "options": [
      "Copy Constructor",
      "Virtual Destructor",
      "Overloaded Assignment Operator",
      "Default Constructor"
    ],
    "correctOption": 1,
    "explanation": "A virtual destructor ensures that derived class destructors are called in correct sequence when deleting a base class pointer.",
    "chapter": 15,
    "topic": "Virtual Destructors & Memory Management",
    "difficulty": "Hard",
    "codeSnippet": "class Base {\\npublic:\\n    virtual ~Base() { cout << \\"Base Destroyed\\"; }\\n};",
    "codeLanguage": "cpp",
    "solutionCode": "class Derived : public Base {\\n    int* data;\\npublic:\\n    Derived() { data = new int[100]; }\\n    ~Derived() { delete[] data; cout << \\"Derived Destroyed\\"; }\\n};",
    "solutionCodeLanguage": "cpp",
    "imageBase64": "",
    "imagesBase64": [],
    "isStarred": true,
    "isImportant": true,
    "isRepeated": true,
    "isConceptual": true
  },
  {
    "category": "MCQ",
    "questionText": "Which architectural pattern separates data model, UI presentation, and user interaction logic?",
    "options": [
      "Singleton Pattern",
      "Factory Pattern",
      "Model-View-Controller (MVC)",
      "Strategy Pattern"
    ],
    "correctOption": 2,
    "explanation": "MVC separates data (Model), UI presentation (View), and input handling (Controller).",
    "chapter": 3,
    "topic": "MVC Architecture",
    "difficulty": "Easy",
    "isStarred": false,
    "isImportant": true,
    "isRepeated": false,
    "isConceptual": true
  },
  {
    "category": "SHORT",
    "questionText": "Differentiate between Software Product Design and Software Engineering Design.",
    "solution": "1. Software Product Design: Focuses on specifying features, capabilities, and user interfaces to satisfy client needs.\\n2. Software Engineering Design: Focuses on internal technical architecture, database schemas, and program sub-systems.",
    "chapter": 1,
    "topic": "Design Categories",
    "difficulty": "Easy",
    "isImportant": true,
    "isConceptual": true
  },
  {
    "category": "LONG",
    "questionText": "Write a complete SQL DDL script to create a normalized 2NF STUDENT and ENROLLMENT database schema.",
    "solution": "1. Create STUDENT table with StudentID primary key.\\n2. Create COURSE table with CourseID primary key.\\n3. Create ENROLLMENT junction table with composite key (StudentID, CourseID) and foreign keys.",
    "chapter": 20,
    "topic": "2NF Schema Normalization",
    "difficulty": "Hard",
    "codeSnippet": "-- Unnormalized Table:\\n-- COURSE_REG(StudentID, StudentName, CourseID, CourseTitle, Grade)",
    "codeLanguage": "sql",
    "solutionCode": "CREATE TABLE STUDENT (\\n    StudentID INT PRIMARY KEY,\\n    StudentName VARCHAR(50)\\n);\\n\\nCREATE TABLE COURSE (\\n    CourseID VARCHAR(10) PRIMARY KEY,\\n    CourseTitle VARCHAR(100)\\n);\\n\\nCREATE TABLE ENROLLMENT (\\n    StudentID INT,\\n    CourseID VARCHAR(10),\\n    Grade CHAR(2),\\n    PRIMARY KEY (StudentID, CourseID),\\n    FOREIGN KEY (StudentID) REFERENCES STUDENT(StudentID),\\n    FOREIGN KEY (CourseID) REFERENCES COURSE(CourseID)\\n);",
    "solutionCodeLanguage": "sql",
    "isStarred": true,
    "isImportant": true,
    "isRepeated": true,
    "isConceptual": true
  }
]
\`\`\`

Full Subject Import Scheme 2 Sample payload:

\`\`\`json
{
  "subject": {
    "name": "CS403P - Database Management Systems Lab",
    "code": "CS403P",
    "description": "Lab handouts, MCQs, SQL DDL/DML, and subjective question bank.",
    "status": "active"
  },
  "quizzes": [
    {
      "id": "quiz_midterm_mcqs",
      "title": "Mid-term Quiz MCQs",
      "category": "MCQ",
      "status": "active"
    },
    {
      "id": "quiz_short_q",
      "title": "Short Questions Bank",
      "category": "SHORT",
      "status": "active"
    }
  ],
  "questions": [
    {
      "quizId": "quiz_midterm_mcqs",
      "category": "MCQ",
      "questionText": "What is the alternate name of Data Dictionary?",
      "options": ["Metadata", "Index", "Data", "System Catalog"],
      "correctOption": 0,
      "explanation": "Data Dictionary contains data about data.",
      "chapter": 1,
      "topic": "Data Dictionary",
      "difficulty": "Easy",
      "isImportant": true
    }
  ]
}
\`\`\`
`;
