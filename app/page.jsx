'use client';
import { useEffect, useState } from 'react';
import useQuizStore from '@/store/useQuizStore';
import SubjectCard from '@/components/SubjectCard';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import { Flame, Trophy, Bookmark, Trash2, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Home() {
  const { subjects, loading, fetchSubjects } = useQuizStore();
  const [activeTab, setActiveTab] = useState('subjects');

  const [streak, setStreak] = useState(0);
  const [totalSolved, setTotalSolved] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

  useEffect(() => {
    fetchSubjects();

    const savedSolved = localStorage.getItem('total_questions_solved') || '0';
   // setTotalSolved(parseInt(savedSolved, 10));

    const lastStudyDate = localStorage.getItem('last_study_date');
    const currentStreak = localStorage.getItem('study_streak') || '1';
    const today = new Date().toDateString();

    if (lastStudyDate) {
      const lastDate = new Date(lastStudyDate);
      const diffTime = Math.abs(new Date(today) - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        setStreak(parseInt(currentStreak, 10));
      } else if (diffDays > 1) {
        setStreak(1);
        localStorage.setItem('study_streak', '1');
      } else {
        setStreak(parseInt(currentStreak, 10));
      }
    } else {
      setStreak(1);
      localStorage.setItem('study_streak', '1');
      localStorage.setItem('last_study_date', today);
    }

    const savedBookmarks = localStorage.getItem('bookmarked_questions');
    if (savedBookmarks) {
      try {
        setBookmarkedQuestions(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error(e);
      }
    }
  }, [fetchSubjects]);

  const removeBookmark = (questionId) => {
    const updated = bookmarkedQuestions.filter(q => q.id !== questionId);
    setBookmarkedQuestions(updated);
    localStorage.setItem('bookmarked_questions', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider backdrop-blur-md">
                Virtual University Past Papers Portal
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
                Master VU Exams with VU SIGMA
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-xl">
                Prepare for Midterm &amp; Final Term exams with solved past papers, MCQs, short &amp; long questions, chapter topic tags, and AI study assistance.
              </p>
            </div>

            {/* Streak & Stats Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center space-x-3 border border-white/20">
                <div className="p-2 bg-amber-500 rounded-xl text-white shadow-sm animate-bounce">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Study Streak</p>
                  <p className="text-xl font-bold">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center space-x-3 border border-white/20">
                <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-sm">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 font-medium uppercase tracking-wider">Questions Solved</p>
                  <p className="text-xl font-bold">{totalSolved}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            All Subjects
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Bookmarked Questions
            {bookmarkedQuestions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-400 text-gray-900 rounded-full text-xs font-bold">
                {bookmarkedQuestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'subjects' ? (
          loading ? (
            <RealisticPageLoader
              title="Loading Subjects & Portal Catalog..."
              subtitle="Fetching subjects, active modules, and question banks..."
              steps={[
                "Connecting to VU Portal API...",
                "Loading active course list...",
                "Fetching module counts...",
                "Preparing homepage catalog..."
              ]}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(Array.isArray(subjects) ? subjects : []).map(subject => (
                <SubjectCard key={subject.id || subject._id} subject={subject} />
              ))}
              {(!subjects || subjects.length === 0) && (
                <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No Subjects Available</h3>
                  <p>Check back later once the course materials are published.</p>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              <Bookmark className="w-6 h-6 mr-2 text-amber-500 fill-amber-500" /> Saved Revision Questions
            </h2>

            {bookmarkedQuestions.length === 0 ? (
              <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                <Bookmark className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Bookmarked Questions Yet</h3>
                <p className="text-sm">Star difficult questions during practice to revise them here before your exams!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <button
                      onClick={() => removeBookmark(q.id)}
                      className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-900">
                        {q.category || 'MCQ'}
                      </span>
                      {q.chapter && (
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                          {q.chapter}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 whitespace-pre-wrap pr-8">
                      {q.questionText}
                    </h3>

                    {q.category === 'MCQ' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {q.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-xl border text-sm font-medium flex items-center ${
                              i === q.correctOption
                                ? 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                            }`}
                          >
                            {i === q.correctOption && <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mr-2 shrink-0" />}
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 shrink-0 text-blue-600 dark:text-blue-400" />
                        <div><span className="font-bold">Explanation:</span> {q.explanation}</div>
                      </div>
                    )}

                    {q.solution && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                        <span className="font-bold block mb-1">Solution:</span>
                        <div className="whitespace-pre-wrap">{q.solution}</div>
                      </div>
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
