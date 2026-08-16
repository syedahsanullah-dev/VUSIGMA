'use client';
import { useState } from 'react';
import { 
  FileCode2, Check, Copy, BookOpen, Database, FileText, 
  Settings, Users, ShieldCheck, List, LayoutTemplate
} from 'lucide-react';

const SCHEMAS = {
  subjects: {
    title: 'Single Subject Add',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'JSON payload for creating a single subject (/api/v1/subjects)',
    code: `{
  "name": "Data Structures",
  "code": "CS301",
  "description": "Introduction to Data Structures",
  "status": "draft", 
  "isActive": true,
  "totalChapters": 2,
  "chaptersConfig": [
    {
      "chapterNumber": 1,
      "chapterName": "Arrays",
      "topics": [
        { "topicName": "1.1 Introduction", "isImportant": true },
        { "topicName": "1.2 Memory Layout", "isImportant": false }
      ]
    }
  ]
}`
  },
  bulkSubjects: {
    title: 'Bulk Subject Import',
    icon: <Database className="w-5 h-5" />,
    description: 'JSON Array payload for importing multiple subjects without quizzes',
    code: `[
  {
    "name": "Object Oriented Programming",
    "code": "CS304",
    "description": "OOP Concepts",
    "status": "published",
    "isActive": true,
    "totalChapters": 1,
    "chaptersConfig": []
  }
]`
  },
  compositeSubject: {
    title: 'Composite Subject Import',
    icon: <LayoutTemplate className="w-5 h-5" />,
    description: 'JSON payload for importing a full subject WITH nested quizzes and questions (/api/v1/subjects/import-full)',
    code: `{
  "name": "Software Engineering",
  "code": "CS504",
  "description": "Software Engineering principles",
  "status": "published",
  "quizzes": [
    {
      "title": "Midterm MCQs",
      "category": "MCQ",
      "status": "published",
      "questions": [
        {
          "category": "MCQ",
          "questionText": "What is the SDLC?",
          "options": ["Software Design", "Software Development Life Cycle"],
          "correctOption": 1,
          "explanation": "SDLC stands for Software Development Life Cycle",
          "chapter": 1,
          "topic": "Intro",
          "difficulty": "Medium"
        }
      ]
    }
  ]
}`
  },
  singleQuiz: {
    title: 'Single Quiz Add',
    icon: <FileText className="w-5 h-5" />,
    description: 'JSON payload for creating a single quiz module (/api/v1/quizzes)',
    code: `{
  "subjectId": "60d5ecb8b392d70015342a12", // Replace with valid Subject ObjectId
  "title": "Final Term Short Questions",
  "category": "SHORT", // MCQ | SHORT | LONG
  "status": "draft",
  "isActive": true
}`
  },
  mcqQuestion: {
    title: 'Single Question (MCQ)',
    icon: <List className="w-5 h-5" />,
    description: 'JSON payload for creating an MCQ question (/api/v1/questions)',
    code: `{
  "subjectId": "60d5ecb8b392d70015342a12", // Required
  "quizId": "60d5ecb8b392d70015342a13",    // Optional
  "category": "MCQ",
  "questionText": "Which tag is used for links in HTML?",
  "questionTextUrdu": "",
  "options": ["<a>", "<b>", "<p>", "<link>"],
  "optionsUrdu": ["", "", "", ""],
  "correctOption": 0, // Zero-based index of 'options' array
  "explanation": "The <a> tag defines a hyperlink.",
  "explanationUrdu": "",
  "chapter": 1,
  "topic": "HTML Basics",
  "difficulty": "Easy", // Easy | Medium | Hard
  "status": "published",
  "isImportant": true
}`
  },
  shortLongQuestion: {
    title: 'Single Question (Short/Long)',
    icon: <FileText className="w-5 h-5" />,
    description: 'JSON payload for creating a Short or Long question',
    code: `{
  "subjectId": "60d5ecb8b392d70015342a12",
  "category": "SHORT", // or "LONG"
  "questionText": "Explain the concept of Polymorphism.",
  "questionTextUrdu": "",
  "solution": "Polymorphism allows objects of different types to be treated as objects of a common base type.",
  "solutionUrdu": "",
  "chapter": 3,
  "difficulty": "Medium",
  "status": "published",
  "hasCode": true,
  "codeSnippet": "class Animal {}",
  "codeLanguage": "cpp"
}`
  },
  bulkQuestions: {
    title: 'Bulk Question Import',
    icon: <Database className="w-5 h-5" />,
    description: 'JSON Array payload for importing multiple questions (/api/v1/questions/bulk-import)',
    code: `[
  {
    "questionText": "Write a C++ class definition for a Student record.",
    "questionTextUrdu": "",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "optionsUrdu": ["", "", "", ""],
    "correctOption": 0,
    "explanation": "Detailed explanation here...",
    "explanationUrdu": "",
    "solution": "Subjective solution text for Short/Long questions...",
    "solutionUrdu": "",
    "chapter": 3,
    "topic": "Class Construction",
    "difficulty": "Hard",
    "codeSnippet": "class Student {\\n  int id;\\n};",
    "codeLanguage": "cpp",
    "solutionCode": "class Student {\\npublic:\\n  int id;\\n};",
    "solutionCodeLanguage": "cpp",
    "imageBase64": "data:image/png;base64,...",
    "imagesBase64": ["data:image/png;base64,..."],
    "isStarred": true,
    "isImportant": true,
    "isRepeated": true,
    "isConceptual": false
  }
]`
  },
  users: {
    title: 'User / Admin Schema',
    icon: <Users className="w-5 h-5" />,
    description: 'JSON payload for creating or updating a user',
    code: `{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123", // Only needed on creation or password reset
  "role": "STUDENT" // STUDENT | SUPER_ADMIN
}`
  },
  settings: {
    title: 'System Settings Schema',
    icon: <Settings className="w-5 h-5" />,
    description: 'Structure of the settings collection',
    code: `{
  "key": "allowSelfRegistration",
  "value": true
}`
  },
  audit: {
    title: 'Audit Log Schema (Read-only)',
    icon: <ShieldCheck className="w-5 h-5" />,
    description: 'Structure of the Audit Log returned by the API',
    code: `{
  "_id": "60d5ecb8b392d70015342a12",
  "adminId": "60d5ecb8b392d70015342a10",
  "action": "CREATE", // CREATE | UPDATE | DELETE | LOGIN | LOGOUT | OTHER
  "resource": "Question",
  "resourceId": "60d5ecb8b392d70015342a11",
  "details": { "category": "MCQ" },
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-07-28T12:00:00Z"
}`
  },
  dbExport: {
    title: 'Full Database JSON (Import/Export)',
    icon: <Database className="w-5 h-5" />,
    description: 'The exact payload structure for full database dump/restore (/api/v1/subjects/dump/all)',
    code: `{
  "timestamp": "2026-07-28T12:00:00.000Z",
  "counts": {
    "subjects": 1,
    "quizzes": 1,
    "questions": 5,
    "users": 2,
    "settings": 6
  },
  "database": {
    "subjects": [ /* Array of Subject objects */ ],
    "quizzes": [ /* Array of Quiz objects */ ],
    "questions": [ /* Array of Question objects */ ],
    "users": [ /* Array of User objects (without passwordHash) */ ],
    "settings": [ /* Array of Setting objects */ ]
  }
}`
  }
};

export default function SchemaViewerAdmin() {
  const [activeSchemaKey, setActiveSchemaKey] = useState('subjects');
  const [copied, setCopied] = useState(false);

  const activeSchema = SCHEMAS[activeSchemaKey];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSchema.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 rounded-2xl">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Schema Documentation</h1>
            <p className="text-xs text-slate-400">
              Reference guide for JSON payloads used across import, export, and API operations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2 bg-slate-900 border border-slate-800 p-4 rounded-3xl h-fit">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Data Models</h2>
          {Object.entries(SCHEMAS).map(([key, schema]) => (
            <button
              key={key}
              onClick={() => setActiveSchemaKey(key)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSchemaKey === key 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {schema.icon}
              <span className="truncate">{schema.title}</span>
            </button>
          ))}
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                {activeSchema.icon}
                <span>{activeSchema.title}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">{activeSchema.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center space-x-2 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          
          <div className="p-6 bg-[#0d1117] overflow-x-auto flex-1">
            <pre className="text-sm font-mono text-[#e6edf3]">
              <code>{activeSchema.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
