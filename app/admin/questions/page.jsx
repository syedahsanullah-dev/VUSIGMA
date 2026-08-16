'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { HelpCircle, Upload, Trash2, X, Search, FileCode, Copy, RefreshCw } from 'lucide-react';
import ProgressModal from '@/components/ProgressModal';
import CodeBlock from '@/components/CodeBlock';
import ConfirmationModal from '@/components/ConfirmationModal';
import toast from 'react-hot-toast';

export default function QuestionsAdmin() {
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Bulk Import Modal
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  // Progress State
  const [progressState, setProgressState] = useState({
    isOpen: false,
    title: '',
    current: 0,
    total: 0,
    subtitle: '',
    error: null,
    isFinished: false
  });

  const mcqSampleTemplate = `[
  {
    "category": "MCQ",
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
]`;

  const subjectiveSampleTemplate = `[
  {
    "category": "SHORT",
    "questionText": "Differentiate between Conceptual Design and Logical Design in database design.",
    "questionTextUrdu": "",
    "solution": "Conceptual Design provides a high-level entity-relationship model independent of DBMS. Logical Design converts the ER model into relational schemas specific to the chosen DBMS model.",
    "solutionUrdu": "",
    "chapter": 2,
    "topic": "Database Design Phases",
    "difficulty": "Medium",
    "imagesBase64": [],
    "codeSnippet": "",
    "codeLanguage": "cpp",
    "solutionCode": "SELECT level_name FROM schema_design_phases WHERE type = 'Conceptual';",
    "solutionCodeLanguage": "sql",
    "isStarred": true,
    "isRepeated": false,
    "isImportant": true,
    "isConceptual": true
  }
]`;

  const loadSampleTemplate = () => {
    if (selectedCategory === 'MCQ') {
      setBulkJsonText(mcqSampleTemplate);
    } else {
      setBulkJsonText(subjectiveSampleTemplate);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsData, quizzesData, questionsResponse] = await Promise.all([
        api.get('/subjects'),
        api.get('/quizzes'),
        api.get('/questions')
      ]);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []));
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : (quizzesData?.data || []));
      
      const rawQuestions = Array.isArray(questionsResponse) ? questionsResponse : (questionsResponse?.data || []);
      setQuestions(Array.isArray(rawQuestions) ? rawQuestions : []);
      if (Array.isArray(subjectsData) && subjectsData.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsData[0].id);
      }
      setError(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) return;

    if (!selectedSubject) {
      toast.error('Please select a Target Subject before importing questions.');
      return;
    }

    setImporting(true);
    let parsedArray = [];
    try {
      const parsed = JSON.parse(bulkJsonText);
      parsedArray = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      toast.error('Invalid JSON format: ' + err.message);
      setImporting(false);
      return;
    }

    // Initialize Progress Modal
    setProgressState({
      isOpen: true,
      title: `Importing ${selectedCategory || 'Question'} Bank`,
      current: 0,
      total: parsedArray.length,
      subtitle: `Injecting questions into ${selectedSubject}...`,
      error: null,
      isFinished: false
    });

    try {
      const targetSubj = subjects.find(s => s.id === selectedSubject || s._id === selectedSubject || s.code === selectedSubject);
      const targetCode = targetSubj?.code || selectedSubject;

      const payload = {
        subjectCode: String(targetCode).toUpperCase(),
        category: selectedCategory || 'MCQ',
        questions: parsedArray
      };

      await api.post('/questions/bulk', payload);

      setProgressState(prev => ({
        ...prev,
        current: parsedArray.length,
        isFinished: true,
        subtitle: `Successfully imported ${parsedArray.length} questions!`
      }));

      await fetchData();
      setIsBulkOpen(false);
      setBulkJsonText('');
      toast.success(`Successfully imported ${parsedArray.length} questions!`);
    } catch (err) {
      setProgressState(prev => ({
        ...prev,
        error: 'Bulk Import Failed: ' + err.message,
        isFinished: true
      }));
      toast.error('Bulk Import Failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteQuestion = (id) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This action is permanent.',
      onConfirm: async () => {
        try {
          await api.delete(`/questions/${id}`);
          toast.success('Question deleted successfully!');
          await fetchData();
        } catch (err) {
          toast.error('Delete Failed: ' + err.message);
        } finally {
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const filteredQuestions = safeQuestions.filter(q => {
    if (selectedSubject) {
      const targetSubj = subjects.find(s => s.id === selectedSubject || s._id === selectedSubject || s.code === selectedSubject);
      const targetCode = (targetSubj?.code || selectedSubject).toUpperCase();
      const qCode = (q.subjectCode || '').toUpperCase();
      if (qCode && qCode !== targetCode) return false;
    }
    if (selectedCategory && q.category !== selectedCategory) return false;
    if (searchQuery && !q.questionText?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-green-400" />
            <span>Question Bank Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">Manage individual questions or bulk import JSON question banks.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700 transition-all disabled:opacity-50"
            title="Refresh questions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsBulkOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk JSON Import</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Subject Filter</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>({s.code}) {s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl font-medium"
          >
            <option value="">All Categories (MCQs, Short & Long)</option>
            <option value="MCQ">MCQs Only</option>
            <option value="SHORT">Short Questions Only</option>
            <option value="LONG">Long Questions Only</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">Search Keywords</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search text..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl"
            />
          </div>
        </div>
        <div className="flex items-end">
          <span className="text-slate-400 font-bold py-2">
            Matches: <span className="text-white">{filteredQuestions.length}</span> questions
          </span>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((q, idx) => (
          <div key={q.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-400">#{idx + 1}</span>
                <span className="bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded uppercase font-bold">
                  {q.category}
                </span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                  Ch {q.chapter}
                </span>
                {q.isStarred && <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded font-semibold">⭐ Starred</span>}
                {q.isRepeated && <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded font-semibold">🔁 Repeated</span>}
                {q.isImportant && <span className="bg-red-950/60 text-red-300 border border-red-800/50 px-1.5 py-0.5 rounded font-semibold">⚠️ Important</span>}
                {q.isConceptual && <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 px-1.5 py-0.5 rounded font-semibold">💡 Conceptual</span>}
                {(q.codeSnippet || q.solutionCode || q.hasCode) && <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.5 rounded font-semibold">💻 Code</span>}
                {q.questionTextUrdu && <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 px-1.5 py-0.5 rounded font-semibold">🌍 Urdu Available</span>}
              </div>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white text-sm whitespace-pre-wrap">{q.questionText}</p>
              {q.questionTextUrdu && (
                <p className="font-urdu text-indigo-300 text-base text-right leading-relaxed whitespace-pre-wrap">{q.questionTextUrdu}</p>
              )}
            </div>
            {q.codeSnippet && (
              <CodeBlock
                code={q.codeSnippet}
                language={q.codeLanguage || q.codeSnippetLanguage || q.language || 'cpp'}
                title="Question Code Snippet"
              />
            )}
            {q.category === 'MCQ' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-slate-400">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-1.5 rounded-lg border flex flex-col space-y-1 ${i === q.correctOption ? 'border-green-800 bg-green-950/30 text-green-300 font-bold' : 'border-slate-800 bg-slate-950'}`}>
                    <span>{['A', 'B', 'C', 'D'][i] || i + 1}. {opt}</span>
                    {q.optionsUrdu && q.optionsUrdu[i] && (
                      <span className="font-urdu text-right text-indigo-300/80">{q.optionsUrdu[i]}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {q.solution && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs flex flex-col space-y-2">
                <span className="font-bold text-blue-400 block mb-1">Solution & Answer Key:</span>
                <p className="whitespace-pre-wrap leading-relaxed">{q.solution}</p>
                {q.solutionUrdu && (
                  <p className="font-urdu text-indigo-300 text-sm text-right leading-relaxed whitespace-pre-wrap">{q.solutionUrdu}</p>
                )}
              </div>
            )}
            {q.explanation && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs flex flex-col space-y-2">
                <span className="font-bold text-amber-400 block mb-1">Explanation:</span>
                <p className="whitespace-pre-wrap leading-relaxed">{q.explanation}</p>
                {q.explanationUrdu && (
                  <p className="font-urdu text-indigo-300 text-sm text-right leading-relaxed whitespace-pre-wrap">{q.explanationUrdu}</p>
                )}
              </div>
            )}
            {q.solutionCode && (
              <CodeBlock
                code={q.solutionCode}
                language={q.solutionCodeLanguage || q.solutionLanguage || 'cpp'}
                title="Code Implementation Solution"
              />
            )}
          </div>
        ))}
        {filteredQuestions.length === 0 && (
          <div className="py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-xs">
            No questions found matching the selected filters.
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Bulk JSON Question Import</span>
              </h2>
              <button onClick={() => setIsBulkOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <div className="flex items-center justify-between bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/50">
                <div className="flex items-center space-x-2 text-indigo-300">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">{selectedCategory} JSON Scheme 1 Template</span>
                </div>
                <button
                  type="button"
                  onClick={loadSampleTemplate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Load Sample Template</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  required
                >
                  {(Array.isArray(subjects) ? subjects : []).map(s => (
                    <option key={s.id} value={s.id}>({s.code}) {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Quiz / Module (Optional)</label>
                <select
                  value={selectedQuiz}
                  onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                >
                  <option value="">Unassigned (Subject Pool)</option>
                  {(Array.isArray(quizzes) ? quizzes : []).filter(q => q.subjectId === selectedSubject).map(q => (
                    <option key={q.id} value={q.id}>{q.title} ({q.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Paste JSON Question Array</label>
                <textarea
                  rows="8"
                  value={bulkJsonText}
                  onChange={(e) => setBulkJsonText(e.target.value)}
                  placeholder='[{"category":"MCQ","questionText":"Sample?","options":["A","B","C","D"],"correctOption":0}]'
                  className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl font-mono text-xs"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {importing ? 'Importing...' : 'Import Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Loader Modal */}
      <ProgressModal
        isOpen={progressState.isOpen}
        title={progressState.title}
        current={progressState.current}
        total={progressState.total}
        subtitle={progressState.subtitle}
        error={progressState.error}
        isFinished={progressState.isFinished}
        onClose={() => setProgressState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
