'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  Sliders,
  Play,
  Shuffle,
  Layers,
  HelpCircle,
  FileText,
  Clock,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';

export default function CustomQuizModal({
  isOpen,
  onClose,
  subject,
  questions = []
}) {
  const router = useRouter();

  // Maximum chapter number derived from subject or questions
  const totalChaptersCount = useMemo(() => {
    let max = subject?.totalChapters || 45;
    questions.forEach(q => {
      const chNum = typeof q.chapter === 'number' ? q.chapter : parseInt(q.chapter, 10) || 1;
      if (chNum > max) max = chNum;
    });
    return Math.max(max, 1);
  }, [subject, questions]);

  // Chapter Selection State
  // Mode: 'range' | 'custom'
  const [chapterSelectionType, setChapterSelectionType] = useState('range');
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(totalChaptersCount);

  // Set of selected chapter numbers for 'custom' mode
  const [selectedChapters, setSelectedChapters] = useState(() => {
    const set = new Set();
    for (let i = 1; i <= totalChaptersCount; i++) set.add(i);
    return set;
  });

  // Filter & Options State
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'MCQ' | 'SHORT' | 'LONG'
  const [questionLimit, setQuestionLimit] = useState(20); // 5, 10, 20, 30, 50, 0 (all)
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [quizMode, setQuizMode] = useState('practice'); // 'practice' | 'learn'
  // Active Chapter Numbers Array
  const activeChapterNumbers = useMemo(() => {
    if (chapterSelectionType === 'range') {
      const min = Math.min(startChapter, endChapter);
      const max = Math.max(startChapter, endChapter);
      const arr = [];
      for (let i = min; i <= max; i++) arr.push(i);
      return arr;
    }
    return Array.from(selectedChapters).sort((a, b) => a - b);
  }, [chapterSelectionType, startChapter, endChapter, selectedChapters]);

  // Compute Available Questions matching the criteria
  const matchingQuestions = useMemo(() => {
    const activeSet = new Set(activeChapterNumbers);

    return questions.filter(q => {
      const chNum = typeof q.chapter === 'number' ? q.chapter : parseInt(q.chapter, 10) || 1;
      if (!activeSet.has(chNum)) return false;

      if (selectedCategory !== 'ALL') {
        const cat = (q.category || 'MCQ').toUpperCase();
        if (cat !== selectedCategory.toUpperCase()) return false;
      }

      return true;
    });
  }, [questions, activeChapterNumbers, selectedCategory]);

  if (!isOpen) return null;

  // Preset Handlers
  const applyPresetMidterm = () => {
    setChapterSelectionType('range');
    setStartChapter(1);
    setEndChapter(Math.min(22, totalChaptersCount));
  };

  const applyPresetFinals = () => {
    setChapterSelectionType('range');
    setStartChapter(Math.min(23, totalChaptersCount));
    setEndChapter(totalChaptersCount);
  };

  const applyPresetAll = () => {
    setChapterSelectionType('range');
    setStartChapter(1);
    setEndChapter(totalChaptersCount);
    const fullSet = new Set();
    for (let i = 1; i <= totalChaptersCount; i++) fullSet.add(i);
    setSelectedChapters(fullSet);
  };

  const toggleChapterPill = (chNum) => {
    if (chapterSelectionType === 'range') {
      // Switch to custom mode with active range
      const newSet = new Set(activeChapterNumbers);
      if (newSet.has(chNum)) newSet.delete(chNum);
      else newSet.add(chNum);
      setSelectedChapters(newSet);
      setChapterSelectionType('custom');
    } else {
      setSelectedChapters(prev => {
        const next = new Set(prev);
        if (next.has(chNum)) next.delete(chNum);
        else next.add(chNum);
        return next;
      });
    }
  };

  // Launch Custom Quiz
  const handleStartCustomQuiz = () => {
    if (matchingQuestions.length === 0) return;

    let finalQuestions = [...matchingQuestions];

    // Shuffle if enabled
    if (shuffleQuestions) {
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5);
    }

    // Apply limit
    if (questionLimit > 0 && finalQuestions.length > questionLimit) {
      finalQuestions = finalQuestions.slice(0, questionLimit);
    }

    const rangeLabel = chapterSelectionType === 'range' 
      ? `Chapters ${Math.min(startChapter, endChapter)} - ${Math.max(startChapter, endChapter)}`
      : `Selected ${activeChapterNumbers.length} Chapters`;

    const customQuizData = {
      isCustom: true,
      title: `${subject?.code || 'Custom'} Practice - ${rangeLabel}`,
      subjectId: subject?.id || subject?._id,
      subjectName: subject?.name,
      questions: finalQuestions,
      category: selectedCategory === 'ALL' ? 'MCQ' : selectedCategory,
      totalCount: finalQuestions.length,
      mode: quizMode
    };

    // Save custom quiz session in sessionStorage for smooth reload fallback
    try {
      sessionStorage.setItem('activeCustomQuiz', JSON.stringify(customQuizData));
    } catch (e) {
      console.warn('Could not save to sessionStorage:', e);
    }

    onClose();

    // Navigate in Next.js router
    router.push(`/practice/custom?mode=${quizMode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-6 relative my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close custom quiz generator"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Custom Quiz Builder
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Create a personalized quiz by selecting chapters, categories, and question limits for {subject?.name || 'this subject'}.
            </p>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3 rounded-2xl">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Quick Chapter Presets
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={applyPresetMidterm}
              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              📘 Midterm (Ch 1 – {Math.min(22, totalChaptersCount)})
            </button>
            {totalChaptersCount > 22 && (
              <button
                onClick={applyPresetFinals}
                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                📕 Finals (Ch 23 – {totalChaptersCount})
              </button>
            )}
            <button
              onClick={applyPresetAll}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              🎯 Full Syllabus (Ch 1 – {totalChaptersCount})
            </button>
          </div>
        </div>

        {/* Chapter Selection Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Chapter Selection
            </label>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setChapterSelectionType('range')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chapterSelectionType === 'range'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Range Slider
              </button>
              <button
                onClick={() => setChapterSelectionType('custom')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  chapterSelectionType === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Multi-Select Grid
              </button>
            </div>
          </div>

          {/* Range Slider Mode */}
          {chapterSelectionType === 'range' && (
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    From Chapter: <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{startChapter}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={totalChaptersCount}
                    value={startChapter}
                    onChange={(e) => setStartChapter(Math.min(parseInt(e.target.value, 10), endChapter))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    To Chapter: <span className="text-indigo-600 dark:text-indigo-400 text-sm font-extrabold">{endChapter}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={totalChaptersCount}
                    value={endChapter}
                    onChange={(e) => setEndChapter(Math.max(parseInt(e.target.value, 10), startChapter))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                Selected Chapters Range: <span className="font-bold text-indigo-600 dark:text-indigo-400">Chapter {Math.min(startChapter, endChapter)} to Chapter {Math.max(startChapter, endChapter)}</span> ({activeChapterNumbers.length} Chapters total)
              </div>
            </div>
          )}

          {/* Multi-Select Chapters Grid */}
          <div className="space-y-2">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center">
              <span>Click chapter pills to toggle inclusion:</span>
              <span className="font-bold text-indigo-500">{activeChapterNumbers.length} / {totalChaptersCount} selected</span>
            </div>
            <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
              {Array.from({ length: totalChaptersCount }, (_, i) => i + 1).map((chNum) => {
                const isSelected = activeChapterNumbers.includes(chNum);
                return (
                  <button
                    key={chNum}
                    onClick={() => toggleChapterPill(chNum)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400'
                    }`}
                  >
                    Ch {chNum}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Question Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories (MCQs & Subjective)</option>
              <option value="MCQ">MCQs Only</option>
              <option value="SHORT">Short Questions Only</option>
              <option value="LONG">Long Questions Only</option>
            </select>
          </div>

          {/* Question Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
              Number of Questions
            </label>
            <select
              value={questionLimit}
              onChange={(e) => setQuestionLimit(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions (Recommended)</option>
              <option value={30}>30 Questions</option>
              <option value={50}>50 Questions</option>
              <option value={0}>All Matching Questions ({matchingQuestions.length})</option>
            </select>
          </div>
        </div>

        {/* Toggles & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
              Randomize Question Order
            </div>
          </label>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setQuizMode('practice')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                quizMode === 'practice'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => setQuizMode('learn')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                quizMode === 'learn'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Learn Mode
            </button>
          </div>
        </div>

        {/* Live Matching Summary Footer */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">Available Matching Questions</span>
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {matchingQuestions.length} Questions <span className="text-xs font-bold text-slate-400 dark:text-slate-500">found for your selection</span>
            </span>
          </div>

          <button
            onClick={handleStartCustomQuiz}
            disabled={matchingQuestions.length === 0}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              matchingQuestions.length > 0
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30 hover:scale-[1.02]'
                : 'bg-slate-400 dark:bg-slate-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Start Custom Quiz ({questionLimit > 0 ? Math.min(questionLimit, matchingQuestions.length) : matchingQuestions.length})
          </button>
        </div>

      </div>
    </div>
  );
}
