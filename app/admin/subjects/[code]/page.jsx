'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';;
import api from '@/lib/api';
import toast from 'react-hot-toast';
import CodeBlock from '@/components/CodeBlock';
import {
  Plus,
  Trash2,
  ArrowLeft,
  FileText,
  LayoutList,
  Edit2,
  HelpCircle,
  X,
  AlertTriangle,
  Download,
  Upload,
  UploadCloud,
  FileJson,
  BookOpen,
  Star,
  Search,
  Filter,
  Tag,
  Eye,
  EyeOff,
  Sparkles,
  BookMarked,
  Layers,
  Video,
  FileCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Save
} from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import StatusBadge, { STATUS_OPTIONS } from '@/components/StatusBadge';

export default function SubjectDetailAdmin() {
  const params = useParams();
  const subjectId = params?.code || params?.subjectId;

  const [subject, setSubject] = useState(null);
  const [sets, setSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Tab State: 'modules' | 'syllabus' | 'guide' | 'notes' | 'videos' | 'questions'
  const [activeTab, setActiveTab] = useState('modules');

  // Question Bank Explorer Filters
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState('ALL');
  const [chapterRangeMin, setChapterRangeMin] = useState('ALL');
  const [chapterRangeMax, setChapterRangeMax] = useState('ALL');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [attributeFilter, setAttributeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');
  const [groupBy, setGroupBy] = useState('none'); // 'none' | 'chapter' | 'topic'
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [revealedExplanations, setRevealedExplanations] = useState({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);

  // Study Guide & FAQs States
  const [overviewTextEdit, setOverviewTextEdit] = useState('');
  const [isAddFaqOpen, setIsAddFaqOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Notes & Handouts States
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', category: 'Handouts', fileUrl: '', description: '' });

  // Past Papers Links States
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [newPaper, setNewPaper] = useState({ title: '', url: '', year: '2025', term: 'Finalterm' });

  // Video Lectures States
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({ title: '', youtubeUrl: '', duration: '15 mins', topic: 'General' });

  // Single Question Creation State
  const [isAddSingleQuestionOpen, setIsAddSingleQuestionOpen] = useState(false);
  const [singleQuestion, setSingleQuestion] = useState({
    category: 'MCQ',
    questionText: '',
    questionTextUrdu: '',
    options: ['', '', '', ''],
    optionsUrdu: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    explanationUrdu: '',
    solution: '',
    solutionUrdu: '',
    chapter: 1,
    topic: 'General',
    difficulty: 'Medium',
    codeSnippet: '',
    codeLanguage: 'cpp',
    solutionCode: '',
    solutionCodeLanguage: 'cpp',
    status: 'published',
    imageBase64: '',
    imagesBase64: [],
    isStarred: false,
    isImportant: false,
    isRepeated: false,
    isConceptual: false
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSetId, setEditSetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSet, setNewSet] = useState({
    title: '',
    description: '',
    category: 'MCQ',
    quizType: 'CHAPTER_QUIZ',
    chaptersInput: '',
    topicsInput: '',
    timeLimitMinutes: 15,
    status: 'published',
    isActive: true,
    isFullCourse: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const rawSubjectRes = await api.get(`/subjects/${subjectId}`);
      const subjectData = rawSubjectRes?.data || rawSubjectRes;
      setSubject(subjectData);
      setOverviewTextEdit(subjectData?.overviewText || '');

      const realSubjectId = subjectData?.id || subjectData?._id || subjectId;
      const realCode = subjectData?.code || (params?.code && params.code.length < 10 ? params.code : null);

      const [quizzesData, questionsData] = await Promise.all([
        api.get(`/quizzes?subjectId=${realSubjectId}`),
        api.get(`/questions?subjectCode=${realCode}&includeAll=true&limit=all`).catch(() => [])
      ]);

      const qList = Array.isArray(questionsData) ? questionsData : (questionsData?.data || []);
      setQuestions(qList);

      const rawQuizzes = Array.isArray(quizzesData) ? quizzesData : (quizzesData?.data || []);

      const resolvedSets = rawQuizzes.map((quiz) => {
        const quizIdStr = (quiz.id || quiz._id)?.toString();
        const quizCatUpper = (quiz.category || 'MCQ').toUpperCase();

        let count = 0;

        // 1. Explicit questionIds array attached to Quiz
        if (Array.isArray(quiz.questionIds) && quiz.questionIds.length > 0) {
          count = quiz.questionIds.length;
        } else {
          // 2. Direct question.quizId links
          const directCount = qList.filter(q => {
            const qQuizId = (q.quizId?.id || q.quizId?._id || q.quizId)?.toString();
            return qQuizId && qQuizId === quizIdStr;
          }).length;

          if (directCount > 0) {
            count = directCount;
          } else {
            // 3. Chapters / topics filter
            const hasCh = Array.isArray(quiz.chapters) && quiz.chapters.length > 0;
            const hasTop = Array.isArray(quiz.topics) && quiz.topics.length > 0;

            if (hasCh || hasTop) {
              count = qList.filter(q => {
                const qCat = (q.category || 'MCQ').toUpperCase();
                if (quizCatUpper !== 'MIXED' && qCat !== quizCatUpper) return false;
                if (hasCh && !quiz.chapters.includes(Number(q.chapter))) return false;
                if (hasTop && !quiz.topics.includes(q.topic)) return false;
                return true;
              }).length;
            } else if (quiz.isFullCourse || quiz.quizType === 'FULL_SUBJECT' || quiz.isAllQuestions) {
              count = qList.filter(q => {
                const qCat = (q.category || 'MCQ').toUpperCase();
                return quizCatUpper === 'MIXED' || qCat === quizCatUpper;
              }).length;
            } else {
              count = quiz.questionCount || 0;
            }
          }
        }

        return {
          ...quiz,
          id: quizIdStr,
          _id: quizIdStr,
          questionCount: count
        };
      });

      setSets(resolvedSets);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load subject module details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  // Compute Chapters & Topics Breakdown
  const chaptersBreakdown = useMemo(() => {
    if (!subject) return [];

    const map = new Map();

    // 1. Seed from subject.chaptersConfig
    if (Array.isArray(subject.chaptersConfig)) {
      subject.chaptersConfig.forEach(ch => {
        const chNum = ch.chapterNumber != null ? Number(ch.chapterNumber) : 1;
        if (!map.has(chNum)) {
          map.set(chNum, {
            chapterNumber: chNum,
            chapterName: ch.chapterName || `Chapter ${chNum}`,
            topicsMap: new Map()
          });
        }
        const chObj = map.get(chNum);
        if (Array.isArray(ch.topics)) {
          ch.topics.forEach(tp => {
            const tName = typeof tp === 'string' ? tp.trim() : (tp.topicName || '').trim();
            if (tName && !chObj.topicsMap.has(tName.toLowerCase())) {
              chObj.topicsMap.set(tName.toLowerCase(), {
                topicName: tName,
                isImportant: Boolean(tp.isImportant),
                mcqCount: 0,
                shortCount: 0,
                longCount: 0
              });
            }
          });
        }
      });
    }

    // 2. Aggregate counts and missing topics directly from Questions
    questions.forEach(q => {
      const chNum = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      const tName = (q.topic || 'General').trim();
      const tKey = tName.toLowerCase();

      if (!map.has(chNum)) {
        map.set(chNum, {
          chapterNumber: chNum,
          chapterName: `Chapter ${chNum}`,
          topicsMap: new Map()
        });
      }
      const chObj = map.get(chNum);

      if (!chObj.topicsMap.has(tKey)) {
        chObj.topicsMap.set(tKey, {
          topicName: tName,
          isImportant: Boolean(q.isImportant),
          mcqCount: 0,
          shortCount: 0,
          longCount: 0
        });
      }
      const topicObj = chObj.topicsMap.get(tKey);
      if (q.isImportant) topicObj.isImportant = true;

      const cat = (q.category || 'MCQ').toUpperCase();
      if (cat === 'MCQ') topicObj.mcqCount++;
      else if (cat === 'SHORT') topicObj.shortCount++;
      else if (cat === 'LONG') topicObj.longCount++;
    });

    return Array.from(map.values())
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map(ch => ({
        ...ch,
        topics: Array.from(ch.topicsMap.values()).sort((a, b) => a.topicName.localeCompare(b.topicName, undefined, { numeric: true, sensitivity: 'base' }))
      }));
  }, [subject, questions]);

  // Compute available topics dropdown options based on selected chapter
  const availableTopics = useMemo(() => {
    const topicSet = new Map();

    chaptersBreakdown.forEach(ch => {
      if (selectedChapterFilter === 'ALL' || Number(selectedChapterFilter) === ch.chapterNumber) {
        ch.topics.forEach(tp => {
          if (!topicSet.has(tp.topicName.toLowerCase())) {
            topicSet.set(tp.topicName.toLowerCase(), tp.topicName);
          }
        });
      }
    });

    return Array.from(topicSet.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [chaptersBreakdown, selectedChapterFilter]);

  // Filtered Questions for Explorer Tab
  const realSubjectTopics = useMemo(() => {
    const topicSet = new Set();
    (questions || []).forEach(q => {
      const t = (q.topic || '').trim();
      if (t && t !== 'General') topicSet.add(t);
    });
    if (Array.isArray(subject?.chaptersConfig)) {
      subject.chaptersConfig.forEach(ch => {
        if (Array.isArray(ch.topics)) {
          ch.topics.forEach(t => {
            const name = typeof t === 'string' ? t : (t?.topicName || t?.name || t?.topic || '');
            if (name && name.trim()) topicSet.add(name.trim());
          });
        }
      });
    }
    return Array.from(topicSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [questions, subject]);

  const maxAvailableChapter = useMemo(() => {
    let maxCh = subject?.totalChapters || 45;
    (questions || []).forEach(q => {
      const ch = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      if (ch > maxCh) maxCh = ch;
    });
    return Math.max(maxCh, 1);
  }, [questions, subject]);

  const topicsForSelectedChapter = useMemo(() => {
    const topicSet = new Set();
    const chNum = Number(singleQuestion?.chapter) || 1;

    (questions || []).forEach(q => {
      const qCh = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      if (qCh === chNum) {
        const t = (q.topic || '').trim();
        if (t && t !== 'General') topicSet.add(t);
      }
    });

    if (Array.isArray(subject?.chaptersConfig)) {
      const configCh = subject.chaptersConfig.find(c => (c.chapterNumber || c.chapter) === chNum);
      if (configCh && Array.isArray(configCh.topics)) {
        configCh.topics.forEach(t => {
          const name = typeof t === 'string' ? t : (t?.topicName || t?.name || t?.topic || '');
          if (name && name.trim()) topicSet.add(name.trim());
        });
      }
    }

    return Array.from(topicSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [questions, subject, singleQuestion?.chapter]);

  // Dynamic list of category counts
  const categoryCounts = useMemo(() => {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    let mcq = 0, short = 0, long = 0;
    safeQuestions.forEach(q => {
      const cat = (q.category || 'MCQ').toUpperCase();
      if (cat === 'MCQ') mcq++;
      else if (cat === 'SHORT') short++;
      else if (cat === 'LONG') long++;
    });
    return { ALL: safeQuestions.length, MCQ: mcq, SHORT: short, LONG: long };
  }, [questions]);

  // Upgraded Filtered Questions for Explorer Tab
  const filteredQuestions = useMemo(() => {
    const safeQuestions = Array.isArray(questions) ? questions : [];
    return safeQuestions.filter((q) => {
      // 1. Category Filter
      if (questionCategoryFilter !== 'ALL' && (q.category || 'MCQ').toUpperCase() !== questionCategoryFilter) {
        return false;
      }

      // 2. Single Chapter Filter
      const qCh = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      if (selectedChapterFilter !== 'ALL' && qCh !== Number(selectedChapterFilter)) {
        return false;
      }

      // 3. Chapter Range Filter (Min - Max)
      if (chapterRangeMin !== 'ALL' && qCh < Number(chapterRangeMin)) return false;
      if (chapterRangeMax !== 'ALL' && qCh > Number(chapterRangeMax)) return false;

      // 4. Topic Filter
      if (selectedTopicFilter !== 'ALL') {
        const qTopic = (q.topic || 'General').trim().toLowerCase();
        const selTopic = selectedTopicFilter.trim().toLowerCase();
        const cleanQ = qTopic.replace(/^[0-9.]+\s*/, '');
        const cleanSel = selTopic.replace(/^[0-9.]+\s*/, '');

        const isMatch = qTopic === selTopic ||
          (cleanQ.length > 2 && cleanSel.length > 2 && (qTopic.includes(cleanSel) || selTopic.includes(cleanQ)));
        if (!isMatch) return false;
      }

      // 5. Difficulty Filter
      if (difficultyFilter !== 'ALL' && (q.difficulty || 'Medium').toLowerCase() !== difficultyFilter.toLowerCase()) {
        return false;
      }

      // 6. Attribute Flags Filter
      if (attributeFilter === 'Starred' && !q.isStarred) return false;
      if (attributeFilter === 'Repeated' && !q.isRepeated) return false;
      if (attributeFilter === 'Important' && !q.isImportant) return false;
      if (attributeFilter === 'Conceptual' && !q.isConceptual) return false;

      // 7. Advanced Upgraded Search Query across all fields
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const textMatch = q.questionText?.toLowerCase().includes(query);
        const expMatch = q.explanation?.toLowerCase().includes(query);
        const solMatch = q.solution?.toLowerCase().includes(query);
        const topicMatch = q.topic?.toLowerCase().includes(query);
        const codeMatch = q.codeSnippet?.toLowerCase().includes(query);
        const optMatch = Array.isArray(q.options) && q.options.some((opt) => String(opt).toLowerCase().includes(query));

        if (!textMatch && !expMatch && !solMatch && !topicMatch && !codeMatch && !optMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    questions,
    questionCategoryFilter,
    selectedChapterFilter,
    chapterRangeMin,
    chapterRangeMax,
    selectedTopicFilter,
    difficultyFilter,
    attributeFilter,
    searchQuery
  ]);

  // Sorted questions
  const sortedQuestions = useMemo(() => {
    const qs = [...filteredQuestions];
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    const catOrder = { MCQ: 0, SHORT: 1, LONG: 2 };
    switch (sortBy) {
      case 'chapter_asc':
        return qs.sort((a, b) => (parseInt(a.chapter) || 1) - (parseInt(b.chapter) || 1));
      case 'chapter_desc':
        return qs.sort((a, b) => (parseInt(b.chapter) || 1) - (parseInt(a.chapter) || 1));
      case 'topic_az':
        return qs.sort((a, b) => (a.topic || 'General').localeCompare(b.topic || 'General', undefined, { numeric: true, sensitivity: 'base' }));
      case 'difficulty_asc':
        return qs.sort((a, b) => (diffOrder[(a.difficulty || 'medium').toLowerCase()] ?? 1) - (diffOrder[(b.difficulty || 'medium').toLowerCase()] ?? 1));
      case 'difficulty_desc':
        return qs.sort((a, b) => (diffOrder[(b.difficulty || 'medium').toLowerCase()] ?? 1) - (diffOrder[(a.difficulty || 'medium').toLowerCase()] ?? 1));
      case 'category':
        return qs.sort((a, b) => (catOrder[(a.category || 'MCQ').toUpperCase()] ?? 0) - (catOrder[(b.category || 'MCQ').toUpperCase()] ?? 0));
      default:
        return qs;
    }
  }, [filteredQuestions, sortBy]);

  // Grouped questions
  const groupedQuestions = useMemo(() => {
    if (groupBy === 'chapter') {
      const map = new Map();
      sortedQuestions.forEach((q) => {
        const ch = parseInt(q.chapter) || 1;
        const chName = chaptersBreakdown.find(c => c.chapterNumber === ch)?.chapterName || `Chapter ${ch}`;
        const key = `Ch ${ch}: ${chName}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(q);
      });
      return Array.from(map.entries()).sort((a, b) => {
        const numA = parseInt(a[0].match(/\d+/)?.[0] || '0');
        const numB = parseInt(b[0].match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    }
    if (groupBy === 'topic') {
      const map = new Map();
      sortedQuestions.forEach((q) => {
        const key = (q.topic || 'General').trim();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(q);
      });
      return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }));
    }
    return null;
  }, [sortedQuestions, groupBy, chaptersBreakdown]);

  const toggleGroup = (key) => {
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Live stats derived from filteredQuestions
  const filterStats = useMemo(() => {
    const chapters = new Set();
    const topics = new Set();
    let mcq = 0, short = 0, long = 0;
    filteredQuestions.forEach(q => {
      chapters.add(parseInt(q.chapter) || 1);
      topics.add((q.topic || 'General').trim());
      const cat = (q.category || 'MCQ').toUpperCase();
      if (cat === 'MCQ') mcq++;
      else if (cat === 'SHORT') short++;
      else if (cat === 'LONG') long++;
    });
    return { chapters: chapters.size, topics: topics.size, mcq, short, long, total: filteredQuestions.length };
  }, [filteredQuestions]);

  const handleResetFilters = () => {
    setQuestionCategoryFilter('ALL');
    setSelectedChapterFilter('ALL');
    setChapterRangeMin('ALL');
    setChapterRangeMax('ALL');
    setSelectedTopicFilter('ALL');
    setDifficultyFilter('ALL');
    setAttributeFilter('ALL');
    setSearchQuery('');
    setSortBy('default');
    setGroupBy('none');
    setCollapsedGroups({});
    setShowAllAnswers(false);
    setShowAllExplanations(false);
  };

  const toggleRevealAnswer = (id) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRevealExplanation = (id) => {
    setRevealedExplanations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Admin question card renderer (reused in flat & grouped views)
  const renderAdminQuestionCard = (q, idx) => {
    const isMcq = q.category === 'MCQ';
    const isAnsRevealed = showAllAnswers || Boolean(revealedAnswers[q.id]);
    const isExpRevealed = showAllExplanations || Boolean(revealedExplanations[q.id]);
    return (
      <div
        key={q.id || idx}
        className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm space-y-4"
      >
        {/* Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-blue-950/60 text-blue-400 border border-blue-900/60 rounded-lg font-bold">
              {q.category || 'MCQ'}
            </span>
            <span>Chapter {q.chapter || 1}</span>
            <span>&bull;</span>
            <span className="text-slate-300">{q.topic || 'General'}</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              q.status === 'published' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
              : q.status === 'draft' ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800'
              : q.status === 'disabled' ? 'bg-red-950/60 text-red-400 border-red-800'
              : q.status === 'archived' ? 'bg-slate-800 text-slate-400 border-slate-700'
              : 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
            }`}>
              {q.status || 'published'}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${q.isImportant ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-800/50 text-slate-600 border-slate-800'}`}>
              Important
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${q.isStarred ? 'bg-yellow-950 text-yellow-400 border-yellow-800' : 'bg-slate-800/50 text-slate-600 border-slate-800'}`}>
              ⭐ Starred
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${q.isRepeated ? 'bg-blue-950 text-blue-400 border-blue-800' : 'bg-slate-800/50 text-slate-600 border-slate-800'}`}>
              Repeated
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${q.isConceptual ? 'bg-purple-950 text-purple-400 border-purple-800' : 'bg-slate-800/50 text-slate-600 border-slate-800'}`}>
              Conceptual
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
              {q.difficulty || 'Medium'}
            </span>
            <button
              onClick={() => handleEditQuestion(q)}
              className="p-1.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-400 rounded-lg border border-blue-900/60 transition-colors cursor-pointer"
              title="Edit Question"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setConfirmationModal({
                  isOpen: true,
                  title: 'Delete Question',
                  message: 'Are you sure you want to delete this question?',
                  onConfirm: () => {
                    handleDeleteQuestion(q.id || q._id);
                    setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                  }
                });
              }}
              className="p-1.5 bg-red-950/60 hover:bg-red-900/60 text-red-400 rounded-lg border border-red-900/60 transition-colors cursor-pointer"
              title="Delete Question"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Question Statement */}
        <h4 className="text-base font-bold text-white leading-relaxed">
          {q.questionText}
        </h4>

        {/* Question Image */}
        {q.imageBase64 && (
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <img
              src={q.imageBase64.startsWith('data:') ? q.imageBase64 : `data:image/png;base64,${q.imageBase64}`}
              alt="Question Image"
              className="max-h-48 object-contain mx-auto"
            />
          </div>
        )}

        {/* Additional Images */}
        {q.imagesBase64?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {q.imagesBase64.map((img, imgIdx) => (
              <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-800">
                <img
                  src={img.startsWith('data:') ? img : `data:image/png;base64,${img}`}
                  alt={`Image ${imgIdx + 1}`}
                  className="h-20 w-20 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Code Snippet Block */}
        {q.codeSnippet && (
          <CodeBlock
            code={q.codeSnippet}
            language={q.codeLanguage || q.codeSnippetLanguage || q.language || 'cpp'}
            title="Question Code Snippet"
          />
        )}

        {/* Options (MCQ) */}
        {isMcq && Array.isArray(q.options) && q.options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
            {q.options.map((opt, optIdx) => {
              const isCorrect = optIdx === q.correctOption;
              return (
                <div
                  key={optIdx}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="w-5 h-5 inline-flex items-center justify-center rounded-md bg-slate-800 text-slate-400 mr-2 text-[10px]">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Solution / Key Points Text */}
        {q.solution && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs space-y-1">
            <span className="font-bold block text-emerald-400 uppercase tracking-wider text-[10px]">Ideal Solution / Key Points</span>
            <p className="leading-relaxed">{q.solution}</p>
          </div>
        )}

        {/* Solution Code Block */}
        {q.solutionCode && (
          <CodeBlock
            code={q.solutionCode}
            language={q.solutionCodeLanguage || q.solutionLanguage || 'cpp'}
            title="Code Implementation Solution"
          />
        )}

        {/* Explanation */}
        {q.explanation && (
          <div className="p-4 sm:p-5 bg-indigo-950/50 border border-indigo-800/80 rounded-2xl text-indigo-100 space-y-1.5 shadow-sm">
            <span className="font-extrabold block text-indigo-300 uppercase tracking-wider text-xs">Detailed Explanation</span>
            <p className="leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap">{q.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  // Delete a single question
  const handleDeleteQuestion = async (questionId) => {
    const loadingToast = toast.loading('Deleting question...');
    try {
      await api.delete(`/questions/${questionId}`);
      toast.dismiss(loadingToast);
      toast.success('Question deleted successfully!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete: ' + err.message);
    }
  };

  // Edit a question — pre-fill modal
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id || q._id);
    setSingleQuestion({
      category: q.category || 'MCQ',
      questionText: q.questionText || '',
      questionTextUrdu: q.questionTextUrdu || '',
      options: q.options && q.options.length === 4 ? q.options : ['', '', '', ''],
      optionsUrdu: q.optionsUrdu && q.optionsUrdu.length === 4 ? q.optionsUrdu : ['', '', '', ''],
      correctOption: q.correctOption !== undefined ? q.correctOption : 0,
      explanation: q.explanation || '',
      explanationUrdu: q.explanationUrdu || '',
      solution: q.solution || '',
      solutionUrdu: q.solutionUrdu || '',
      chapter: q.chapter || q.chapterNumber || 1,
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'Medium',
      codeSnippet: q.codeSnippet || '',
      codeLanguage: q.codeLanguage || 'cpp',
      solutionCode: q.solutionCode || '',
      solutionCodeLanguage: q.solutionCodeLanguage || 'cpp',
      status: q.status || 'published',
      imageBase64: q.imageBase64 || '',
      imagesBase64: q.imagesBase64 || [],
      isStarred: q.isStarred || false,
      isImportant: q.isImportant || false,
      isRepeated: q.isRepeated || false,
      isConceptual: q.isConceptual || false
    });
    setIsAddSingleQuestionOpen(true);
  };



  const handleAddSingleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!singleQuestion.questionText.trim()) {
      toast.error("Question text is required.");
      return;
    }
    const realCode = subject?.code || (params?.code && params.code.length < 10 ? params.code : null);
    const targetSubId = subject?.id || subject?._id || subjectId;

    const loadingToast = toast.loading("Saving new question...");
    try {
      const payload = {
        ...singleQuestion,
        subjectCode: realCode ? String(realCode).toUpperCase() : '',
        chapter: parseInt(singleQuestion.chapter, 10) || 1,
        chapterNumber: parseInt(singleQuestion.chapter, 10) || 1,
        hasCode: Boolean(singleQuestion.codeSnippet || singleQuestion.solutionCode),
        status: singleQuestion.status || 'published',
        imageBase64: singleQuestion.imageBase64 || '',
        imagesBase64: singleQuestion.imagesBase64 || []
      };

      if (editingQuestionId) {
        // Update existing question
        await api.put(`/questions/${editingQuestionId}`, payload);
        toast.dismiss(loadingToast);
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
      } else {
        // Create new question
        await api.post('/questions', payload);
        toast.dismiss(loadingToast);
        toast.success('Question created successfully!');
      }
      setIsAddSingleQuestionOpen(false);
      setSingleQuestion({
        category: 'MCQ',
        questionText: '',
        questionTextUrdu: '',
        options: ['', '', '', ''],
        optionsUrdu: ['', '', '', ''],
        correctOption: 0,
        explanation: '',
        explanationUrdu: '',
        solution: '',
        solutionUrdu: '',
        chapter: 1,
        topic: 'General',
        difficulty: 'Medium',
        codeSnippet: '',
        codeLanguage: 'cpp',
        solutionCode: '',
        solutionCodeLanguage: 'cpp',
        status: 'published',
        imageBase64: '',
        imagesBase64: [],
        isStarred: false,
        isImportant: false,
        isRepeated: false,
        isConceptual: false
      });
      setEditingQuestionId(null);
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to create question: " + err.message);
    }
  };

  // Import / Export States
  const [isImportQuestionsOpen, setIsImportQuestionsOpen] = useState(false);
  const [questionsJsonText, setQuestionsJsonText] = useState('');
  const [isImportSubjectOpen, setIsImportSubjectOpen] = useState(false);
  const [subjectJsonText, setSubjectJsonText] = useState('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  // 1. EXPORT BULK QUESTIONS
  const handleExportBulkQuestions = () => {
    try {
      const safeQuestions = Array.isArray(questions) ? questions : [];
      if (safeQuestions.length === 0) {
        toast.error("No questions available to export for this subject.");
        return;
      }
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(safeQuestions, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const codeSanitized = (subject?.code || 'subject').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadAnchor.setAttribute('download', `${codeSanitized}_bulk_questions_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exported ${safeQuestions.length} questions for ${subject?.code || 'subject'}`);
    } catch (err) {
      toast.error("Export Questions Failed: " + err.message);
    }
  };

  // 2. EXPORT SUBJECT DATA
  const handleExportSubjectData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        subject,
        quizzes: sets,
        questions: questions
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      const codeSanitized = (subject?.code || 'subject').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      downloadAnchor.setAttribute('download', `${codeSanitized}_full_subject_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success(`Exported full subject package for ${subject?.code || 'subject'}`);
    } catch (err) {
      toast.error("Export Subject Failed: " + err.message);
    }
  };

  // 3. SUBMIT IMPORT BULK QUESTIONS
  const handleImportQuestionsSubmit = async (e) => {
    e.preventDefault();
    if (!questionsJsonText.trim()) return;
    setIsProcessingImport(true);
    const loadingToast = toast.loading(`Importing questions into ${subject?.code || 'subject'}...`);
    try {
      let parsed = JSON.parse(questionsJsonText);
      
      // Auto-extract questions array if user uploads or pastes a full export JSON object
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (Array.isArray(parsed.questions)) {
          parsed = parsed.questions;
        } else if (Array.isArray(parsed.data)) {
          parsed = parsed.data;
        }
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("Invalid format: JSON must be an array of questions or contain a 'questions' array.");
        return;
      }

      await api.post('/questions/bulk', {
        subjectCode: String(subject?.code || code).toUpperCase(),
        questions: parsed
      });

      toast.dismiss(loadingToast);
      toast.success(`Successfully imported ${parsed.length} questions into ${subject?.code || 'subject'}!`);
      setIsImportQuestionsOpen(false);
      setQuestionsJsonText('');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Import Questions Failed: " + err.message);
    } finally {
      setIsProcessingImport(false);
    }
  };

  // 4. SUBMIT IMPORT SUBJECT DATA
  const handleImportSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectJsonText.trim()) return;
    setIsProcessingImport(true);
    const loadingToast = toast.loading(`Importing subject package for ${subject?.code || 'subject'}...`);
    try {
      const parsed = JSON.parse(subjectJsonText);
      await api.post('/subjects/import', parsed);
      toast.dismiss(loadingToast);
      toast.success(`Successfully imported subject data for ${subject?.code || 'subject'}!`);
      setIsImportSubjectOpen(false);
      setSubjectJsonText('');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Import Subject Failed: " + err.message);
    } finally {
      setIsProcessingImport(false);
    }
  };

  // 5. SAVE OVERVIEW STUDY GUIDE TEXT
  const handleSaveOverview = async () => {
    const loadingToast = toast.loading('Saving study guide overview...');
    try {
      await api.put(`/subjects/${subject?.code || subjectId}`, {
        overviewText: overviewTextEdit
      });
      toast.dismiss(loadingToast);
      toast.success('Study guide overview saved successfully!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to save overview: ' + err.message);
    }
  };

  // 6. ADD & DELETE FAQ
  const handleAddFaqSubmit = async (e) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    const loadingToast = toast.loading('Adding FAQ...');
    try {
      const updatedFaqs = [...(subject?.faqs || []), newFaq];
      await api.put(`/subjects/${subject?.code || subjectId}`, { faqs: updatedFaqs });
      toast.dismiss(loadingToast);
      toast.success('FAQ added successfully!');
      setIsAddFaqOpen(false);
      setNewFaq({ question: '', answer: '' });
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to add FAQ: ' + err.message);
    }
  };

  const handleDeleteFaq = async (faqIndex) => {
    const loadingToast = toast.loading('Deleting FAQ...');
    try {
      const updatedFaqs = (subject?.faqs || []).filter((_, idx) => idx !== faqIndex);
      await api.put(`/subjects/${subject?.code || subjectId}`, { faqs: updatedFaqs });
      toast.dismiss(loadingToast);
      toast.success('FAQ deleted!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete FAQ: ' + err.message);
    }
  };

  // 7. ADD & DELETE HANDOUT / NOTE
  const handleAddNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;
    const loadingToast = toast.loading('Adding note / handout...');
    try {
      const updatedNotes = [...(subject?.notes || []), newNote];
      await api.put(`/subjects/${subject?.code || subjectId}`, { notes: updatedNotes });
      toast.dismiss(loadingToast);
      toast.success('Note / Handout added successfully!');
      setIsAddNoteOpen(false);
      setNewNote({ title: '', category: 'Handouts', fileUrl: '', description: '' });
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to add note: ' + err.message);
    }
  };

  const handleDeleteNote = async (noteIndex) => {
    const loadingToast = toast.loading('Deleting note...');
    try {
      const updatedNotes = (subject?.notes || []).filter((_, idx) => idx !== noteIndex);
      await api.put(`/subjects/${subject?.code || subjectId}`, { notes: updatedNotes });
      toast.dismiss(loadingToast);
      toast.success('Note deleted!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete note: ' + err.message);
    }
  };

  // 8. ADD & DELETE PAST PAPER LINK
  const handleAddPaperSubmit = async (e) => {
    e.preventDefault();
    if (!newPaper.title.trim()) return;
    const loadingToast = toast.loading('Adding past paper link...');
    try {
      const updatedPapers = [...(subject?.pastPaperLinks || []), newPaper];
      await api.put(`/subjects/${subject?.code || subjectId}`, { pastPaperLinks: updatedPapers });
      toast.dismiss(loadingToast);
      toast.success('Past paper link added successfully!');
      setIsAddPaperOpen(false);
      setNewPaper({ title: '', url: '', year: '2025', term: 'Finalterm' });
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to add past paper: ' + err.message);
    }
  };

  const handleDeletePaper = async (paperIndex) => {
    const loadingToast = toast.loading('Deleting past paper...');
    try {
      const updatedPapers = (subject?.pastPaperLinks || []).filter((_, idx) => idx !== paperIndex);
      await api.put(`/subjects/${subject?.code || subjectId}`, { pastPaperLinks: updatedPapers });
      toast.dismiss(loadingToast);
      toast.success('Past paper link deleted!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete past paper: ' + err.message);
    }
  };

  // 9. ADD & DELETE VIDEO LECTURE
  const handleAddVideoSubmit = async (e) => {
    e.preventDefault();
    if (!newVideo.title.trim()) return;
    const loadingToast = toast.loading('Adding video lecture...');
    try {
      const updatedVideos = [...(subject?.videoLectures || []), newVideo];
      await api.put(`/subjects/${subject?.code || subjectId}`, { videoLectures: updatedVideos });
      toast.dismiss(loadingToast);
      toast.success('Video lecture added successfully!');
      setIsAddVideoOpen(false);
      setNewVideo({ title: '', youtubeUrl: '', duration: '15 mins', topic: 'General' });
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to add video lecture: ' + err.message);
    }
  };

  const handleDeleteVideo = async (videoIndex) => {
    const loadingToast = toast.loading('Deleting video lecture...');
    try {
      const updatedVideos = (subject?.videoLectures || []).filter((_, idx) => idx !== videoIndex);
      await api.put(`/subjects/${subject?.code || subjectId}`, { videoLectures: updatedVideos });
      toast.dismiss(loadingToast);
      toast.success('Video lecture deleted!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete video lecture: ' + err.message);
    }
  };

  // 10. DUPLICATE QUESTION
  const handleDuplicateQuestion = async (q) => {
    const loadingToast = toast.loading('Duplicating question...');
    try {
      const copy = {
        ...q,
        _id: undefined,
        id: undefined,
        questionText: q.questionText + ' (Copy)',
        subjectCode: String(subject?.code || params?.code).toUpperCase()
      };
      await api.post('/questions', copy);
      toast.dismiss(loadingToast);
      toast.success('Question duplicated successfully!');
      fetchData();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to duplicate question: ' + err.message);
    }
  };

  const handleOpenModal = (categoryKey) => {
    setEditSetId(null);
    setNewSet({
      title: '',
      description: '',
      category: categoryKey || 'MCQ',
      quizType: 'CHAPTER_QUIZ',
      chaptersInput: '',
      topicsInput: '',
      timeLimitMinutes: 15,
      status: 'published',
      isActive: true,
      isFullCourse: false
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (module) => {
    setEditSetId(module.id || module._id);
    setNewSet({
      title: module.title || '',
      description: module.description || '',
      category: module.category || 'MCQ',
      quizType: module.quizType || 'CHAPTER_QUIZ',
      chaptersInput: Array.isArray(module.chapters) ? module.chapters.join(', ') : '',
      topicsInput: Array.isArray(module.topics) ? module.topics.join(', ') : '',
      timeLimitMinutes: module.timeLimitMinutes != null ? module.timeLimitMinutes : 15,
      status: module.status || 'published',
      isActive: module.isActive !== undefined ? module.isActive : true,
      isFullCourse: Boolean(module.isFullCourse || module.quizType === 'FULL_SUBJECT')
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = async (module, newStatus) => {
    const isAct = newStatus !== 'disabled' && newStatus !== 'Draft';
    try {
      await api.put(`/quizzes/${module.id}`, {
        ...module,
        status: newStatus,
        isActive: isAct
      });
      setSets((prev) =>
        prev.map((s) => (s.id === module.id ? { ...s, status: newStatus, isActive: isAct } : s))
      );
    } catch (error) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!newSet.title.trim()) {
      toast.error('Module Title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse chapters comma-separated input into array of numbers
      const parsedChapters = newSet.chaptersInput
        ? newSet.chaptersInput.split(',').map(ch => parseInt(ch.trim(), 10)).filter(ch => !isNaN(ch))
        : [];

      // Parse topics comma-separated input into array of strings
      const parsedTopics = newSet.topicsInput
        ? newSet.topicsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : [];

      const realSubjectId = subject?.id || subject?._id || subjectId;
      const realCode = subject?.code || (params?.code && params.code.length < 10 ? params.code : null);

      const payload = {
        subjectId: realSubjectId,
        subjectCode: realCode ? String(realCode).toUpperCase() : '',
        title: newSet.title.trim(),
        description: newSet.description.trim(),
        category: newSet.category,
        quizType: newSet.quizType,
        chapters: parsedChapters,
        topics: parsedTopics,
        timeLimitMinutes: Number(newSet.timeLimitMinutes) || 15,
        status: newSet.status,
        isActive: newSet.status !== 'disabled',
        isFullCourse: Boolean(newSet.isFullCourse)
      };

      if (editSetId) {
        await api.put(`/quizzes/${editSetId}`, payload);
        toast.success('Quiz Module updated successfully!');
      } else {
        await api.post('/quizzes', payload);
        toast.success('New Quiz Module created successfully!');
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save module: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = (id) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Module',
      message: 'Are you sure you want to delete this module? This action deletes the quiz configuration.',
      onConfirm: async () => {
        try {
          await api.delete(`/quizzes/${id}`);
          await fetchData();
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          toast.success('Module deleted successfully!');
        } catch (error) {
          toast.error("Failed to delete module: " + error.message);
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const renderSection = (categoryTitle, categoryKey) => {
    const filteredSets = sets.filter((s) => s.category === categoryKey);

    return (
      <div className="mb-12">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <LayoutList className="w-5 h-5 mr-2 text-blue-400" />
            {categoryTitle}
          </h2>
          <button
            onClick={() => handleOpenModal(categoryKey)}
            className="flex items-center px-4 py-2 bg-blue-950/60 hover:bg-blue-900 text-blue-400 font-bold rounded-xl transition-colors text-xs cursor-pointer border border-blue-900"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Module
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <div key={set.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-950/60 text-indigo-400 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={set.status || 'active'}
                      onChange={(e) => handleStatusChange(set, e.target.value)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleEditClick(set)}
                      className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteModule(set.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-white mb-1">{set.title}</h3>
                <p className="text-xs font-semibold text-slate-400 mb-4 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  {set.questionCount || 0} Questions
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Link href={`/admin/quizzes/${set.id}`} className="text-blue-400 text-sm font-bold hover:underline flex items-center justify-between w-full">
                  <span>Manage Questions</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ))}

          {filteredSets.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-400 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
              No {categoryTitle} modules found. Click "Add Module" to create one.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />
      <div className="mb-4">
        <Link href="/admin/subjects" className="text-slate-400 hover:text-white flex items-center text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Subjects
        </Link>
      </div>

      {error ? (
        <div className="bg-red-950/40 text-red-300 p-4 rounded-xl border border-red-900/40 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-blue-950 text-blue-400 border border-blue-900 rounded-md text-xs font-bold uppercase tracking-wider mb-2">
                {subject?.code}
              </div>
              <h1 className="text-3xl font-extrabold text-white">{subject?.name}</h1>
              <p className="text-slate-400 text-xs mt-1">Manage course modules, chapter breakdown, and full question bank.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddSingleQuestionOpen(true)}
                className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all shadow-md"
                title="Add a single question manually to this subject"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Add Question</span>
              </button>

              <button
                onClick={() => setIsImportQuestionsOpen(true)}
                className="flex items-center px-3.5 py-2 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
                title="Bulk import question JSON array directly to this subject"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                <span>Import Bulk Questions</span>
              </button>

              <button
                onClick={handleExportBulkQuestions}
                className="flex items-center px-3.5 py-2 bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
                title="Export all questions for this subject as JSON"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export Bulk Questions</span>
              </button>

              <button
                onClick={() => setIsImportSubjectOpen(true)}
                className="flex items-center px-3.5 py-2 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/80 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
                title="Import full subject JSON package (subject, quizzes, questions)"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                <span>Import Subject Data</span>
              </button>

              <button
                onClick={handleExportSubjectData}
                className="flex items-center px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-xl font-bold text-xs cursor-pointer transition-all shadow-sm"
                title="Export complete subject JSON package"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export Subject Data</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation Bar */}
          <div className="flex border-b border-slate-800 mb-8 space-x-2 md:space-x-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('modules')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>Practice &amp; Modules ({sets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('syllabus')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'syllabus'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>Chapters &amp; Topics Outline ({chaptersBreakdown.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'questions'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Question Explorer ({questions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Study Guide &amp; FAQs ({subject?.faqs?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes &amp; Past Papers ({(subject?.notes?.length || 0) + (subject?.pastPaperLinks?.length || 0)})</span>
            </button>

            <button
              onClick={() => setActiveTab('videos')}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Lectures ({subject?.videoLectures?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: QUIZ MODULES */}
          {activeTab === 'modules' && (
            <div>
              {renderSection("Quizzes (MCQs)", "MCQ")}
              {renderSection("Short Questions", "SHORT")}
              {renderSection("Long Questions", "LONG")}
            </div>
          )}

          {/* TAB 2: CHAPTERS & TOPICS OUTLINE */}
          {activeTab === 'syllabus' && (
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <p>
                  Browse chapters and topic breakdown below. Topics marked with <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold"><Star className="w-3 h-3 mr-1 fill-amber-400" /> Important</span> are flagged for exams. Click any chapter title or topic card to view questions in the explorer.
                </p>
              </div>

              {chaptersBreakdown.length === 0 ? (
                <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800">
                  <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">No Chapter Data Available</h3>
                  <p className="text-xs text-slate-400">Chapters and topics will populate once questions or subject chapter configs are loaded.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {chaptersBreakdown.map((ch) => {
                    const totalChapterQs = ch.topics.reduce((acc, t) => acc + t.mcqCount + t.shortCount + t.longCount, 0);

                    return (
                      <div
                        key={ch.chapterNumber}
                        className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm hover:border-blue-500/50 transition-all"
                      >
                        <div
                          onClick={() => {
                            setSelectedChapterFilter(String(ch.chapterNumber));
                            setSelectedTopicFilter('ALL');
                            setActiveTab('questions');
                          }}
                          className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4 cursor-pointer group/chHeader"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md group-hover/chHeader:bg-blue-500 transition-colors">
                              Ch {ch.chapterNumber}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-lg text-white group-hover/chHeader:text-blue-400 transition-colors">
                                {ch.chapterName}
                              </h3>
                              <p className="text-xs text-slate-400">
                                {ch.topics.length} Topics Listed &bull; {totalChapterQs} Questions Total
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="px-4 py-2 bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 font-bold text-xs rounded-xl border border-blue-900 transition-colors flex items-center space-x-1.5 cursor-pointer group-hover/chHeader:border-blue-500"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>View All Chapter Qs</span>
                          </button>
                        </div>

                        {/* Topics List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ch.topics.map((tp, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedChapterFilter(String(ch.chapterNumber));
                                setSelectedTopicFilter(tp.topicName);
                                setActiveTab('questions');
                              }}
                              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] ${
                                tp.isImportant
                                  ? 'bg-amber-950/20 border-amber-700/50 text-amber-200 shadow-xs hover:border-amber-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-500'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="font-bold text-xs leading-snug line-clamp-2">
                                  {tp.topicName}
                                </span>

                                {tp.isImportant && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                                    <Star className="w-3 h-3 mr-1 fill-amber-400" />
                                    Important
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-800">
                                {tp.mcqCount > 0 && <span className="text-blue-400">{tp.mcqCount} MCQs</span>}
                                {tp.shortCount > 0 && <span className="text-purple-400">{tp.shortCount} Short</span>}
                                {tp.longCount > 0 && <span className="text-amber-400">{tp.longCount} Long</span>}
                                {tp.mcqCount === 0 && tp.shortCount === 0 && tp.longCount === 0 && (
                                  <span className="text-slate-500 italic">Syllabus Topic</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDY GUIDE & FAQS */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Study Guide Overview Text Editor */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <span>Edit Course Study Guide Overview</span>
                  </h3>
                  <button
                    onClick={handleSaveOverview}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Overview Text</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={overviewTextEdit}
                  onChange={(e) => setOverviewTextEdit(e.target.value)}
                  placeholder="Enter detailed course overview, study guide notes, exam pattern details..."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Course FAQs Accordion */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    <span>Frequently Asked Exam Questions (FAQs)</span>
                  </h3>
                  <button
                    onClick={() => setIsAddFaqOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add FAQ</span>
                  </button>
                </div>

                {(subject?.faqs || []).length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800">
                    No FAQs added yet. Click "Add FAQ" above to add one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(subject?.faqs || []).map((faq, index) => (
                      <div key={index} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                        <div className="p-4 flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-bold text-xs text-white">{faq.question}</h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">{faq.answer}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteFaq(index)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                            title="Delete FAQ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTES & PAST PAPERS */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Handouts & Summary Notes */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Handouts &amp; Summary Notes</span>
                  </h3>
                  <button
                    onClick={() => setIsAddNoteOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Note / Handout</span>
                  </button>
                </div>

                {(subject?.notes || []).length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800">
                    No notes uploaded yet. Click "Add Note / Handout" to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(subject?.notes || []).map((note, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-xs text-white">{note.title}</h4>
                          <p className="text-[10px] text-slate-400">{note.category || 'Handouts'} &bull; {note.description || 'PDF Document'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {note.fileUrl && (
                            <a
                              href={note.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-blue-950 text-blue-400 text-xs font-bold rounded-lg border border-blue-900 flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> View
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteNote(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solved Past Papers Links */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-400" />
                    <span>Solved Past Papers Links</span>
                  </h3>
                  <button
                    onClick={() => setIsAddPaperOpen(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Past Paper Link</span>
                  </button>
                </div>

                {(subject?.pastPaperLinks || []).length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800">
                    No past papers linked yet. Click "Add Past Paper Link" to add one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(subject?.pastPaperLinks || []).map((paper, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-xs text-white">{paper.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-900">
                            {paper.term || 'Midterm'} {paper.year || '2025'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-emerald-950 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-900 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View
                            </a>
                          )}
                          <button
                            onClick={() => handleDeletePaper(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: VIDEO LECTURES */}
          {activeTab === 'videos' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-500" />
                  <span>YouTube Video Tutorials &amp; Lectures</span>
                </h3>
                <button
                  onClick={() => setIsAddVideoOpen(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Video Lecture</span>
                </button>
              </div>

              {(subject?.videoLectures || []).length === 0 ? (
                <div className="text-xs text-slate-500 py-10 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800">
                  No video lectures linked yet. Click "Add Video Lecture" to add one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(subject?.videoLectures || []).map((vid, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>{vid.topic || 'General'}</span>
                        <span className="text-rose-400">{vid.duration || 'Video'}</span>
                      </div>
                      <h4 className="font-bold text-xs text-white">{vid.title}</h4>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        {vid.youtubeUrl && (
                          <a
                            href={vid.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-rose-950 text-rose-300 text-xs font-bold rounded-lg border border-rose-900 flex items-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5" /> Watch Video
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteVideo(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: QUESTION BANK EXPLORER */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-400" />
                    <span>Advanced Question Bank Explorer</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage full question bank. Filter by chapters, ranges, topics, difficulty, tags, and category types.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 bg-blue-950/60 text-blue-300 font-extrabold text-xs rounded-xl border border-blue-900">
                    Showing {filteredQuestions.length} of {questions.length} Questions
                  </span>
                  {(questionCategoryFilter !== 'ALL' || selectedChapterFilter !== 'ALL' || chapterRangeMin !== 'ALL' || chapterRangeMax !== 'ALL' || selectedTopicFilter !== 'ALL' || difficultyFilter !== 'ALL' || attributeFilter !== 'ALL' || searchQuery.trim()) && (
                    <button
                      onClick={handleResetFilters}
                      className="px-3 py-1.5 bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 font-bold text-xs rounded-xl border border-rose-900 transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filter Toolbar */}
              <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
                {/* Row 1: Upgraded Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search statements, options, explanations, code snippets, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white font-bold text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Row 2: Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="text-slate-400 mr-1 shrink-0">Type:</span>
                  {[
                    { key: 'ALL', label: `All (${categoryCounts.ALL})` },
                    { key: 'MCQ', label: `Quizzes / MCQs (${categoryCounts.MCQ})` },
                    { key: 'SHORT', label: `Short Questions (${categoryCounts.SHORT})` },
                    { key: 'LONG', label: `Long Questions (${categoryCounts.LONG})` }
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setQuestionCategoryFilter(item.key)}
                      className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        questionCategoryFilter === item.key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-blue-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Row 3: Dropdowns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs font-bold">
                  {/* 1. Chapter Selection */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Chapter:</label>
                    <select
                      value={selectedChapterFilter}
                      onChange={(e) => {
                        setSelectedChapterFilter(e.target.value);
                        setSelectedTopicFilter('ALL');
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer"
                    >
                      <option value="ALL">All Chapters</option>
                      {chaptersBreakdown.map((ch) => (
                        <option key={ch.chapterNumber} value={ch.chapterNumber}>
                          Ch {ch.chapterNumber}: {ch.chapterName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Topic Selection */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Topic:</label>
                    <select
                      value={selectedTopicFilter}
                      onChange={(e) => setSelectedTopicFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer truncate"
                    >
                      <option value="ALL">All Topics</option>
                      {availableTopics.map((tName) => (
                        <option key={tName} value={tName}>
                          {tName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Chapter Range (From - To) */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Chapter Range:</label>
                    <div className="flex space-x-1">
                      <select
                        value={chapterRangeMin}
                        onChange={(e) => setChapterRangeMin(e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer text-[11px]"
                      >
                        <option value="ALL">Min</option>
                        {chaptersBreakdown.map((ch) => (
                          <option key={ch.chapterNumber} value={ch.chapterNumber}>
                            Ch {ch.chapterNumber}
                          </option>
                        ))}
                      </select>
                      <select
                        value={chapterRangeMax}
                        onChange={(e) => setChapterRangeMax(e.target.value)}
                        className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer text-[11px]"
                      >
                        <option value="ALL">Max</option>
                        {chaptersBreakdown.map((ch) => (
                          <option key={ch.chapterNumber} value={ch.chapterNumber}>
                            Ch {ch.chapterNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4. Difficulty Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Difficulty:</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer"
                    >
                      <option value="ALL">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  {/* 5. Special Tags / Attributes Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Question Tags:</label>
                    <select
                      value={attributeFilter}
                      onChange={(e) => setAttributeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer"
                    >
                      <option value="ALL">All Tags</option>
                      <option value="Starred">⭐ Starred</option>
                      <option value="Repeated">🔁 Repeated</option>
                      <option value="Important">🎯 Important</option>
                      <option value="Conceptual">💡 Conceptual</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Sort By & Group By */}
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-700">
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Sort By:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="default">Default Order</option>
                      <option value="chapter_asc">Chapter ↑ Ascending</option>
                      <option value="chapter_desc">Chapter ↓ Descending</option>
                      <option value="topic_az">Topic A → Z</option>
                      <option value="difficulty_asc">Difficulty Easy → Hard</option>
                      <option value="difficulty_desc">Difficulty Hard → Easy</option>
                      <option value="category">Category (MCQ → Short → Long)</option>
                    </select>
                  </div>

                  {/* Group By */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">Group By:</span>
                    {[
                      { key: 'none', label: 'None' },
                      { key: 'chapter', label: '📚 Chapter' },
                      { key: 'topic', label: '🏷️ Topic' }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setGroupBy(opt.key); setCollapsedGroups({}); }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          groupBy === opt.key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-indigo-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {groupBy !== 'none' && (
                    <button
                      onClick={() => {
                        const allKeys = groupedQuestions?.map(([k]) => k) || [];
                        const allCollapsed = allKeys.every(k => collapsedGroups[k]);
                        const next = {};
                        if (!allCollapsed) allKeys.forEach(k => { next[k] = true; });
                        setCollapsedGroups(next);
                      }}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 transition-all"
                    >
                      {groupedQuestions?.every(([k]) => collapsedGroups[k]) ? 'Expand All' : 'Collapse All'}
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Stats Summary Bar */}
              {filterStats.total > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Showing:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-950/50 border border-blue-900 text-blue-300 text-[11px] font-extrabold">
                    📚 {filterStats.chapters} {filterStats.chapters === 1 ? 'Chapter' : 'Chapters'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/50 border border-indigo-900 text-indigo-300 text-[11px] font-extrabold">
                    🏷️ {filterStats.topics} {filterStats.topics === 1 ? 'Topic' : 'Topics'}
                  </span>
                  {filterStats.mcq > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-950/50 border border-sky-900 text-sky-300 text-[11px] font-extrabold">
                      🗂️ {filterStats.mcq} MCQ
                    </span>
                  )}
                  {filterStats.short > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/50 border border-purple-900 text-purple-300 text-[11px] font-extrabold">
                      ✏️ {filterStats.short} Short
                    </span>
                  )}
                  {filterStats.long > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/50 border border-rose-900 text-rose-300 text-[11px] font-extrabold">
                      📝 {filterStats.long} Long
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/50 border border-emerald-900 text-emerald-300 text-[11px] font-extrabold">
                    ✅ {filterStats.total} Total
                  </span>
                </div>
              )}

              {/* Bulk Reveal Toggles */}
              {filterStats.total > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">Bulk Reveal:</span>
                  <button
                    onClick={() => setShowAllAnswers(v => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      showAllAnswers
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-900 text-blue-400 border-blue-800 hover:bg-blue-950/50'
                    }`}
                  >
                    {showAllAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showAllAnswers ? 'Hide All Answers & Solutions' : 'Show All Answers & Solutions'}
                  </button>
                  <button
                    onClick={() => setShowAllExplanations(v => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      showAllExplanations
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-900 text-indigo-400 border-indigo-800 hover:bg-indigo-950/50'
                    }`}
                  >
                    {showAllExplanations ? <EyeOff className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {showAllExplanations ? 'Hide All Explanations' : 'Show All Explanations'}
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {groupBy !== 'none' && groupedQuestions ? (
                  // ── GROUPED VIEW ──
                  groupedQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                      No questions match your current filters.
                    </div>
                  ) : (
                    groupedQuestions.map(([groupKey, groupQs]) => (
                      <div key={groupKey} className="rounded-2xl border border-slate-700 overflow-hidden">
                        {/* Group Header */}
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-950/60 to-slate-900 hover:from-indigo-900/60 transition-all cursor-pointer border-b border-slate-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-extrabold shrink-0">
                              {groupBy === 'chapter' ? '📚' : '🏷️'}
                            </span>
                            <span className="font-extrabold text-sm text-white text-left">{groupKey}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 text-xs font-extrabold rounded-lg border border-indigo-800">
                              {groupQs.length} Q
                            </span>
                            {collapsedGroups[groupKey]
                              ? <ChevronDown className="w-4 h-4 text-slate-400" />
                              : <ChevronUp className="w-4 h-4 text-indigo-400" />
                            }
                          </div>
                        </button>

                        {/* Group Questions */}
                        {!collapsedGroups[groupKey] && (
                          <div className="p-4 space-y-4 bg-slate-950">
                            {groupQs.map((q, idx) => renderAdminQuestionCard(q, idx))}
                          </div>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  // ── FLAT VIEW ──
                  sortedQuestions.map((q, idx) => renderAdminQuestionCard(q, idx))
                )}

                {groupBy === 'none' && sortedQuestions.length === 0 && (
                  <div className="text-center py-16 bg-slate-900 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                    No questions match your current search, chapter, or topic filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Module Form Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-800 my-8">
                <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                      <LayoutList className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white">
                        {editSetId ? 'Edit Quiz Module' : 'Create New Quiz Module'}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Configure quiz title, category, chapter ranges, and exam rules.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveModule} className="p-6 space-y-4 text-xs font-bold">
                  {/* Module Title */}
                  <div>
                    <label className="block text-slate-300 mb-1">
                      Module Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lecture 1-10 Practice, Midterm Preparation Set 1"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                      value={newSet.title}
                      onChange={(e) => setNewSet({ ...newSet, title: e.target.value })}
                    />
                  </div>

                  {/* Row 1: Category & Module Quiz Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1">Question Category</label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none cursor-pointer"
                        value={newSet.category}
                        onChange={(e) => setNewSet({ ...newSet, category: e.target.value })}
                      >
                        <option value="MCQ">Quizzes (MCQ)</option>
                        <option value="SHORT">Short Questions</option>
                        <option value="LONG">Long Questions</option>
                        <option value="MIXED">Mixed Format</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Module Quiz Type</label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none cursor-pointer"
                        value={newSet.quizType}
                        onChange={(e) => setNewSet({ ...newSet, quizType: e.target.value })}
                      >
                        <option value="CHAPTER_QUIZ">Chapter / Lecture Practice</option>
                        <option value="MIDTERM_EXAM">Midterm Exam</option>
                        <option value="FINALTERM_EXAM">Finalterm Exam</option>
                        <option value="PAST_PAPER">Solved Past Paper</option>
                        <option value="CUSTOM">Custom Quiz Set</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Target Chapters & Time Limit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Target Chapters <span className="text-[10px] text-slate-400 font-normal">(Comma separated, e.g. 1, 2, 3)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1, 2, 3, 4, 5"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500 font-mono"
                        value={newSet.chaptersInput}
                        onChange={(e) => setNewSet({ ...newSet, chaptersInput: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Time Limit (Minutes)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="15"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                        value={newSet.timeLimitMinutes}
                        onChange={(e) => setNewSet({ ...newSet, timeLimitMinutes: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Topics Covered */}
                  <div>
                    <label className="block text-slate-300 mb-1">
                      Specific Topics Covered <span className="text-[10px] text-slate-400 font-normal">(Comma separated)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Servlets, JAX-WS, RESTful APIs"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500"
                      value={newSet.topicsInput}
                      onChange={(e) => setNewSet({ ...newSet, topicsInput: e.target.value })}
                    />
                  </div>

                  {/* Description / Instructions */}
                  <div>
                    <label className="block text-slate-300 mb-1">Description / Student Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Enter optional details or exam guidelines for students..."
                      className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none focus:border-blue-500 font-medium"
                      value={newSet.description}
                      onChange={(e) => setNewSet({ ...newSet, description: e.target.value })}
                    />
                  </div>

                  {/* Row 3: Status & Full Course Bank Toggle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-slate-300 mb-1">Status</label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none cursor-pointer"
                        value={newSet.status}
                        onChange={(e) => setNewSet({ ...newSet, status: e.target.value })}
                      >
                        <option value="published">Active / Published</option>
                        <option value="draft">Draft (Hidden)</option>
                        <option value="disabled">Disabled</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <input
                          type="checkbox"
                          checked={newSet.isFullCourse}
                          onChange={(e) => setNewSet({ ...newSet, isFullCourse: e.target.checked })}
                          className="accent-blue-500 rounded"
                        />
                        <span className="text-xs text-blue-400 font-bold">Auto-Include Full Course Bank</span>
                      </label>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center space-x-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>{editSetId ? 'Update Module' : 'Save Module'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: Import Bulk Questions */}
          {isImportQuestionsOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <UploadCloud className="w-5 h-5 text-indigo-400" />
                    <span>Import Bulk Questions ({subject?.code})</span>
                  </h2>
                  <button onClick={() => setIsImportQuestionsOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleImportQuestionsSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Upload JSON File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => setQuestionsJsonText(event.target.result);
                          reader.readAsText(file);
                        }
                      }}
                      className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-300">Or Paste Questions JSON Array</label>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = [
                            {
                              "category": "MCQ",
                              "questionText": "What is the primary key in a relational database?",
                              "options": [
                                "A unique identifier for each row",
                                "A key allowing duplicate values",
                                "A foreign key reference",
                                "An optional attribute"
                              ],
                              "correctOption": 0,
                              "explanation": "A primary key uniquely identifies each record/tuple in a table.",
                              "solution": "",
                              "chapter": 1,
                              "topic": "Database definitions",
                              "difficulty": "Easy",
                              "codeSnippet": "CREATE TABLE Student (id INT PRIMARY KEY);",
                              "codeLanguage": "sql",
                              "solutionCode": "",
                              "solutionCodeLanguage": "sql",
                              "imageBase64": "",
                              "imagesBase64": [],
                              "isStarred": false,
                              "isImportant": true,
                              "isRepeated": false,
                              "isConceptual": true
                            },
                            {
                              "category": "SHORT",
                              "questionText": "Differentiate between Data and Information.",
                              "solution": "Data refers to raw facts, whereas Information is processed data with meaning.",
                              "chapter": 2,
                              "topic": "Difference between Data and Information",
                              "difficulty": "Medium",
                              "isImportant": true
                            }
                          ];
                          setQuestionsJsonText(JSON.stringify(sample, null, 2));
                        }}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                      >
                        ⚡ Load Complete Sample JSON
                      </button>
                    </div>
                    <textarea
                      rows={10}
                      value={questionsJsonText}
                      onChange={(e) => setQuestionsJsonText(e.target.value)}
                      placeholder={`[\n  {\n    "category": "MCQ",\n    "questionText": "Sample question?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctOption": 0,\n    "explanation": "Detailed explanation...",\n    "chapter": 1,\n    "topic": "Database definitions",\n    "difficulty": "Easy",\n    "isImportant": true\n  }\n]`}
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      💡 Tip: You can paste a pure questions array OR a full export JSON file containing a <code className="text-slate-400">questions</code> array.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsImportQuestionsOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingImport}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1"
                    >
                      {isProcessingImport ? 'Importing...' : 'Import Bulk Questions'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 3: Import Subject Data */}
          {isImportSubjectOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <span>Import Full Subject Data</span>
                  </h2>
                  <button onClick={() => setIsImportSubjectOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleImportSubjectSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Upload Full Subject Package JSON</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => setSubjectJsonText(event.target.result);
                          reader.readAsText(file);
                        }
                      }}
                      className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Or Paste Subject Data JSON</label>
                    <textarea
                      rows={8}
                      value={subjectJsonText}
                      onChange={(e) => setSubjectJsonText(e.target.value)}
                      placeholder='{ "subject": { "code": "CS101", "name": "Computer Science" }, "quizzes": [...], "questions": [...] }'
                      className="w-full p-3 bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsImportSubjectOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingImport}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md flex items-center space-x-1"
                    >
                      {isProcessingImport ? 'Importing...' : 'Import Subject Data'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 4: Add Single Question */}
          {isAddSingleQuestionOpen && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col p-5 shadow-2xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    {editingQuestionId ? <Edit2 className="w-4 h-4 text-blue-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                    <span>{editingQuestionId ? `Edit Question (${subject?.code})` : `Add New Question (${subject?.code})`}</span>
                  </h2>
                  <button onClick={() => { setIsAddSingleQuestionOpen(false); setEditingQuestionId(null); }} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddSingleQuestionSubmit} className="flex flex-col flex-1 overflow-hidden pt-3 text-xs">
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {/* Category, Difficulty, Status */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Category</label>
                        <select
                          value={singleQuestion.category}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-bold outline-none text-xs"
                        >
                          <option value="MCQ">MCQ</option>
                          <option value="SHORT">SHORT</option>
                          <option value="LONG">LONG</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Difficulty</label>
                        <select
                          value={singleQuestion.difficulty}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-bold outline-none text-xs"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-300 mb-1 text-[11px]">Status</label>
                        <select
                          value={singleQuestion.status}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-bold outline-none text-xs"
                        >
                          <option value="published">✅ Published</option>
                          <option value="draft">📝 Draft</option>
                          <option value="disabled">🚫 Disabled</option>
                          <option value="archived">📦 Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Chapter & Topic */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-slate-300 text-[11px]">Chapter</label>
                          <span className="text-[10px] text-slate-500 font-mono">Ch. {singleQuestion.chapter}</span>
                        </div>
                        <select
                          value={singleQuestion.chapter}
                          onChange={(e) => {
                            const newCh = Number(e.target.value) || 1;
                            setSingleQuestion(prev => ({
                              ...prev,
                              chapter: newCh,
                              topic: 'General'
                            }));
                          }}
                          className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-bold outline-none text-xs"
                        >
                          {Array.from({ length: Math.max(maxAvailableChapter, 45) }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Chapter {n}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-slate-300 text-[11px]">Topic (Chapter {singleQuestion.chapter})</label>
                          <span className="text-[10px] text-emerald-400 font-mono">({topicsForSelectedChapter.length} topics)</span>
                        </div>
                        <select
                          value={singleQuestion.topic}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, topic: e.target.value }))}
                          className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-bold outline-none text-xs"
                        >
                          <option value="General">General (Default)</option>
                          {topicsForSelectedChapter.map((t, idx) => (
                            <option key={idx} value={t}>{t}</option>
                          ))}
                          <option value="__NEW__">➕ Type Custom Topic...</option>
                        </select>

                        {singleQuestion.topic === '__NEW__' && (
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type new custom topic name..."
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              setSingleQuestion(prev => ({ ...prev, topic: val || 'General' }));
                            }}
                            className="w-full mt-1.5 p-2 bg-slate-900 border border-emerald-800 text-emerald-300 rounded-xl outline-none text-xs font-bold"
                          />
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-300 mb-1 text-[11px]">Question Prompt Text *</label>
                      <textarea
                        rows={2}
                        value={singleQuestion.questionText}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                        placeholder="Write your question text here..."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                        required
                      />
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={singleQuestion.questionTextUrdu || ''}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, questionTextUrdu: e.target.value }))}
                        placeholder="سوال کا متن یہاں لکھیں..."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 text-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-urdu text-sm"
                      />
                    </div>

                    {/* MCQ Options (If Category === MCQ) */}
                    {singleQuestion.category === 'MCQ' && (
                      <div className="space-y-2 bg-slate-950/70 p-2.5 border border-slate-800 rounded-2xl">
                        <label className="block font-bold text-emerald-400 text-[11px]">MCQ Options &amp; Correct Answer</label>
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="correctOptionRadioCompact"
                              checked={singleQuestion.correctOption === idx}
                              onChange={() => setSingleQuestion(prev => ({ ...prev, correctOption: idx }))}
                              className="w-3.5 h-3.5 text-emerald-500 accent-emerald-500 cursor-pointer"
                            />
                            <span className="text-slate-400 font-bold w-5 text-xs">{String.fromCharCode(65 + idx)}.</span>
                            <div className="flex-1 flex flex-col space-y-1">
                              <input
                                type="text"
                                value={singleQuestion.options[idx] || ''}
                                onChange={(e) => {
                                  const newOpts = [...singleQuestion.options];
                                  newOpts[idx] = e.target.value;
                                  setSingleQuestion(prev => ({ ...prev, options: newOpts }));
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                className="w-full p-1.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg outline-none text-xs"
                                required
                              />
                              <input
                                type="text"
                                dir="rtl"
                                value={(singleQuestion.optionsUrdu && singleQuestion.optionsUrdu[idx]) || ''}
                                onChange={(e) => {
                                  const newOptsUrdu = singleQuestion.optionsUrdu ? [...singleQuestion.optionsUrdu] : ['', '', '', ''];
                                  newOptsUrdu[idx] = e.target.value;
                                  setSingleQuestion(prev => ({ ...prev, optionsUrdu: newOptsUrdu }));
                                }}
                                placeholder={`آپشن ${String.fromCharCode(65 + idx)}`}
                                className="w-full p-1.5 bg-slate-900 border border-slate-800 text-indigo-200 rounded-lg outline-none font-urdu text-sm"
                              />
                            </div>
                          </div>
                        ))}

                        {/* Explanation */}
                        <div className="space-y-2">
                          <label className="block font-bold text-slate-300 mb-1 text-[11px]">Explanation (Optional)</label>
                          <textarea
                            rows={2}
                            value={singleQuestion.explanation}
                            onChange={(e) => setSingleQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                            placeholder="Explain why the correct option is right..."
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                          />
                          <textarea
                            rows={2}
                            dir="rtl"
                            value={singleQuestion.explanationUrdu || ''}
                            onChange={(e) => setSingleQuestion(prev => ({ ...prev, explanationUrdu: e.target.value }))}
                            placeholder="وضاحت یہاں لکھیں..."
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 text-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-urdu text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Subjective Solution (Always visible) */}
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-300 mb-1 text-[11px]">Solution / Model Answer (Optional)</label>
                      <textarea
                        rows={2}
                        value={singleQuestion.solution}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, solution: e.target.value }))}
                        placeholder="Write model answer / solution text here..."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                      />
                      <textarea
                        rows={2}
                        dir="rtl"
                        value={singleQuestion.solutionUrdu || ''}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, solutionUrdu: e.target.value }))}
                        placeholder="حل یہاں لکھیں..."
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 text-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-urdu text-sm"
                      />
                    </div>

                    {/* Optional Code Block */}
                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-300 text-[11px]">Code Snippet (Optional)</label>
                        <select
                          value={singleQuestion.codeLanguage}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, codeLanguage: e.target.value }))}
                          className="p-1 bg-slate-950 border border-slate-800 text-slate-400 rounded text-[10px]"
                        >
                          <option value="cpp">C++</option>
                          <option value="sql">SQL</option>
                          <option value="java">Java</option>
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="csharp">C#</option>
                          <option value="html">HTML/CSS</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={singleQuestion.codeSnippet}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, codeSnippet: e.target.value }))}
                        placeholder="// Optional code snippet"
                        className="w-full p-2 bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs rounded-xl outline-none"
                      />
                    </div>

                    {/* Solution Code Block */}
                    <div className="space-y-1.5 border-t border-slate-800/80 pt-2">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-slate-300 text-[11px]">Solution Code (Optional)</label>
                        <select
                          value={singleQuestion.solutionCodeLanguage}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, solutionCodeLanguage: e.target.value }))}
                          className="p-1 bg-slate-950 border border-slate-800 text-slate-400 rounded text-[10px]"
                        >
                          <option value="cpp">C++</option>
                          <option value="sql">SQL</option>
                          <option value="java">Java</option>
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="csharp">C#</option>
                          <option value="html">HTML/CSS</option>
                        </select>
                      </div>
                      <textarea
                        rows={2}
                        value={singleQuestion.solutionCode}
                        onChange={(e) => setSingleQuestion(prev => ({ ...prev, solutionCode: e.target.value }))}
                        placeholder="// Optional solution code"
                        className="w-full p-2 bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs rounded-xl outline-none"
                      />
                    </div>

                    {/* Image Uploads */}
                    <div className="space-y-2.5 border-t border-slate-800/80 pt-2">
                      <label className="font-bold text-slate-300 text-[11px]">📷 Image Attachments (Optional)</label>

                      {/* Single Main Image */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">Main Image (imageBase64)</span>
                          {singleQuestion.imageBase64 && (
                            <button
                              type="button"
                              onClick={() => setSingleQuestion(prev => ({ ...prev, imageBase64: '' }))}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                            >✕ Remove</button>
                          )}
                        </div>
                        {!singleQuestion.imageBase64 ? (
                          <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-slate-950 border-2 border-dashed border-slate-700 hover:border-emerald-600 text-slate-400 hover:text-emerald-400 rounded-xl cursor-pointer transition-colors text-xs font-bold">
                            <Upload size={14} />
                            <span>Upload Main Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => setSingleQuestion(prev => ({ ...prev, imageBase64: reader.result }));
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        ) : (
                          <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <img
                              src={singleQuestion.imageBase64.startsWith('data:') ? singleQuestion.imageBase64 : `data:image/png;base64,${singleQuestion.imageBase64}`}
                              alt="Main Preview"
                              className="max-h-24 rounded-lg object-contain mx-auto"
                            />
                          </div>
                        )}
                      </div>

                      {/* Multiple Images */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">Additional Images (imagesBase64) — {singleQuestion.imagesBase64?.length || 0} uploaded</span>
                          {singleQuestion.imagesBase64?.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSingleQuestion(prev => ({ ...prev, imagesBase64: [] }))}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                            >✕ Clear All</button>
                          )}
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full p-2 bg-slate-950 border-2 border-dashed border-slate-700 hover:border-blue-600 text-slate-400 hover:text-blue-400 rounded-xl cursor-pointer transition-colors text-xs font-bold">
                          <UploadCloud size={14} />
                          <span>Upload Additional Images (Multi)</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              files.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setSingleQuestion(prev => ({
                                    ...prev,
                                    imagesBase64: [...(prev.imagesBase64 || []), reader.result]
                                  }));
                                };
                                reader.readAsDataURL(file);
                              });
                              e.target.value = '';
                            }}
                          />
                        </label>
                        {singleQuestion.imagesBase64?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {singleQuestion.imagesBase64.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={img.startsWith('data:') ? img : `data:image/png;base64,${img}`}
                                  alt={`Image ${idx + 1}`}
                                  className="h-16 w-16 rounded-lg object-cover border border-slate-700"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSingleQuestion(prev => ({
                                    ...prev,
                                    imagesBase64: prev.imagesBase64.filter((_, i) => i !== idx)
                                  }))}
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkboxes / Exam Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
                        <input
                          type="checkbox"
                          checked={singleQuestion.isImportant}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, isImportant: e.target.checked }))}
                          className="accent-amber-500 rounded"
                        />
                        <span className="font-bold text-amber-400">Important</span>
                      </label>

                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                        <input
                          type="checkbox"
                          checked={singleQuestion.isRepeated}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, isRepeated: e.target.checked }))}
                          className="accent-blue-500 rounded"
                        />
                        <span className="font-bold text-blue-400">Repeated</span>
                      </label>

                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                        <input
                          type="checkbox"
                          checked={singleQuestion.isConceptual}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, isConceptual: e.target.checked }))}
                          className="accent-purple-500 rounded"
                        />
                        <span className="font-bold text-purple-400">Conceptual</span>
                      </label>

                      <label className="flex items-center space-x-2 text-slate-300 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                        <input
                          type="checkbox"
                          checked={singleQuestion.isStarred}
                          onChange={(e) => setSingleQuestion(prev => ({ ...prev, isStarred: e.target.checked }))}
                          className="accent-yellow-500 rounded"
                        />
                        <span className="font-bold text-yellow-400">Starred</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions (Fixed Footer) */}
                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsAddSingleQuestionOpen(false)}
                      className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center space-x-1"
                    >
                      <span>{editingQuestionId ? 'Update Question' : 'Save Question'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* FAQ Modal */}
          {isAddFaqOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                    <span>Add Frequently Asked Question (FAQ)</span>
                  </h3>
                  <button onClick={() => setIsAddFaqOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddFaqSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1">Question Statement</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Is CS311 midterm exam subjective or objective?"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Answer / Explanation</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Midterm exam contains 60% MCQs and 40% Short Questions."
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setIsAddFaqOpen(false)} className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md">
                      Save FAQ
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Note / Handout Modal */}
          {isAddNoteOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Add Handout or Summary Note</span>
                  </h3>
                  <button onClick={() => setIsAddNoteOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS311 Official Handout 2025 PDF"
                      value={newNote.title}
                      onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Document File URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/handout.pdf"
                      value={newNote.fileUrl}
                      onChange={(e) => setNewNote(prev => ({ ...prev, fileUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Description / Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Short Summary PDF Notes"
                      value={newNote.description}
                      onChange={(e) => setNewNote(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setIsAddNoteOpen(false)} className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md">
                      Save Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Past Paper Link Modal */}
          {isAddPaperOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Add Solved Past Paper Link</span>
                  </h3>
                  <button onClick={() => setIsAddPaperOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddPaperSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS311 Solved Midterm Papers Moaaz & Waqar"
                      value={newPaper.title}
                      onChange={(e) => setNewPaper(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Paper Web / Google Drive Link</label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/..."
                      value={newPaper.url}
                      onChange={(e) => setNewPaper(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Exam Term</label>
                      <select
                        value={newPaper.term}
                        onChange={(e) => setNewPaper(prev => ({ ...prev, term: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                      >
                        <option value="Midterm">Midterm</option>
                        <option value="Finalterm">Finalterm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Year</label>
                      <input
                        type="text"
                        placeholder="2025"
                        value={newPaper.year}
                        onChange={(e) => setNewPaper(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setIsAddPaperOpen(false)} className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md">
                      Save Paper Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Video Lecture Modal */}
          {isAddVideoOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex justify-center items-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>Add YouTube Video Tutorial</span>
                  </h3>
                  <button onClick={() => setIsAddVideoOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddVideoSubmit} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 mb-1">Video Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS311 Complete Servlets & JAX-WS Masterclass"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">YouTube URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={newVideo.youtubeUrl}
                      onChange={(e) => setNewVideo(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Topic / Subject Area</label>
                      <input
                        type="text"
                        placeholder="e.g. Servlets"
                        value={newVideo.topic}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, topic: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="18 mins"
                        value={newVideo.duration}
                        onChange={(e) => setNewVideo(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button type="button" onClick={() => setIsAddVideoOpen(false)} className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md">
                      Save Video
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
