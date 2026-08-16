'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LearnModeView from '@/components/LearnModeView';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import CodeBlock from '@/components/CodeBlock';
import useLanguageStore from '@/store/useLanguageStore';
import useSettingsStore from '@/store/useSettingsStore';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Tag,
  PlayCircle,
  Award,
  Flag,
  SkipForward,
  Grid,
  X,
  Star,
  Sparkles,
  FileCode2
} from 'lucide-react';

const hasRealCode = (str) => {
  if (typeof str !== 'string') return false;
  const t = str.trim().toLowerCase();
  return t.length > 0 && !['c++', 'cpp', 'code', 'none', 'n/a', 'c', 'null', 'undefined', 'text'].includes(t);
};

export default function PracticeEngine() {
  const params = useParams();
  const code = params?.code;
  const quizId = params?.quizId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUrduEnabled, isBilingual } = useLanguageStore();
  const { questionSize, optionSize, explanationSize, urduSize } = useSettingsStore();

  const activeMode = searchParams ? (searchParams.get('mode') || 'practice') : 'practice';

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showAnswerMap, setShowAnswerMap] = useState({});
  const [showExplanationMap, setShowExplanationMap] = useState({});
  const [showSolutionMap, setShowSolutionMap] = useState({});
  const [flaggedMap, setFlaggedMap] = useState({});
  const [skippedMap, setSkippedMap] = useState({});
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const quizRes = await api.get(`/quizzes/${quizId}`);
        const quizData = quizRes?.data || quizRes;
        setQuiz(quizData);

        let qList = Array.isArray(quizData?.questions) ? quizData.questions : [];
        if (qList.length === 0) {
          const targetCode = code || quizData?.subjectCode || (typeof quizData?.subjectId === 'object' ? quizData.subjectId?.code : null);
          if (targetCode) {
            const fallbackRes = await api.get(`/questions?subjectCode=${targetCode}&includeImages=true`);
            qList = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.data || []);
          }
        }
        setQuestions(qList);
        setError(null);
      } catch (err) {
        setError('Failed to load quiz module. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchData();
  }, [quizId, code]);

  // Timed Exam Mode Countdown Timer
  useEffect(() => {
    if (activeMode === 'exam' && quiz?.timeLimitMinutes && !isFinished) {
      const initialSeconds = (parseInt(quiz.timeLimitMinutes, 10) || 15) * 60;
      setTimeLeftSeconds(initialSeconds);

      const interval = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsFinished(true);
            toast.error('Time limit expired! Your exam has been submitted automatically.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeMode, quiz?.timeLimitMinutes, isFinished]);

  const setMode = (modeName) => {
    const path = typeof window !== 'undefined' ? window.location.pathname : `/practice/${quizId}`;
    router.push(`${path}?mode=${modeName}`);
  };

  const activeQuestion = questions[currentIndex];
  const qType = quiz?.category || 'MCQ';

  const handleOptionSelect = useCallback((optionIndex) => {
    if (!activeQuestion) return;
    const qId = activeQuestion.id || activeQuestion._id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex
    }));
  }, [activeQuestion]);

  const toggleRevealAnswer = useCallback((qId) => {
    setShowAnswerMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }, []);

  const toggleRevealExplanation = useCallback((qId) => {
    setShowExplanationMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }, []);

  const toggleRevealSolution = useCallback((qId) => {
    setShowSolutionMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }, []);

  const toggleFlagQuestion = useCallback((qId) => {
    setFlaggedMap((prev) => ({ ...prev, [qId]: !prev[qId] }));
  }, []);

  const calculateScore = useCallback(() => {
    let score = 0;
    questions.forEach((q) => {
      const qId = q.id || q._id;
      if (answers[qId] !== undefined && Number(answers[qId]) === Number(q.correctOption)) {
        score += 1;
      }
    });
    return score;
  }, [questions, answers]);

  const handleSkipQuestion = useCallback(() => {
    if (activeQuestion) {
      const qId = activeQuestion.id || activeQuestion._id;
      setSkippedMap((prev) => ({ ...prev, [qId]: true }));
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [activeQuestion, currentIndex, questions.length]);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= questions.length) {
      setCurrentIndex(target - 1);
      setIsGridOpen(false);
      setJumpInput('');
    } else {
      toast.error(`Please enter a valid question number between 1 and ${questions.length}`);
    }
  };

  if (loading) {
    return (
      <RealisticPageLoader
        title="Loading Practice Quiz Engine..."
        subtitle="Fetching quiz metadata and generating question bank..."
        steps={[
          "Connecting to database server...",
          "Fetching question bank payload...",
          "Processing chapter & topic tags...",
          "Initializing interactive engine..."
        ]}
      />
    );
  }

  if (quiz?.status === 'upcoming') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="bg-slate-900 border border-amber-900/50 rounded-3xl p-8 shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-amber-950/60 text-amber-400 border border-amber-900 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            ⏳
          </div>
          <h2 className="text-2xl font-extrabold text-white">{quiz.title}</h2>
          <div className="inline-block px-3 py-1 bg-amber-950/70 text-amber-300 border border-amber-800 rounded-full text-xs font-extrabold uppercase tracking-wider">
            ⏳ Upcoming Soon
          </div>
          <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
            This quiz module is currently scheduled as <strong>Upcoming Soon</strong>. The questions and preparation material are being finalized by faculty and will be released shortly. Please check back soon!
          </p>
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => router.push(code ? `/subjects/${code}` : '/subjects')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Subject Modules</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 p-4 rounded-2xl text-sm mb-4">
          {error || 'No questions found for this quiz module.'}
        </div>
        <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold flex items-center cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header & Mode Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        <button
          onClick={() => {
            if (code) {
              router.push(`/subjects/${code}`);
            } else if (quiz?.subjectId) {
              const target = typeof quiz.subjectId === 'object' ? (quiz.subjectId.code || quiz.subjectId._id) : quiz.subjectId;
              router.push(`/subjects/${target}`);
            } else {
              router.back();
            }
          }}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold flex items-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Subject
        </button>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setMode('learn')}
            className={`px-3.5 py-2 rounded-xl flex items-center transition-all cursor-pointer ${
              activeMode === 'learn'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            Learn &amp; Review
          </button>

          <button
            onClick={() => setMode('practice')}
            className={`px-3.5 py-2 rounded-xl flex items-center transition-all cursor-pointer ${
              activeMode === 'practice'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
            Practice Quiz
          </button>

          <button
            onClick={() => setMode('exam')}
            className={`px-3.5 py-2 rounded-xl flex items-center transition-all cursor-pointer ${
              activeMode === 'exam'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 mr-1.5" />
            Timed Exam
          </button>
        </div>
      </div>

      {/* RENDER MODE CONTENT */}
      {activeMode === 'learn' ? (
        <LearnModeView quiz={quiz} questions={questions} />
      ) : isFinished ? (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-xl">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Quiz Completed!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{quiz.title}</p>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl grid grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 text-xs font-semibold block">Total</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{questions.length}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-semibold block">Score</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calculateScore()}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs font-semibold block">Accuracy</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round((calculateScore() / questions.length) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={() => {
                  setAnswers({});
                  setIsFinished(false);
                  setCurrentIndex(0);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm cursor-pointer shadow-md"
              >
                Retry Quiz
              </button>
              <button
                onClick={() => router.push(code ? `/subjects/${code}` : '/subjects')}
                className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-6 rounded-xl text-sm cursor-pointer"
              >
                Back to Subject
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Practice Engine Question View */
        <div className="space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {activeMode === 'exam' ? '⏱️ Timed Exam Mode' : '🎯 Interactive Practice Mode'}
              </span>
              {activeMode === 'exam' && timeLeftSeconds !== null && (
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold flex items-center border ${
                  timeLeftSeconds < 180
                    ? 'bg-red-950/80 text-red-300 border-red-800 animate-pulse'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}>
                  ⏱️ {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, '0')}
                </span>
              )}
              {flaggedMap[activeQuestion?.id || activeQuestion?._id] && (
                <span className="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded-full text-[11px] font-extrabold flex items-center gap-1">
                  <Flag className="w-3 h-3 text-purple-400 fill-purple-400" /> Flagged
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Question Navigator Drawer Button */}
              <button
                onClick={() => setIsGridOpen(true)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold flex items-center cursor-pointer transition-colors"
              >
                <Grid className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                <span>Jump / Grid ({currentIndex + 1}/{questions.length})</span>
              </button>

              {/* Flag Question Button */}
              <button
                onClick={() => toggleFlagQuestion(activeQuestion.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center cursor-pointer border transition-colors ${
                  flaggedMap[activeQuestion.id]
                    ? 'bg-purple-900/40 text-purple-300 border-purple-700 font-extrabold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-purple-950/30'
                }`}
              >
                <Flag className={`w-3.5 h-3.5 mr-1 ${flaggedMap[activeQuestion.id] ? 'fill-purple-400 text-purple-400' : ''}`} />
                {flaggedMap[activeQuestion.id] ? 'Flagged' : 'Flag'}
              </button>
            </div>
          </div>

          {/* Active Question Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {activeQuestion.chapter && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center font-bold border border-slate-200 dark:border-slate-700">
                  <BookOpen className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" /> Chapter {activeQuestion.chapter}
                </span>
              )}
              {activeQuestion.topic && (
                <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center font-semibold border border-slate-200 dark:border-slate-700">
                  <Tag className="w-3 h-3 mr-1 text-indigo-600 dark:text-indigo-400" /> {activeQuestion.topic}
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                activeQuestion.difficulty === 'Easy'
                  ? 'bg-green-950/40 text-green-400 border-green-900'
                  : activeQuestion.difficulty === 'Hard'
                    ? 'bg-red-950/40 text-red-400 border-red-900'
                    : 'bg-amber-950/40 text-amber-400 border-amber-900'
              }`}>
                {activeQuestion.difficulty || 'Medium'}
              </span>

              {activeQuestion.isStarred && (
                <span className="bg-amber-950/50 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  ⭐ Starred
                </span>
              )}
              {activeQuestion.isImportant && (
                <span className="bg-rose-950/50 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  🎯 Important
                </span>
              )}
              {activeQuestion.isConceptual && (
                <span className="bg-cyan-950/50 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  💡 Conceptual
                </span>
              )}
              {activeQuestion.isRepeated && (
                <span className="bg-purple-950/50 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  🔄 Repeated
                </span>
              )}
              {((activeQuestion.codeSnippet && !['c++', 'cpp', 'code', 'none', 'n/a'].includes(activeQuestion.codeSnippet.trim().toLowerCase())) || (activeQuestion.solutionCode && !['c++', 'cpp', 'code', 'none', 'n/a'].includes(activeQuestion.solutionCode.trim().toLowerCase()))) && (
                <span className="bg-cyan-950/50 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase">
                  💻 Code
                </span>
              )}
            </div>

            {/* Multi-Image Attachments Gallery */}
            {((activeQuestion.imagesBase64 && activeQuestion.imagesBase64.length > 0) ? activeQuestion.imagesBase64 : (activeQuestion.imageBase64 ? [activeQuestion.imageBase64] : [])).length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center py-2">
                {((activeQuestion.imagesBase64 && activeQuestion.imagesBase64.length > 0) ? activeQuestion.imagesBase64 : [activeQuestion.imageBase64]).map((img, imgIdx) => (
                  <img key={imgIdx} src={img} alt={`Diagram #${imgIdx + 1}`} className="max-h-72 rounded-xl border border-slate-200 dark:border-slate-800 object-contain shadow-md" />
                ))}
              </div>
            )}

            {/* Question Code Snippet */}
            {(() => {
              const hasProblemCode = hasRealCode(activeQuestion.codeSnippet);
              const hasSolutionCode = hasRealCode(activeQuestion.solutionCode);

              return (
                <>
                  {hasProblemCode && (
                    <CodeBlock code={activeQuestion.codeSnippet} language={activeQuestion.codeLanguage || activeQuestion.codeSnippetLanguage || activeQuestion.language || 'cpp'} title="Question Code Snippet" />
                  )}

                  {isBilingual() && activeQuestion.questionTextUrdu ? (
                    <div className="space-y-4">
                      <h2 style={{ fontSize: `${questionSize}px` }} className="font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                        {activeQuestion.questionText}
                      </h2>
                      <h2 style={{ fontSize: `${urduSize}px` }} className="font-urdu font-bold text-indigo-800 dark:text-indigo-200 leading-relaxed whitespace-pre-wrap">
                        {activeQuestion.questionTextUrdu}
                      </h2>
                    </div>
                  ) : (
                    <h2 
                      style={{ fontSize: `${isUrduEnabled() && activeQuestion.questionTextUrdu ? urduSize : questionSize}px` }}
                      className={`font-bold leading-relaxed whitespace-pre-wrap ${isUrduEnabled() && activeQuestion.questionTextUrdu ? 'font-urdu text-indigo-800 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}
                    >
                      {isUrduEnabled() && activeQuestion.questionTextUrdu ? activeQuestion.questionTextUrdu : activeQuestion.questionText}
                    </h2>
                  )}

                  {qType === 'MCQ' ? (
                    <div className="space-y-3">
                      {activeQuestion.options?.map((opt, i) => {
                        const isSelected = answers[activeQuestion.id] === i;
                        const isRevealed = showAnswerMap[activeQuestion.id] || isSelected;
                        const isCorrectOpt = i === activeQuestion.correctOption;

                        let btnStyle = "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200";
                        if (isRevealed) {
                          if (isCorrectOpt) btnStyle = "border-green-600/50 bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200 font-bold";
                          else if (isSelected && !isCorrectOpt) btnStyle = "border-red-600/50 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => handleOptionSelect(i)}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center cursor-pointer ${btnStyle} ${(!isBilingual() && isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <span className={`w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 ${(!isBilingual() && isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? 'ml-3' : 'mr-3'}`}>
                              {['A', 'B', 'C', 'D'][i] || i + 1}
                            </span>
                            
                            <div className="flex-1 flex flex-col space-y-1">
                               {isBilingual() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i] ? (
                                 <>
                                   <span style={{ fontSize: `${optionSize}px` }} className="font-medium text-left">{opt}</span>
                                   <span style={{ fontSize: `${urduSize}px` }} className="font-urdu text-indigo-700 dark:text-indigo-300 text-right w-full block">{activeQuestion.optionsUrdu[i]}</span>
                                 </>
                               ) : (
                                 <span 
                                   style={{ fontSize: `${(isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? urduSize : optionSize}px` }}
                                   className={`font-medium ${(isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? 'font-urdu' : ''}`}
                                 >
                                   {isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i] ? activeQuestion.optionsUrdu[i] : opt}
                                 </span>
                               )}
                            </div>

                            {isRevealed && isCorrectOpt && <CheckCircle2 className={`w-5 h-5 text-green-600 dark:text-green-400 ${(!isBilingual() && isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? 'mr-auto ml-2' : 'ml-2'}`} />}
                            {isRevealed && isSelected && !isCorrectOpt && <XCircle className={`w-5 h-5 text-red-600 dark:text-red-400 ${(!isBilingual() && isUrduEnabled() && activeQuestion.optionsUrdu && activeQuestion.optionsUrdu[i]) ? 'mr-auto ml-2' : 'ml-2'}`} />}
                          </button>
                        );
                      })}

                      {/* Solution code rendering when answer revealed via options */}
                      {(showAnswerMap[activeQuestion.id] || answers[activeQuestion.id] !== undefined) && hasSolutionCode && (
                        <div className="pt-2">
                          <CodeBlock code={activeQuestion.solutionCode} language={activeQuestion.solutionCodeLanguage || activeQuestion.solutionLanguage || 'cpp'} title="Code Implementation Solution" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeQuestion.solution && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-slate-300 text-sm space-y-2">
                          <span className={`font-bold text-blue-600 dark:text-blue-400 block mb-2 ${(isUrduEnabled() && activeQuestion.solutionUrdu) ? 'text-right' : ''}`}>Solution & Answer Key:</span>
                          
                          {isBilingual() && activeQuestion.solutionUrdu ? (
                            <div className="space-y-3">
                              <p style={{ fontSize: `${explanationSize}px` }} className="whitespace-pre-wrap leading-relaxed">{activeQuestion.solution}</p>
                              <p style={{ fontSize: `${urduSize}px` }} className="font-urdu whitespace-pre-wrap leading-relaxed">{activeQuestion.solutionUrdu}</p>
                            </div>
                          ) : (
                            <p 
                              style={{ fontSize: `${(isUrduEnabled() && activeQuestion.solutionUrdu) ? urduSize : explanationSize}px` }}
                              className={`whitespace-pre-wrap leading-relaxed ${(isUrduEnabled() && activeQuestion.solutionUrdu) ? 'font-urdu' : ''}`}
                            >
                              {isUrduEnabled() && activeQuestion.solutionUrdu ? activeQuestion.solutionUrdu : activeQuestion.solution}
                            </p>
                          )}
                        </div>
                      )}

                      {hasSolutionCode && (
                        <CodeBlock code={activeQuestion.solutionCode} language={activeQuestion.solutionCodeLanguage || activeQuestion.solutionLanguage || 'cpp'} title="Code Implementation Solution" />
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Toolbar */}
            {(() => {
              const solText = (activeQuestion.solution || '').trim();
              const expText = (activeQuestion.explanation || '').trim();
              const isSame = solText && expText && solText.toLowerCase() === expText.toLowerCase();

              return (
                <>
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {qType === 'MCQ' && (
                      <button
                        onClick={() => toggleRevealAnswer(activeQuestion.id)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center cursor-pointer"
                      >
                        {showAnswerMap[activeQuestion.id] ? <EyeOff className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                        {showAnswerMap[activeQuestion.id] ? 'Hide Answer' : 'Reveal Answer'}
                      </button>
                    )}

                    {isSame ? (
                      <button
                        onClick={() => {
                          toggleRevealExplanation(activeQuestion.id);
                          setShowSolutionMap(prev => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }));
                        }}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl flex items-center cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        {showExplanationMap[activeQuestion.id] ? 'Hide Solution & Explanation' : 'View Solution & Explanation'}
                      </button>
                    ) : (
                      <>
                        {expText && (
                          <button
                            onClick={() => toggleRevealExplanation(activeQuestion.id)}
                            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl flex items-center cursor-pointer"
                          >
                            <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            {showExplanationMap[activeQuestion.id] ? 'Hide Explanation' : 'Explanation'}
                          </button>
                        )}

                        {(solText || hasRealCode(activeQuestion.solutionCode)) && (
                          <button
                            onClick={() => toggleRevealSolution(activeQuestion.id)}
                            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl flex items-center cursor-pointer"
                          >
                            <FileCode2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                            {showSolutionMap[activeQuestion.id] ? 'Hide Solution' : 'View Solution'}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* View Solution Card Drawer */}
                  {showSolutionMap[activeQuestion.id] && (!isSame || !showExplanationMap[activeQuestion.id]) && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                      <span className={`font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider text-[11px] ${(isUrduEnabled() && activeQuestion.solutionUrdu) ? 'text-right' : ''}`}>Solution & Answer Key:</span>
                      {solText ? (
                         isBilingual() && activeQuestion.solutionUrdu ? (
                            <div className="space-y-3">
                              <p style={{ fontSize: `${explanationSize}px` }} className="whitespace-pre-wrap leading-relaxed">{solText}</p>
                              <p style={{ fontSize: `${urduSize}px` }} className="font-urdu whitespace-pre-wrap leading-relaxed">{activeQuestion.solutionUrdu}</p>
                            </div>
                         ) : (
                            <p 
                              style={{ fontSize: `${(isUrduEnabled() && activeQuestion.solutionUrdu) ? urduSize : explanationSize}px` }}
                              className={`whitespace-pre-wrap leading-relaxed ${(isUrduEnabled() && activeQuestion.solutionUrdu) ? 'font-urdu' : ''}`}
                            >
                              {isUrduEnabled() && activeQuestion.solutionUrdu ? activeQuestion.solutionUrdu : solText}
                            </p>
                         )
                      ) : qType === 'MCQ' && Array.isArray(activeQuestion.options) ? (
                        <p className={`font-semibold text-sm ${(isUrduEnabled() && activeQuestion.optionsUrdu) ? 'flex flex-row-reverse text-right' : ''}`}>
                          <span className={(isUrduEnabled() && activeQuestion.optionsUrdu) ? 'ml-1' : 'mr-1'}>Correct Option: {String.fromCharCode(65 + (activeQuestion.correctOption || 0))}.</span>
                          <span className={(isUrduEnabled() && activeQuestion.optionsUrdu) ? 'font-urdu' : ''}>
                             {isUrduEnabled() && activeQuestion.optionsUrdu ? activeQuestion.optionsUrdu[activeQuestion.correctOption || 0] : activeQuestion.options[activeQuestion.correctOption || 0]}
                          </span>
                        </p>
                      ) : (
                        <p className="italic text-slate-400">No additional solution text specified.</p>
                      )}

                      {hasRealCode(activeQuestion.solutionCode) && (
                        <div className="pt-2">
                          <CodeBlock code={activeQuestion.solutionCode} language={activeQuestion.solutionCodeLanguage || activeQuestion.solutionLanguage || 'cpp'} title="Code Implementation Solution" />
                        </div>
                      )}
                    </div>
                  )}

                  {showExplanationMap[activeQuestion.id] && expText && (
                    <div className={`p-4 sm:p-5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-indigo-950 dark:text-indigo-100 leading-relaxed space-y-1.5 shadow-sm ${(isUrduEnabled() && activeQuestion.explanationUrdu) ? 'text-right' : ''}`}>
                      <span className="font-extrabold block text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2">
                        {isSame ? 'Solution & Detailed Explanation:' : 'Detailed Explanation:'}
                      </span>
                      
                      {isBilingual() && activeQuestion.explanationUrdu ? (
                         <div className="space-y-3">
                           <p style={{ fontSize: `${explanationSize}px` }} className="font-medium whitespace-pre-wrap leading-relaxed text-left">{expText}</p>
                           <p style={{ fontSize: `${urduSize}px` }} className="font-urdu whitespace-pre-wrap leading-relaxed">{activeQuestion.explanationUrdu}</p>
                         </div>
                      ) : (
                         <p 
                           style={{ fontSize: `${(isUrduEnabled() && activeQuestion.explanationUrdu) ? urduSize : explanationSize}px` }}
                           className={`font-medium whitespace-pre-wrap leading-relaxed ${(isUrduEnabled() && activeQuestion.explanationUrdu) ? 'font-urdu' : ''}`}
                         >
                           {isUrduEnabled() && activeQuestion.explanationUrdu ? activeQuestion.explanationUrdu : expText}
                         </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Navigation Footer */}
          <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </button>

            {/* Skip Question Button */}
            <button
              onClick={handleSkipQuestion}
              className="px-4 py-2.5 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center cursor-pointer transition-colors"
            >
              <SkipForward className="w-4 h-4 mr-1.5 text-amber-500" /> Skip Question
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => setIsFinished(true)}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Complete Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center cursor-pointer shadow-md"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      )}
      {/* Question Grid / Jump Modal */}
      {isGridOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Grid className="w-5 h-5 text-blue-400" /> Question Navigator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Jump directly to any question or review status.</p>
              </div>
              <button onClick={() => setIsGridOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Direct Jump Input Form */}
            <form onSubmit={handleJumpSubmit} className="flex gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs">
              <input
                type="number"
                min="1"
                max={questions.length}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={`Jump to Question (1 - ${questions.length})...`}
                className="flex-1 px-3 py-2 bg-transparent text-white border-none outline-none font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Go to Question
              </button>
            </form>

            {/* Status Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Answered</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Skipped</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Flagged</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Unanswered</span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto p-1">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isSkipped = skippedMap[q.id];
                const isFlagged = flaggedMap[q.id];
                const isCurrent = idx === currentIndex;

                let btnBg = 'bg-slate-800 text-slate-300 border-slate-700';
                if (isAnswered) btnBg = 'bg-emerald-950 text-emerald-300 border-emerald-800 font-bold';
                else if (isSkipped) btnBg = 'bg-amber-950 text-amber-300 border-amber-800 font-bold';

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsGridOpen(false);
                    }}
                    className={`relative p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${btnBg} ${
                      isCurrent ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 rounded-full flex items-center justify-center text-[9px] text-white">
                        🚩
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
