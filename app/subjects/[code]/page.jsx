'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import CodeBlock from '@/components/CodeBlock';
import useLanguageStore from '@/store/useLanguageStore';
import useSettingsStore from '@/store/useSettingsStore';
import {
  ArrowLeft,
  LayoutList,
  FileText,
  PlayCircle,
  BookOpen,
  Clock,
  Award,
  Star,
  CheckCircle2,
  HelpCircle,
  Search,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Tag,
  BookMarked,
  Download,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCode2,
  FileCheck
} from 'lucide-react';

export default function SubjectView() {
  const params = useParams();
  const code = params?.code || params?.subjectId;

  const [subject, setSubject] = useState(null);
  const [sets, setSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isUrduEnabled, isBilingual } = useLanguageStore();
  const { questionSize, optionSize, explanationSize, urduSize } = useSettingsStore();

  // Tab State: 'modules' | 'guide' | 'notes' | 'videos' | 'questions' | 'syllabus'
  const [activeTab, setActiveTab] = useState('modules');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

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
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleOptionSelect = (qId, optIdx) => {
    setSelectedOptions((prev) => ({ ...prev, [qId]: optIdx }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/subjects/${code}`);
        const subjectData = res.data || res;
        setSubject(subjectData);

        const setsList = (subjectData.quizzes || []).filter(q => q.isActive !== false);
        setSets(setsList);

        const qList = subjectData.questions || [];
        setQuestions(qList);
      } catch (err) {
        console.error("Error fetching subject details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchData();
    }
  }, [code]);

  // Compute Chapters & Topics breakdown
  const chaptersBreakdown = useMemo(() => {
    const map = new Map();
    const safeQuestions = Array.isArray(questions) ? questions : [];

    if (Array.isArray(subject?.chaptersConfig) && subject.chaptersConfig.length > 0) {
      subject.chaptersConfig.forEach((c) => {
        const cNum = c.chapterNumber || c.chapter || 1;
        const cName = c.chapterName || `Chapter ${cNum}`;
        const topicMap = new Map();

        if (Array.isArray(c.topics)) {
          c.topics.forEach((t) => {
            const name = typeof t === 'string' ? t : (t?.topicName || t?.name || t?.topic || '');
            if (name && name.trim()) {
              topicMap.set(name.trim().toLowerCase(), {
                topicName: name.trim(),
                isImportant: Boolean(t?.isImportant),
                mcqCount: 0,
                shortCount: 0,
                longCount: 0
              });
            }
          });
        }

        map.set(cNum, {
          chapterNumber: cNum,
          chapterName: cName,
          topicsMap: topicMap
        });
      });
    }

    safeQuestions.forEach((q) => {
      const chNum = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      const rawTopic = (q.topic || 'General').trim();
      const rawLower = rawTopic.toLowerCase();

      if (!map.has(chNum)) {
        map.set(chNum, {
          chapterNumber: chNum,
          chapterName: `Chapter ${chNum}`,
          topicsMap: new Map()
        });
      }
      const chObj = map.get(chNum);

      let matchedKey = null;
      for (const [key, tObj] of chObj.topicsMap.entries()) {
        const cleanKey = key.replace(/^[0-9.]+\s*/, '').trim();
        const cleanRaw = rawLower.replace(/^[0-9.]+\s*/, '').trim();

        if (
          key === rawLower ||
          (cleanRaw.length > 3 && (key.includes(cleanRaw) || rawLower.includes(cleanKey))) ||
          (cleanKey.length > 3 && cleanKey === cleanRaw)
        ) {
          matchedKey = key;
          break;
        }
      }

      if (!matchedKey) {
        matchedKey = rawLower;
        if (!chObj.topicsMap.has(matchedKey)) {
          chObj.topicsMap.set(matchedKey, {
            topicName: rawTopic,
            isImportant: Boolean(q.isImportant),
            mcqCount: 0,
            shortCount: 0,
            longCount: 0
          });
        }
      }

      const topicObj = chObj.topicsMap.get(matchedKey);
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

  // Dynamic list of topics based on selected chapter
  const availableTopics = useMemo(() => {
    const topicSet = new Map();

    chaptersBreakdown.forEach((ch) => {
      if (selectedChapterFilter === 'ALL' || Number(selectedChapterFilter) === ch.chapterNumber) {
        ch.topics.forEach((tp) => {
          if (tp.topicName && !topicSet.has(tp.topicName.toLowerCase())) {
            topicSet.set(tp.topicName.toLowerCase(), tp.topicName);
          }
        });
      }
    });

    return Array.from(topicSet.values()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [chaptersBreakdown, selectedChapterFilter]);

  // Compute live category tallies
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

  // Sorted questions derived from filteredQuestions
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
    return null; // flat list
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

  // Extracted question card renderer for reuse in flat & grouped views
  const renderQuestionCard = (q, qId) => {
    const isMcq = q.category === 'MCQ';
    const isAnsRevealed = showAllAnswers || Boolean(revealedAnswers[qId]);
    const isExpRevealed = showAllExplanations || Boolean(revealedExplanations[qId]);
    return (
      <div key={qId} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900">
              {q.category || 'MCQ'}
            </span>
            <span>Chapter {q.chapter || 1}</span>
            <span>&bull;</span>
            <span className="text-slate-700 dark:text-slate-300">{q.topic || 'General'}</span>
          </div>

          <div className="flex items-center space-x-1.5 flex-wrap">
            {q.isImportant && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                Important
              </span>
            )}
            {q.isStarred && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800">
                ⭐ Starred
              </span>
            )}
            {q.isRepeated && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                Repeated
              </span>
            )}
            {q.isConceptual && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 border border-purple-300 dark:border-purple-800">
                Conceptual
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
              {q.difficulty || 'Medium'}
            </span>
          </div>
        </div>

        {/* Question Statement */}
        {isBilingual() && q.questionTextUrdu ? (
          <div className="space-y-4">
            <h3 style={{ fontSize: `${questionSize}px` }} className="font-bold text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
              {q.questionText}
            </h3>
            <h3 style={{ fontSize: `${urduSize}px` }} className="font-urdu font-bold text-indigo-800 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
              {q.questionTextUrdu}
            </h3>
          </div>
        ) : (
          <h3 
            style={{ fontSize: `${isUrduEnabled() && q.questionTextUrdu ? urduSize : questionSize}px` }}
            className={`font-bold whitespace-pre-wrap leading-relaxed ${isUrduEnabled() && q.questionTextUrdu ? 'font-urdu text-indigo-800 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}
          >
            {isUrduEnabled() && q.questionTextUrdu ? q.questionTextUrdu : q.questionText}
          </h3>
        )}

        {/* Question Diagrams / Image Gallery */}
        {Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {q.imagesBase64.map((img, imgIdx) => (
              <div key={imgIdx} className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                <img
                  src={img.startsWith('data:') ? img : `data:image/png;base64,${img}`}
                  alt={`Image ${imgIdx + 1}`}
                  className="h-20 w-20 object-cover"
                />
              </div>
            ))}
          </div>
        ) : q.imageBase64 ? (
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <img
              src={q.imageBase64.startsWith('data:') ? q.imageBase64 : `data:image/png;base64,${q.imageBase64}`}
              alt="Question Image"
              className="max-h-48 object-contain mx-auto"
            />
          </div>
        ) : null}

        {/* Code Snippet */}
        {q.codeSnippet && (
          <CodeBlock
            code={q.codeSnippet}
            language={q.codeLanguage || 'cpp'}
            title="Code Snippet"
          />
        )}

        {/* Options (MCQ) */}
        {q.category === 'MCQ' && Array.isArray(q.options) && (
          <div className="space-y-2 pt-1">
            {q.options.map((opt, optIdx) => {
              const isCorrect = optIdx === q.correctOption;
              const isSelected = selectedOptions[qId] === optIdx;
              let optionStyle = 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
              if (isAnsRevealed && isCorrect) {
                optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold';
              } else if (isSelected) {
                optionStyle = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-300 font-bold';
              }
              return (
                <div
                  key={optIdx}
                  onClick={() => handleOptionSelect(qId, optIdx)}
                  className={`p-3 rounded-xl border transition-all text-xs flex items-center cursor-pointer ${optionStyle} ${(!isBilingual() && isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'flex-row-reverse text-right' : ''}`}
                >
                  <span className={`w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center justify-center shrink-0 ${(!isBilingual() && isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'ml-2.5' : 'mr-2.5'}`}>
                    {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                  </span>
                  
                  <div className="flex-1 flex flex-col space-y-1">
                     {isBilingual() && q.optionsUrdu && q.optionsUrdu[optIdx] ? (
                       <>
                         <span style={{ fontSize: `${optionSize}px` }} className="text-left">{opt}</span>
                         <span style={{ fontSize: `${urduSize}px` }} className="font-urdu text-indigo-700 dark:text-indigo-300 text-right w-full block">{q.optionsUrdu[optIdx]}</span>
                       </>
                     ) : (
                       <span 
                         style={{ fontSize: `${(isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? urduSize : optionSize}px` }}
                         className={`${(isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'font-urdu' : ''}`}
                       >
                         {isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx] ? q.optionsUrdu[optIdx] : opt}
                       </span>
                     )}
                  </div>

                  {isAnsRevealed && isCorrect && (
                    <CheckCircle2 className={`w-4 h-4 text-emerald-500 shrink-0 ${(!isBilingual() && isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'mr-auto ml-2' : 'ml-2'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Answer Key */}
        {isAnsRevealed && q.solution && (
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
            <span className={`font-bold block ${(isUrduEnabled() && q.solutionUrdu) ? 'text-right' : ''}`}>Solution / Answer Key:</span>
            
            {isBilingual() && q.solutionUrdu ? (
              <div className="space-y-3">
                <p style={{ fontSize: `${explanationSize}px` }} className="whitespace-pre-wrap leading-relaxed">{q.solution}</p>
                <p style={{ fontSize: `${urduSize}px` }} className="font-urdu whitespace-pre-wrap leading-relaxed">{q.solutionUrdu}</p>
              </div>
            ) : (
              <p 
                style={{ fontSize: `${(isUrduEnabled() && q.solutionUrdu) ? urduSize : explanationSize}px` }}
                className={`whitespace-pre-wrap leading-relaxed ${(isUrduEnabled() && q.solutionUrdu) ? 'font-urdu' : ''}`}
              >
                {isUrduEnabled() && q.solutionUrdu ? q.solutionUrdu : q.solution}
              </p>
            )}
          </div>
        )}

        {/* Solution Code */}
        {isAnsRevealed && q.solutionCode && (
          <CodeBlock
            code={q.solutionCode}
            language={q.solutionCodeLanguage || 'cpp'}
            title="Solution Code Implementation"
          />
        )}

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => toggleRevealAnswer(qId)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            {isAnsRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isAnsRevealed ? 'Hide Answer & Solution' : 'Show Answer & Solution'}</span>
          </button>
          {q.explanation && (
            <button
              onClick={() => toggleRevealExplanation(qId)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExpRevealed ? 'Hide Explanation' : 'Show Explanation'}</span>
            </button>
          )}
        </div>

        {/* Explanation */}
        {isExpRevealed && q.explanation && (
          <div className={`p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 ${(isUrduEnabled() && q.explanationUrdu) ? 'text-right' : ''}`}>
            <span className="font-bold block mb-1">Detailed Explanation:</span>
            
            {isBilingual() && q.explanationUrdu ? (
               <div className="space-y-3">
                 <p style={{ fontSize: `${explanationSize}px` }} className="whitespace-pre-wrap leading-relaxed text-left">{q.explanation}</p>
                 <p style={{ fontSize: `${urduSize}px` }} className="font-urdu whitespace-pre-wrap leading-relaxed">{q.explanationUrdu}</p>
               </div>
            ) : (
               <p 
                 style={{ fontSize: `${(isUrduEnabled() && q.explanationUrdu) ? urduSize : explanationSize}px` }}
                 className={`whitespace-pre-wrap leading-relaxed ${(isUrduEnabled() && q.explanationUrdu) ? 'font-urdu' : ''}`}
               >
                 {isUrduEnabled() && q.explanationUrdu ? q.explanationUrdu : q.explanation}
               </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSection = (categoryTitle, categoryKey) => {
    const filteredSets = sets.filter(s => (s.category === categoryKey) || (!s.category && categoryKey === 'MCQ'));

    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center border-b-2 border-blue-500 pb-2 inline-flex">
          <LayoutList className="w-6 h-6 mr-3 text-blue-500" />
          {categoryTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map(set => {
            const count = set.questionCount || 0;
            const estMins = Math.max(2, Math.round(count * 1.2));

            return (
              <div
                key={set.id || set._id}
                className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-105 transition-transform duration-300 border border-blue-100 dark:border-blue-900/50">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={set.status} />
                    </div>
                  </div>

                  <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                    {set.title}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
                    <span className="flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1 text-blue-500" />
                      {count} {categoryKey === 'MCQ' ? 'MCQs' : 'Questions'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      ~{estMins} mins
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <Link href={`/subjects/${subject?.code || code}/practice/${set.id || set._id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/80 rounded-xl border border-blue-200 dark:border-blue-900/50 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" /> Practice
                  </Link>

                  <Link href={`/subjects/${subject?.code || code}/practice/${set.id || set._id}?mode=learn`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/80 rounded-xl border border-indigo-200 dark:border-indigo-900/50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 mr-1" /> Learn
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredSets.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No {categoryTitle} modules available for this subject.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 max-w-7xl mx-auto">
        <RealisticPageLoader
          title="Loading Subject Hub..."
          subtitle="Fetching course structure, study guides, handouts, and video lectures..."
          steps={[
            "Connecting to subject server...",
            "Loading quiz module sets...",
            "Loading notes & lecture links...",
            "Rendering dashboard view..."
          ]}
        />
      </div>
    );
  }

  const notesList = subject?.notes || [];
  const pastPapersList = subject?.pastPaperLinks || [];
  const videoList = subject?.videoLectures || [];
  const faqsList = subject?.faqs || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation back button */}
        <div className="mb-6">
          <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Subjects
          </Link>
        </div>

        {/* Subject Banner Header */}
        <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              {subject?.code}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2">
              {subject?.name}
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
              {subject?.description || "Explore course study guides, handouts, video lectures, and interactive exam practice modules."}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-6 text-xs font-bold text-slate-200">
              <span className="flex items-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <BookMarked className="w-4 h-4 mr-1.5 text-blue-400" />
                {subject?.totalChapters || chaptersBreakdown.length} Chapters Configured
              </span>
              <span className="flex items-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <HelpCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
                {questions.length} Questions Available
              </span>
              <span className="flex items-center px-3 py-1.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <Layers className="w-4 h-4 mr-1.5 text-purple-400" />
                {sets.length} Quiz Modules
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 space-x-2 md:space-x-4 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Practice &amp; Modules ({sets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'syllabus'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Chapters &amp; Topics Outline ({chaptersBreakdown.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'questions'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Question Explorer ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Study Guide &amp; FAQs</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes &amp; Past Papers ({notesList.length + pastPapersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-5 py-3 rounded-t-2xl font-bold text-sm flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Lectures ({videoList.length})</span>
          </button>
        </div>

        {/* Tab 1: Practice Modules */}
        {activeTab === 'modules' && (
          <div>
            {renderSection('MCQ Exam Practice Sets', 'MCQ')}
            {renderSection('Short Answer Question Modules', 'SHORT')}
            {renderSection('Long Essay Question Modules', 'LONG')}
          </div>
        )}
 {/* Tab 5: Question Explorer */}
        {activeTab === 'questions' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-500" />
                  <span>Advanced Question Bank Explorer</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter by chapters, ranges, specific topics, tags, and category types.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-xs rounded-xl border border-blue-200 dark:border-blue-900">
                  Showing {filteredQuestions.length} of {questions.length} Questions
                </span>
                {(questionCategoryFilter !== 'ALL' || selectedChapterFilter !== 'ALL' || chapterRangeMin !== 'ALL' || chapterRangeMax !== 'ALL' || selectedTopicFilter !== 'ALL' || difficultyFilter !== 'ALL' || attributeFilter !== 'ALL' || searchQuery.trim()) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filter Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              {/* Row 1: Upgraded Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search statements, options, explanations, code snippets, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Row 2: Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-400 mr-1 shrink-0">Type:</span>
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
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-500'
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
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Chapter:</label>
                  <select
                    value={selectedChapterFilter}
                    onChange={(e) => {
                      setSelectedChapterFilter(e.target.value);
                      setSelectedTopicFilter('ALL');
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
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
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Topic:</label>
                  <select
                    value={selectedTopicFilter}
                    onChange={(e) => setSelectedTopicFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer truncate"
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
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Chapter Range:</label>
                  <div className="flex space-x-1">
                    <select
                      value={chapterRangeMin}
                      onChange={(e) => setChapterRangeMin(e.target.value)}
                      className="w-1/2 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer text-[11px]"
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
                      className="w-1/2 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer text-[11px]"
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
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Difficulty:</label>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* 5. Special Tags / Attributes Filter */}
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Question Tags:</label>
                  <select
                    value={attributeFilter}
                    onChange={(e) => setAttributeFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
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
              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
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
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">Group By:</span>
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
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
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
                    className="px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    {groupedQuestions?.every(([k]) => collapsedGroups[k]) ? 'Expand All' : 'Collapse All'}
                  </button>
                )}
              </div>
            </div>

            {/* Filter Stats Summary Bar */}
            {filterStats.total > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">Showing:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[11px] font-extrabold">
                  📚 {filterStats.chapters} {filterStats.chapters === 1 ? 'Chapter' : 'Chapters'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold">
                  🏷️ {filterStats.topics} {filterStats.topics === 1 ? 'Topic' : 'Topics'}
                </span>
                {filterStats.mcq > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 text-sky-700 dark:text-sky-300 text-[11px] font-extrabold">
                    🗂️ {filterStats.mcq} MCQ
                  </span>
                )}
                {filterStats.short > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-[11px] font-extrabold">
                    ✏️ {filterStats.short} Short
                  </span>
                )}
                {filterStats.long > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold">
                    📝 {filterStats.long} Long
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                  ✅ {filterStats.total} Total
                </span>
              </div>
            )}

            {/* Bulk Reveal Toggles */}
            {filterStats.total > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">Bulk Reveal:</span>
                <button
                  onClick={() => setShowAllAnswers(v => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showAllAnswers
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50'
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
                      : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  {showAllExplanations ? <EyeOff className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {showAllExplanations ? 'Hide All Explanations' : 'Show All Explanations'}
                </button>
              </div>
            )}

            {/* Question List */}
            <div className="space-y-4">
              {groupBy !== 'none' && groupedQuestions ? (
                // ── GROUPED VIEW ──
                groupedQuestions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                    <p className="text-base font-bold">No questions found matching your filters.</p>
                    <p className="text-xs text-slate-400">Try resetting filters or searching for a different keyword.</p>
                  </div>
                ) : (
                  groupedQuestions.map(([groupKey, groupQs]) => (
                    <div key={groupKey} className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      {/* Group Header */}
                      <button
                        onClick={() => toggleGroup(groupKey)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50 dark:from-indigo-950/50 to-slate-50 dark:to-slate-900 hover:from-indigo-100 dark:hover:from-indigo-900/60 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-extrabold shrink-0">
                            {groupBy === 'chapter' ? '📚' : '🏷️'}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white text-left">{groupKey}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold rounded-lg border border-indigo-200 dark:border-indigo-900">
                            {groupQs.length} Q
                          </span>
                          {collapsedGroups[groupKey]
                            ? <ChevronDown className="w-4 h-4 text-slate-400" />
                            : <ChevronUp className="w-4 h-4 text-indigo-500" />
                          }
                        </div>
                      </button>

                      {/* Group Questions */}
                      {!collapsedGroups[groupKey] && (
                        <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
                          {groupQs.map((q, idx) => {
                            const qId = q.id || q._id || `g-${groupKey}-${idx}`;
                            return renderQuestionCard(q, qId);
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                // ── FLAT VIEW ──
                sortedQuestions.map((q, idx) => {
                  const qId = q.id || q._id || idx;
                  return renderQuestionCard(q, qId);
                })
              )}
              {groupBy === 'none' && sortedQuestions.length === 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <p className="text-base font-bold">No questions found matching your search or chapter/topic filters.</p>
                  <p className="text-xs text-slate-400">Try resetting filters or searching for a different keyword.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tab: Chapters & Topics Outline */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-200 flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
              <p>
                Browse course chapters and topics below with live question counts. Click any chapter title or topic card to view its questions in the <strong>Question Explorer</strong>.
              </p>
            </div>

            {chaptersBreakdown.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Chapter Data Available</h3>
                <p className="text-xs text-slate-500">Chapters and topics will populate once course data or questions are loaded.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {chaptersBreakdown.map((ch) => {
                  const totalChapterQs = ch.topics.reduce((acc, t) => acc + t.mcqCount + t.shortCount + t.longCount, 0);

                  return (
                    <div
                      key={ch.chapterNumber}
                      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-blue-500/50 transition-all"
                    >
                      <div
                        onClick={() => {
                          setSelectedChapterFilter(String(ch.chapterNumber));
                          setSelectedTopicFilter('ALL');
                          setActiveTab('questions');
                        }}
                        className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 cursor-pointer group/chHeader"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md group-hover/chHeader:bg-blue-500 transition-colors">
                            Ch {ch.chapterNumber}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover/chHeader:text-blue-600 dark:group-hover/chHeader:text-blue-400 transition-colors">
                              {ch.chapterName}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {ch.topics.length} Topics &bull; <span className="font-bold text-blue-600 dark:text-blue-400">{totalChapterQs} Questions Total</span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-900 transition-colors flex items-center space-x-1.5 cursor-pointer"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>View Questions ({totalChapterQs})</span>
                        </button>
                      </div>

                      {/* Topics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ch.topics.map((tp, idx) => {
                          const totalTopicQs = tp.mcqCount + tp.shortCount + tp.longCount;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setSelectedChapterFilter(String(ch.chapterNumber));
                                if (totalTopicQs > 0) {
                                  setSelectedTopicFilter(tp.topicName);
                                } else {
                                  setSelectedTopicFilter('ALL');
                                }
                                setActiveTab('questions');
                              }}
                              className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] ${
                                tp.isImportant
                                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 hover:border-amber-500'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="font-bold text-xs leading-snug line-clamp-2">
                                  {tp.topicName}
                                </span>

                                {tp.isImportant && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 shrink-0">
                                    <Star className="w-3 h-3 mr-1 fill-amber-400" />
                                    Important
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                {totalTopicQs > 0 ? (
                                  <>
                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{totalTopicQs} Questions</span>
                                    <div className="flex space-x-1 text-[10px]">
                                      {tp.mcqCount > 0 && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold">{tp.mcqCount} MCQ</span>}
                                      {tp.shortCount > 0 && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded font-bold">{tp.shortCount} Short</span>}
                                      {tp.longCount > 0 && <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-bold">{tp.longCount} Long</span>}
                                    </div>
                                  </>
                                ) : totalChapterQs > 0 ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold italic text-[10px]">
                                    {totalChapterQs} Ch Questions &rarr;
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 italic text-[10px]">Syllabus Topic</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Study Guide & FAQs (AdSense High-Value Content) */}
        {activeTab === 'guide' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-10 rounded-3xl space-y-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                <span>{subject?.name} ({subject?.code}) Course Study Guide</span>
              </h2>

              <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                {subject?.overviewText || `Welcome to the comprehensive preparation guide for ${subject?.name} (${subject?.code}). This course covers fundamental concepts, core theories, midterm topics, and final-term exam preparation materials. Use the interactive modules and past papers provided below to test your readiness for VU term exams.`}
              </div>
            </div>

            {/* Course FAQs Accordion */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-4 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-indigo-500" />
                <span>Frequently Asked Exam Questions (FAQs)</span>
              </h3>

              {faqsList.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  No FAQs added yet for this subject.
                </div>
              ) : (
                <div className="space-y-3">
                  {faqsList.map((faq, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex justify-between items-center cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {openFaqIndex === index ? <ChevronUp className="w-4 h-4 text-blue-500" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {openFaqIndex === index && (
                        <div className="p-4 pt-0 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 font-medium leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Notes & Past Papers */}
        {activeTab === 'notes' && (
          <div className="space-y-8">
            {/* Handouts & Lecture Notes */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>Handouts &amp; Summary Notes</span>
              </h3>

              {notesList.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  No notes or handouts uploaded yet for this subject.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notesList.map((note, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{note.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{note.description || note.category || 'Study Material'}</p>
                      </div>
                      {note.fileUrl && (
                        <a
                          href={note.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Papers Links */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>Solved Past Papers Links</span>
              </h3>

              {pastPapersList.length === 0 ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl">
                  No past papers linked yet for this subject.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastPapersList.map((paper, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{paper.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-900">
                          {paper.term || 'Midterm'} {paper.year || '2025'}
                        </span>
                      </div>
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Paper</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Video Lectures */}
        {activeTab === 'videos' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-red-500" />
              <span>YouTube Video Tutorials &amp; Lectures</span>
            </h2>

            {videoList.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 py-10 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl">
                No video lectures linked yet for this subject.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videoList.map((vid, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{vid.topic || 'Video Tutorial'}</span>
                      <span className="text-red-500">{vid.duration || 'Video'}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{vid.title}</h4>

                    {vid.youtubeUrl && (
                      <a
                        href={vid.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Watch on YouTube</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

       
      </main>
    </div>
  );
}
