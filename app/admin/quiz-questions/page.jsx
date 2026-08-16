'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';;
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, CheckCircle2, UploadCloud, AlertTriangle, Image as ImageIcon, Tag, BookOpen, Edit2, X, Check, Download, FileCode, Copy } from 'lucide-react';
import ProgressModal from '@/components/ProgressModal';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import CodeBlock from '@/components/CodeBlock';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function QuizQuestionsAdmin() {
  const params = useParams();
  const quizId = params?.id || params?.quizId;

  const [quiz, setQuiz] = useState(null);
  const [subject, setSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [showSampleGuide, setShowSampleGuide] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);
  const [isCustomTopicMode, setIsCustomTopicMode] = useState(false);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Progress Loader State
  const [progressState, setProgressState] = useState({
    isOpen: false,
    title: '',
    current: 0,
    total: 0,
    subtitle: '',
    error: null,
    isFinished: false
  });

  // Single Question Form
  const [formData, setFormData] = useState({
    questionText: '',
    questionTextUrdu: '',
    chapter: 1,
    topic: 'General',
    difficulty: 'Medium',
    options: ['', '', '', ''],
    optionsUrdu: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    explanationUrdu: '',
    solution: '',
    solutionUrdu: '',
    imageBase64: '',
    imagesBase64: [],
    codeSnippet: '',
    codeLanguage: 'cpp',
    solutionCode: '',
    solutionCodeLanguage: 'cpp',
    isStarred: false,
    isRepeated: false,
    isImportant: false,
    isConceptual: false
  });

  // Bulk Import Form
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const matchedQuiz = await api.get(`/quizzes/${quizId}`);
      setQuiz(matchedQuiz);

      const subjectId = matchedQuiz?.subjectId;
      const [questionsData, subjectData] = await Promise.all([
        api.get(`/questions?quizId=${quizId}&includeAll=true&limit=all`).catch(() => []),
        subjectId ? api.get(`/subjects/${subjectId}`).catch(() => null) : null
      ]);

      setSubject(subjectData);

      let qList = Array.isArray(questionsData) ? questionsData : (questionsData?.data || []);

      // If direct quizId query returned 0 items, fallback to subject pool matching
      if (qList.length === 0 && subjectId) {
        const poolData = await api.get(`/questions?subjectId=${subjectId}&includeAll=true&limit=all`).catch(() => []);
        const rawPool = Array.isArray(poolData) ? poolData : (poolData?.data || []);
        const qCatUpper = (matchedQuiz?.category || 'MCQ').toUpperCase();
        const quizIdStr = (matchedQuiz?.id || matchedQuiz?._id || quizId)?.toString();

        qList = rawPool.filter(q => {
          const itemQuizId = (q.quizId?.id || q.quizId?._id || q.quizId)?.toString();
          const itemCatUpper = (q.category || 'MCQ').toUpperCase();

          if (itemQuizId && itemQuizId === quizIdStr) return true;
          if (matchedQuiz?.category && matchedQuiz.category !== 'MIXED' && itemCatUpper === qCatUpper) return true;
          return false;
        });
      }

      setQuestions(qList);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load quiz detail data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchData();
    }
  }, [quizId]);

  const chapterOptions = useMemo(() => {
    if (!subject?.chaptersConfig || !Array.isArray(subject.chaptersConfig) || subject.chaptersConfig.length === 0) {
      const total = subject?.totalChapters || 45;
      return Array.from({ length: total }, (_, i) => ({
        chapterNumber: i + 1,
        chapterName: `Chapter ${i + 1}`
      }));
    }
    return subject.chaptersConfig.map(ch => ({
      chapterNumber: ch.chapterNumber,
      chapterName: ch.chapterName || `Chapter ${ch.chapterNumber}`
    })).sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [subject]);

  const availableTopics = useMemo(() => {
    const topicSet = new Map();

    // 1. From Subject Chapter Config
    if (subject?.chaptersConfig && Array.isArray(subject.chaptersConfig)) {
      const selectedCh = formData.chapter ? parseInt(formData.chapter, 10) : null;
      subject.chaptersConfig.forEach(ch => {
        if (!selectedCh || ch.chapterNumber === selectedCh) {
          if (Array.isArray(ch.topics)) {
            ch.topics.forEach(tp => {
              const tName = typeof tp === 'string' ? tp.trim() : (tp.topicName || '').trim();
              if (tName && !topicSet.has(tName.toLowerCase())) {
                topicSet.set(tName.toLowerCase(), tName);
              }
            });
          }
        }
      });
    }

    // 2. From Existing Questions
    questions.forEach(q => {
      const tName = (q.topic || '').trim();
      if (tName && tName !== 'General' && !topicSet.has(tName.toLowerCase())) {
        topicSet.set(tName.toLowerCase(), tName);
      }
    });

    return Array.from(topicSet.values()).sort((a, b) => a.localeCompare(b));
  }, [subject, formData.chapter, questions]);

  const qType = quiz?.category || 'MCQ';

  const mcqSampleTemplate = `[
  {
    "category": "MCQ",
    "questionText": "Write a C++ class definition for a Student record.",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": 0,
    "explanation": "Detailed explanation here...",
    "solution": "Subjective solution text for Short/Long questions...",
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
    "questionText": "Differentiate between Conceptual Design and Logical Design in database design.",
    "solution": "Conceptual Design provides a high-level entity-relationship model independent of DBMS. Logical Design converts the ER model into relational schemas specific to the chosen DBMS model.",
    "chapter": 2,
    "topic": "Database Design Phases",
    "difficulty": "Medium",
    "isImportant": true
  }
]`;

  const loadSampleTemplate = () => {
    if (qType === 'MCQ') {
      setBulkJsonText(mcqSampleTemplate);
    } else {
      setBulkJsonText(subjectiveSampleTemplate);
    }
  };

  const openQuestionModal = (question = null) => {
    if (question) {
      setEditQuestionId(question.id);
      setFormData({
        questionText: question.questionText || '',
        questionTextUrdu: question.questionTextUrdu || '',
        chapter: question.chapter || 1,
        topic: question.topic || 'General',
        difficulty: question.difficulty || 'Medium',
        options: question.options && question.options.length === 4 ? question.options : ['', '', '', ''],
        optionsUrdu: question.optionsUrdu && question.optionsUrdu.length === 4 ? question.optionsUrdu : ['', '', '', ''],
        correctOption: question.correctOption !== undefined ? question.correctOption : 0,
        explanation: question.explanation || '',
        explanationUrdu: question.explanationUrdu || '',
        solution: question.solution || '',
        solutionUrdu: question.solutionUrdu || '',
        imageBase64: question.imageBase64 || '',
        imagesBase64: question.imagesBase64 || (question.imageBase64 ? [question.imageBase64] : []),
        codeSnippet: question.codeSnippet || '',
        codeLanguage: question.codeLanguage || 'cpp',
        solutionCode: question.solutionCode || '',
        solutionCodeLanguage: question.solutionCodeLanguage || 'cpp',
        isStarred: Boolean(question.isStarred),
        isRepeated: Boolean(question.isRepeated),
        isImportant: Boolean(question.isImportant),
        isConceptual: Boolean(question.isConceptual)
      });
    } else {
      setEditQuestionId(null);
      setFormData({
        questionText: '',
        questionTextUrdu: '',
        chapter: 1,
        topic: 'General',
        difficulty: 'Medium',
        options: ['', '', '', ''],
        optionsUrdu: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        explanationUrdu: '',
        solution: '',
        solutionUrdu: '',
        imageBase64: '',
        imagesBase64: [],
        codeSnippet: '',
        codeLanguage: 'cpp',
        solutionCode: '',
        solutionCodeLanguage: 'cpp',
        isStarred: false,
        isRepeated: false,
        isImportant: false,
        isConceptual: false
      });
    }
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Image is too large. Please compress it under 500KB.");
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageBase64: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleMCQOptionChange = (idx, val) => {
    const updated = [...formData.options];
    updated[idx] = val;
    setFormData({ ...formData, options: updated });
  };

  const addMCQOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeMCQOption = (index) => {
    if (formData.options.length <= 2) return;
    const updated = formData.options.filter((_, idx) => idx !== index);
    let correct = formData.correctOption;
    if (correct >= updated.length) {
      correct = updated.length - 1;
    }
    setFormData({ ...formData, options: updated, correctOption: correct });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);

    const questionBody = {
      subjectCode: String(subject?.code || quiz?.subjectCode || '').toUpperCase(),
      category: quiz?.category || 'MCQ',
      ...formData
    };

    try {
      if (editQuestionId) {
        await api.put(`/questions/${editQuestionId}`, questionBody);
        toast.success('Question updated successfully!');
      } else {
        await api.post('/questions', questionBody);
        toast.success('Question created successfully!');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Error saving question: " + err.message);
    } finally {
      setSaving(false);
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
          fetchData();
        } catch (err) {
          toast.error("Delete Failed: " + err.message);
        } finally {
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleClearAllQuestions = () => {
    if (questions.length === 0) return;
    setConfirmationModal({
      isOpen: true,
      title: 'Clear All Questions',
      message: `Are you sure you want to delete ALL ${questions.length} questions listed below? This action is permanent.`,
      onConfirm: async () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        setProgressState({
          isOpen: true,
          title: 'Clearing All MCQs & Questions',
          current: 0,
          total: questions.length,
          subtitle: 'Deleting item by item...',
          error: null,
          isFinished: false
        });
        let count = 0;
        try {
          for (const q of questions) {
            await api.delete(`/questions/${q.id}`);
            count++;
            setProgressState(prev => ({
              ...prev,
              current: count,
              subtitle: `Deleted question #${count} of ${questions.length}`
            }));
          }
          setProgressState(prev => ({
            ...prev,
            isFinished: true,
            subtitle: `Successfully deleted all ${questions.length} questions!`
          }));
          toast.success(`Deleted all ${questions.length} questions!`);
          fetchData();
        } catch (err) {
          setProgressState(prev => ({
            ...prev,
            error: "Failed to clear questions: " + err.message
          }));
          toast.error("Failed to clear questions: " + err.message);
        }
      }
    });
  };

  const handleExportQuestions = () => {
    if (questions.length === 0) {
      alert("No questions to export.");
      return;
    }

    const exportData = questions.map(q => {
      const base = {
        questionText: q.questionText,
        questionTextUrdu: q.questionTextUrdu || '',
        chapter: q.chapter || '',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'Medium',
        imageBase64: q.imageBase64 || ''
      };
      if (qType === 'MCQ') {
        return {
          ...base,
          options: q.options || ['', '', '', ''],
          optionsUrdu: q.optionsUrdu || ['', '', '', ''],
          correctOption: q.correctOption !== undefined ? q.correctOption : 0,
          explanation: q.explanation || '',
          explanationUrdu: q.explanationUrdu || ''
        };
      } else {
        return {
          ...base,
          solution: q.solution || '',
          solutionUrdu: q.solutionUrdu || ''
        };
      }
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const titleSanitized = (quiz?.title || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadAnchor.setAttribute('download', `${titleSanitized}_questions.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleJsonFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBulkJsonText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    if (!bulkJsonText.trim()) return;

    try {
      const parsedData = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsedData)) {
        toast.error("Format Error: JSON must be an array of question objects.");
        return;
      }

      const total = parsedData.length;
      setProgressState({
        isOpen: true,
        title: 'Importing MCQs & Questions',
        current: 0,
        total,
        subtitle: `Preparing to import ${total} questions...`,
        error: null,
        isFinished: false
      });

      const chunkSize = 20;
      let importedCount = 0;

      for (let i = 0; i < total; i += chunkSize) {
        const chunk = parsedData.slice(i, i + chunkSize);
        await api.post('/questions/bulk', {
          quizId: quiz.id,
          subjectId: quiz.subjectId,
          category: quiz.category || 'MCQ',
          questions: chunk
        });
        importedCount += chunk.length;
        setProgressState(prev => ({
          ...prev,
          current: importedCount,
          subtitle: `Uploaded ${importedCount} out of ${total} questions`
        }));
      }

      setProgressState(prev => ({
        ...prev,
        isFinished: true,
        subtitle: `Successfully imported ${total} questions!`
      }));

      fetchData();
      setIsBulkImportOpen(false);
      setBulkJsonText('');
    } catch (err) {
      setProgressState(prev => ({
        ...prev,
        error: "Import Failed: " + err.message
      }));
    }
  };

  if (loading) {
    return (
      <RealisticPageLoader
        title="Loading Quiz Question Bank..."
        subtitle="Fetching quiz details, question sets, and option metadata..."
        steps={[
          "Connecting to database...",
          "Loading question bank records...",
          "Parsing MCQ options & keys...",
          "Rendering question manager..."
        ]}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href={`/admin/subjects/${quiz?.subjectId}`} className="text-slate-400 hover:text-white flex items-center text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Subject Detail
        </Link>
      </div>

      {error ? (
        <div className="bg-red-950/40 text-red-300 p-4 rounded-xl border border-red-900/40 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-3xl font-extrabold text-white">{quiz?.title}</h1>
              <p className="text-slate-400 mt-1 text-sm">
                Manage {qType === 'MCQ' ? 'MCQs' : qType === 'SHORT' ? 'Short Questions' : 'Long Questions'} &bull; {questions.length} total
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {questions.length > 0 && (
                <>
                  <button
                    onClick={handleExportQuestions}
                    className="flex items-center px-4 py-2.5 bg-green-950/50 hover:bg-green-900 text-green-400 border border-green-900 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 mr-2" /> Export Questions
                  </button>

                  <button
                    onClick={handleClearAllQuestions}
                    className="flex items-center px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Clear All
                  </button>
                </>
              )}

              <button
                onClick={() => setIsBulkImportOpen(true)}
                className="flex items-center px-4 py-2.5 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-400 border border-indigo-900 rounded-xl font-bold text-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 mr-2" /> Bulk Import (JSON)
              </button>

              <button
                onClick={() => openQuestionModal()}
                className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Question
              </button>
            </div>
          </div>

          {/* Questions Render List */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const hasRealCode = (str) => {
                if (typeof str !== 'string') return false;
                const t = str.trim().toLowerCase();
                return t.length > 0 && !['c++', 'cpp', 'code', 'none', 'n/a', 'c', 'null', 'undefined', 'text'].includes(t);
              };

              const hasProblemCode = hasRealCode(q.codeSnippet);
              const hasSolutionCode = hasRealCode(q.solutionCode);

              return (
                <div key={q.id || idx} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className="bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <span className="bg-blue-950 text-blue-400 border border-blue-900 px-2.5 py-0.5 rounded-lg uppercase">
                      {q.category || qType}
                    </span>
                    {q.chapter && (
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg">
                        Ch {q.chapter}
                      </span>
                    )}
                    <span className="bg-purple-950/50 text-purple-300 border border-purple-900 px-2.5 py-0.5 rounded-lg">
                      Topic: {q.topic || 'General'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg border ${
                      q.difficulty === 'Easy'
                        ? 'bg-green-950/40 text-green-400 border-green-900'
                        : q.difficulty === 'Hard'
                          ? 'bg-red-950/40 text-red-400 border-red-900'
                          : 'bg-amber-950/40 text-amber-400 border-amber-900'
                    }`}>
                      {q.difficulty || 'Medium'}
                    </span>

                    {/* Attribute Badges */}
                    {q.isStarred && <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-lg">⭐ Starred</span>}
                    {q.isRepeated && <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-lg">🔁 Repeated</span>}
                    {q.isImportant && <span className="bg-red-950/60 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-lg">⚠️ Important</span>}
                    {q.isConceptual && <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded-lg">💡 Conceptual</span>}
                    {(hasProblemCode || hasSolutionCode) && <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded-lg">💻 Code</span>}
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    {q.imageBase64 && (
                      <div className="w-full md:w-48 shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-xl p-2 max-h-40 overflow-hidden">
                        <img src={q.imageBase64} alt="Diagram" className="object-contain max-h-full rounded" />
                      </div>
                    )}

                    <div className="flex-1 space-y-4">
                      <h3 className="font-bold text-base text-white whitespace-pre-wrap">{q.questionText}</h3>

                      {/* Multi-Image Gallery */}
                      {Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {q.imagesBase64.map((img, i) => (
                            <img key={i} src={img} alt="Diagram" className="h-28 object-contain rounded-xl border border-slate-800 bg-slate-950 p-1" />
                          ))}
                        </div>
                      )}

                      {/* Code Snippet Block */}
                      {hasProblemCode && (
                        <CodeBlock
                          code={q.codeSnippet}
                          language={q.codeLanguage || q.codeSnippetLanguage || q.language || 'cpp'}
                          title="Question Code Snippet"
                        />
                      )}

                    {qType === 'MCQ' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center ${
                              i === q.correctOption
                                ? 'bg-green-950/40 border-green-900 text-green-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 shrink-0 rounded-full bg-white/10 text-xs font-bold flex items-center justify-center mr-2.5">
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {i === q.correctOption && <Check className="w-4 h-4 text-green-400 shrink-0 ml-2" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Solution Text */}
                    {q.solution && (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300">
                        <span className="font-bold block mb-1 text-blue-400">Solution Key:</span>
                        <div className="whitespace-pre-wrap">{q.solution}</div>
                      </div>
                    )}

                    {/* Solution Code Block */}
                    {hasSolutionCode && (
                      <CodeBlock
                        code={q.solutionCode}
                        language={q.solutionCodeLanguage || q.solutionLanguage || 'cpp'}
                        title="Code Implementation Solution"
                      />
                    )}

                    {q.explanation && (
                      <div className="p-4 sm:p-5 bg-indigo-950/50 border border-indigo-800/80 rounded-2xl text-indigo-100 space-y-1.5 shadow-sm">
                        <span className="font-extrabold block text-indigo-300 uppercase tracking-wider text-xs">Detailed Explanation</span>
                        <p className="leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => openQuestionModal(q)}
                    className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors font-bold text-xs border border-slate-700 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="flex items-center px-4 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-xl transition-colors font-bold text-xs border border-red-900/50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            )})}

            {questions.length === 0 && (
              <div className="bg-slate-900 py-16 text-center text-slate-400 rounded-2xl border border-dashed border-slate-800 text-xs">
                No questions configured in this module. Click "Add Question" or "Bulk Import" to begin.
              </div>
            )}
          </div>

          {/* Form Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <h2 className="text-xl font-bold text-white">
                    {editQuestionId ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Chapter Number</label>
                      <select
                        value={formData.chapter || 1}
                        onChange={(e) => {
                          setFormData({ ...formData, chapter: parseInt(e.target.value, 10) || 1, topic: 'General' });
                          setIsCustomTopicMode(false);
                        }}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs"
                      >
                        {chapterOptions.map((ch) => (
                          <option key={ch.chapterNumber} value={ch.chapterNumber}>
                            Ch {ch.chapterNumber}: {ch.chapterName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5 flex justify-between items-center">
                        <span>Topic Tag</span>
                        <span className="text-[10px] text-blue-400 font-normal">
                          {availableTopics.length} Topics
                        </span>
                      </label>
                      <div className="space-y-1.5">
                        <select
                          value={isCustomTopicMode ? 'CUSTOM' : (availableTopics.includes(formData.topic) ? formData.topic : (formData.topic || 'General'))}
                          onChange={(e) => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomTopicMode(true);
                            } else {
                              setIsCustomTopicMode(false);
                              setFormData({ ...formData, topic: e.target.value });
                            }
                          }}
                          className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs"
                        >
                          <option value="General">General / Main Syllabus</option>
                          {availableTopics.map((tp) => (
                            <option key={tp} value={tp}>{tp}</option>
                          ))}
                          <option value="CUSTOM">➕ Type New Custom Topic...</option>
                        </select>

                        {isCustomTopicMode && (
                          <input
                            type="text"
                            value={formData.topic === 'CUSTOM' ? '' : formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                            placeholder="Enter custom topic name..."
                            className="w-full px-3 py-2 rounded-xl border border-indigo-700 bg-indigo-950/60 text-white outline-none text-xs"
                            required
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1.5">Difficulty</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                        className="w-full px-3.5 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Tag Attributes Checkboxes */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-slate-400 font-bold text-[11px] uppercase tracking-wider">Question Special Attributes</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.isStarred}
                          onChange={(e) => setFormData({ ...formData, isStarred: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                        <span>⭐ Starred</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.isImportant}
                          onChange={(e) => setFormData({ ...formData, isImportant: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                        <span>🎯 Important</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.isConceptual}
                          onChange={(e) => setFormData({ ...formData, isConceptual: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                        <span>💡 Conceptual</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.isRepeated}
                          onChange={(e) => setFormData({ ...formData, isRepeated: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900"
                        />
                        <span>🔄 Repeated</span>
                      </label>
                    </div>
                  </div>



                  <div className="space-y-3">
                    <label className="block font-semibold text-slate-300 mb-2">Question Statement</label>
                    <textarea
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      placeholder="Write the complete question details here..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      required
                    />
                    <textarea
                      value={formData.questionTextUrdu || ''}
                      dir="rtl"
                      onChange={(e) => setFormData({ ...formData, questionTextUrdu: e.target.value })}
                      placeholder="سوال کا متن یہاں لکھیں..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-indigo-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-urdu text-base"
                    />
                  </div>

                  {/* Code Snippet Input Controls */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-slate-300 font-bold text-xs">Question Code Snippet (Python, C++, Java, JS, SQL, Mongoose, etc.)</label>
                      <select
                        value={formData.codeLanguage}
                        onChange={(e) => setFormData({ ...formData, codeLanguage: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs outline-none font-bold"
                      >
                        <option value="cpp">⚡ C++</option>
                        <option value="python">🐍 Python</option>
                        <option value="java">☕ Java</option>
                        <option value="javascript">🟨 JavaScript</option>
                        <option value="sql">🗄️ SQL</option>
                        <option value="mongoose">🍃 Mongoose</option>
                        <option value="csharp">🔷 C#</option>
                        <option value="html">🌐 HTML5</option>
                        <option value="css">🎨 CSS3</option>
                        <option value="rust">⚙️ Rust</option>
                        <option value="php">🐘 PHP</option>
                      </select>
                    </div>
                    <textarea
                      value={formData.codeSnippet}
                      onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
                      placeholder="Paste code snippet here... (e.g. def calculate_tax(amount): or SELECT * FROM users;)"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-emerald-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs resize-none"
                    />
                  </div>

                  {/* Multi-Image Upload Section */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-2">Attach Multiple Diagrams / Images (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({
                              ...prev,
                              imagesBase64: [...prev.imagesBase64, reader.result]
                            }));
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 cursor-pointer"
                    />
                    {formData.imagesBase64?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.imagesBase64.map((img, idx) => (
                          <div key={idx} className="relative p-1 bg-slate-800 border border-slate-700 rounded-xl">
                            <img src={img} alt="Preview" className="h-16 w-16 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, imagesBase64: prev.imagesBase64.filter((_, i) => i !== idx) }))}
                              className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {qType === 'MCQ' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="block font-semibold text-slate-300">Options Configuration</label>
                        <button
                          type="button"
                          onClick={addMCQOption}
                          className="text-xs bg-slate-700 text-white hover:bg-slate-600 font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {formData.options.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <label className="text-xs font-bold text-slate-400 bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </label>
                            <div className="flex-1 flex flex-col space-y-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => handleMCQOptionChange(idx, e.target.value)}
                                placeholder={`Option ${idx + 1}`}
                                className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                              />
                              <input
                                type="text"
                                dir="rtl"
                                value={(formData.optionsUrdu && formData.optionsUrdu[idx]) || ''}
                                onChange={(e) => {
                                  const newOptsUrdu = formData.optionsUrdu ? [...formData.optionsUrdu] : [];
                                  newOptsUrdu[idx] = e.target.value;
                                  setFormData({ ...formData, optionsUrdu: newOptsUrdu });
                                }}
                                placeholder={`آپشن ${idx + 1}`}
                                className="w-full px-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-indigo-200 focus:ring-2 focus:ring-blue-500 outline-none font-urdu text-base"
                              />
                            </div>
                            <input
                              type="radio"
                              name="correctOptionRadioQuiz"
                              checked={formData.correctOption === idx}
                              onChange={() => setFormData({ ...formData, correctOption: idx })}
                              className="w-5 h-5 text-green-600 focus:ring-green-500 shrink-0 cursor-pointer"
                            />
                            {formData.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeMCQOption(idx)}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block font-semibold text-slate-300">Solution (Subjective Answer) Optional</label>
                        <textarea
                          value={formData.solution}
                          onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                          placeholder="Write model answer / solution text here..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <textarea
                          value={formData.solutionUrdu || ''}
                          dir="rtl"
                          onChange={(e) => setFormData({ ...formData, solutionUrdu: e.target.value })}
                          placeholder="حل یہاں لکھیں..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-indigo-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-urdu text-base"
                        />
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-slate-300 font-bold text-xs">Code Implementation Solution (Optional)</label>
                          <select
                            value={formData.solutionCodeLanguage}
                            onChange={(e) => setFormData({ ...formData, solutionCodeLanguage: e.target.value })}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs outline-none font-bold"
                          >
                            <option value="cpp">⚡ C++</option>
                            <option value="python">🐍 Python</option>
                            <option value="java">☕ Java</option>
                            <option value="javascript">🟨 JavaScript</option>
                            <option value="sql">🗄️ SQL</option>
                            <option value="mongoose">🍃 Mongoose</option>
                            <option value="csharp">🔷 C#</option>
                            <option value="html">🌐 HTML5</option>
                            <option value="css">🎨 CSS3</option>
                            <option value="rust">⚙️ Rust</option>
                            <option value="php">🐘 PHP</option>
                          </select>
                        </div>
                        <textarea
                          value={formData.solutionCode}
                          onChange={(e) => setFormData({ ...formData, solutionCode: e.target.value })}
                          placeholder="Paste code solution implementation here..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-emerald-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-semibold text-slate-300">Explanation (For MCQs) Optional</label>
                        <textarea
                          value={formData.explanation}
                          onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                          placeholder="Detailed explanation of the correct option..."
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <textarea
                          value={formData.explanationUrdu || ''}
                          dir="rtl"
                          onChange={(e) => setFormData({ ...formData, explanationUrdu: e.target.value })}
                          placeholder="وضاحت یہاں لکھیں..."
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-indigo-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-urdu text-base"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center space-x-2 cursor-pointer"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Save Question</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk Import Modal with Sample Template Loader */}
          {isBulkImportOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-800">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <UploadCloud className="w-5 h-5 text-indigo-400" />
                    <span>Bulk Import Questions ({qType} JSON)</span>
                  </h2>
                  <button onClick={() => setIsBulkImportOpen(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleBulkImportSubmit} className="p-6 space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/50">
                    <div className="flex items-center space-x-2 text-indigo-300">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="font-bold">{qType} JSON Scheme 1 Template</span>
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
                    <label className="block font-semibold text-slate-300 mb-2">Upload .json File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-2">Or Paste JSON Content</label>
                    <textarea
                      value={bulkJsonText}
                      onChange={(e) => setBulkJsonText(e.target.value)}
                      placeholder="Paste JSON list of question objects..."
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsBulkImportOpen(false)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isImporting}
                      className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center space-x-2 cursor-pointer"
                    >
                      {isImporting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Start Import</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
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
