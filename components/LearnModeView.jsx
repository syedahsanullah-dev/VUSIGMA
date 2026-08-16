'use client';

import { useState } from 'react';
import { BookOpen, Tag, CheckCircle2, Lightbulb, Sparkles, Search, Check, Eye } from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';
import useLanguageStore from '@/store/useLanguageStore';
import useSettingsStore from '@/store/useSettingsStore';

const hasRealCode = (str) => {
  if (typeof str !== 'string') return false;
  const t = str.trim().toLowerCase();
  return t.length > 0 && !['c++', 'cpp', 'code', 'none', 'n/a', 'c', 'null', 'undefined', 'text'].includes(t);
};

export default function LearnModeView({ quiz, questions = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('ALL');
  const [showAllExplanations, setShowAllExplanations] = useState(true);
  const { isUrduEnabled, isBilingual } = useLanguageStore();
  const { questionSize, optionSize, explanationSize, urduSize } = useSettingsStore();

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-4 shadow-xl">
        <p className="text-slate-500 dark:text-slate-400 font-bold">No questions available to display in Learn Mode.</p>
      </div>
    );
  }

  // Extract unique chapters
  const chapters = ['ALL', ...new Set(questions.map((q) => q.chapter).filter(Boolean))];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !searchTerm ||
      q.questionText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.explanation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChapter = selectedChapter === 'ALL' || String(q.chapter) === String(selectedChapter);

    return matchesSearch && matchesChapter;
  });

  return (
    <div className="space-y-6">
      {/* Learn Mode Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-900/60 dark:via-teal-900/60 dark:to-cyan-900/60 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-emerald-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-200 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Study & Revision Mode</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">{quiz?.title || 'Learn Mode'}</h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl">
              All questions revealed with verified correct answers, complete explanations, and code solutions for active studying.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center">
            <span className="text-2xl font-black text-white">{filteredQuestions.length}</span>
            <span className="text-[11px] font-bold block text-emerald-100 uppercase tracking-wider">Questions</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-emerald-200" />
            <input
              type="text"
              placeholder="Search concepts, topics, questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md text-white placeholder-emerald-200 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>

          {chapters.length > 2 && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setSelectedChapter(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    selectedChapter === ch
                      ? 'bg-white text-emerald-800 shadow-md'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {ch === 'ALL' ? 'All Chapters' : `Ch ${ch}`}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowAllExplanations(!showAllExplanations)}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {showAllExplanations ? 'Hide Explanations' : 'Show Explanations'}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {filteredQuestions.map((q, idx) => {
          const hasProblemCode = hasRealCode(q.codeSnippet);
          const hasSolutionCode = hasRealCode(q.solutionCode);

          return (
            <div
              key={q.id || idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden"
            >
              {/* Question Header & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                    #{idx + 1}
                  </span>

                  {q.chapter && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <BookOpen className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" /> Chapter {q.chapter}
                    </span>
                  )}
                  {q.topic && (
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <Tag className="w-3 h-3 mr-1 text-teal-600 dark:text-teal-400" /> {q.topic}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold border ${
                      q.difficulty === 'Easy'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900'
                        : q.difficulty === 'Hard'
                        ? 'bg-red-950/40 text-red-400 border-red-900'
                        : 'bg-amber-950/40 text-amber-400 border-amber-900'
                    }`}
                  >
                    {q.difficulty || 'Medium'}
                  </span>

                  {/* Attribute Badges */}
                  {q.isStarred && <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded-lg text-xs font-bold">⭐ Starred</span>}
                  {q.isRepeated && <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-lg text-xs font-bold">🔁 Repeated</span>}
                  {q.isImportant && <span className="bg-red-950/60 text-red-300 border border-red-800/50 px-2 py-0.5 rounded-lg text-xs font-bold">⚠️ Important</span>}
                  {q.isConceptual && <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded-lg text-xs font-bold">💡 Conceptual</span>}
                </div>

                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified Answer Included
                </span>
              </div>

              {/* Code Snippet if present */}
              {hasProblemCode && (
                <CodeBlock
                  code={q.codeSnippet}
                  language={q.codeLanguage || q.codeSnippetLanguage || q.language || 'cpp'}
                  title="Question Code Snippet"
                />
              )}

              {/* Question Text */}
              {isBilingual() && q.questionTextUrdu ? (
                <div className="space-y-4">
                  <h3 style={{ fontSize: `${questionSize}px` }} className="font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {q.questionText}
                  </h3>
                  <h3 style={{ fontSize: `${urduSize}px` }} className="font-urdu font-bold text-emerald-800 dark:text-emerald-200 leading-relaxed whitespace-pre-wrap">
                    {q.questionTextUrdu}
                  </h3>
                </div>
              ) : (
                <h3 
                  style={{ fontSize: `${isUrduEnabled() && q.questionTextUrdu ? urduSize : questionSize}px` }}
                  className={`font-bold leading-relaxed whitespace-pre-wrap ${isUrduEnabled() && q.questionTextUrdu ? 'font-urdu text-emerald-800 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}
                >
                  {isUrduEnabled() && q.questionTextUrdu ? q.questionTextUrdu : q.questionText}
                </h3>
              )}

              {/* Question Diagrams / Image Gallery (Moved Above Options) */}
              {Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-xl p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {q.imagesBase64.map((img, imgIdx) => (
                    <img
                      key={imgIdx}
                      src={img.startsWith('data:') ? img : `data:image/png;base64,${img}`}
                      alt={`Diagram ${imgIdx + 1}`}
                      className="max-h-48 object-contain rounded-lg border border-slate-200 dark:border-slate-800"
                    />
                  ))}
                </div>
              ) : q.imageBase64 ? (
                <div className="rounded-xl p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <img
                    src={q.imageBase64.startsWith('data:') ? q.imageBase64 : `data:image/png;base64,${q.imageBase64}`}
                    alt="Diagram"
                    className="max-h-56 object-contain mx-auto rounded-lg"
                  />
                </div>
              ) : null}

              {/* MCQ Options Display */}
              {Array.isArray(q.options) && q.options.length > 0 && (
                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctOption;

                    return (
                      <div
                        key={optIdx}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center ${
                          isCorrect
                            ? 'border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400'
                        } ${(!isBilingual() && isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'flex-row-reverse text-right' : ''}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            (!isBilingual() && isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'ml-3' : 'mr-3'
                          } ${
                            isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                        </span>
                        
                        <div className="flex-1 flex flex-col space-y-1">
                           {isBilingual() && q.optionsUrdu && q.optionsUrdu[optIdx] ? (
                             <>
                               <span style={{ fontSize: `${optionSize}px` }} className="text-left">{opt}</span>
                               <span style={{ fontSize: `${urduSize}px` }} className="font-urdu text-emerald-700 dark:text-emerald-300 text-right w-full block">{q.optionsUrdu[optIdx]}</span>
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

                        {isCorrect && (
                          <span className={`flex items-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-xl ${(isUrduEnabled() && q.optionsUrdu && q.optionsUrdu[optIdx]) ? 'mr-auto' : 'ml-auto'}`}>
                            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" /> Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Explanation & Solution Section */}
              {showAllExplanations && (q.explanation || q.solution || hasSolutionCode) && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 rounded-2xl space-y-4">
                  {q.solution && (
                    <div className="space-y-1.5">
                      <div className={`flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider ${(isUrduEnabled() && q.solutionUrdu) ? 'flex-row-reverse' : 'space-x-2'}`}>
                        <CheckCircle2 className={`w-4 h-4 text-emerald-500 ${(isUrduEnabled() && q.solutionUrdu) ? 'ml-2' : ''}`} />
                        <span>Model Solution / Key Points</span>
                      </div>
                      
                      {isBilingual() && q.solutionUrdu ? (
                         <div className="space-y-3">
                            <p style={{ fontSize: `${explanationSize}px` }} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{q.solution}</p>
                            <p style={{ fontSize: `${urduSize}px` }} className="font-urdu text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{q.solutionUrdu}</p>
                         </div>
                      ) : (
                         <p 
                           style={{ fontSize: `${(isUrduEnabled() && q.solutionUrdu) ? urduSize : explanationSize}px` }}
                           className={`text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ${(isUrduEnabled() && q.solutionUrdu) ? 'font-urdu' : ''}`}
                         >
                           {isUrduEnabled() && q.solutionUrdu ? q.solutionUrdu : q.solution}
                         </p>
                      )}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="space-y-2">
                      <div className={`flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider ${(isUrduEnabled() && q.explanationUrdu) ? 'flex-row-reverse' : 'space-x-2'}`}>
                        <Lightbulb className={`w-4 h-4 text-amber-500 ${(isUrduEnabled() && q.explanationUrdu) ? 'ml-2' : ''}`} />
                        <span>Explanation &amp; Concept</span>
                      </div>
                      
                      {isBilingual() && q.explanationUrdu ? (
                         <div className="space-y-3">
                            <p style={{ fontSize: `${explanationSize}px` }} className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                            <p style={{ fontSize: `${urduSize}px` }} className="font-urdu text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{q.explanationUrdu}</p>
                         </div>
                      ) : (
                         <p 
                           style={{ fontSize: `${(isUrduEnabled() && q.explanationUrdu) ? urduSize : explanationSize}px` }}
                           className={`text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ${(isUrduEnabled() && q.explanationUrdu) ? 'font-urdu' : ''}`}
                         >
                           {isUrduEnabled() && q.explanationUrdu ? q.explanationUrdu : q.explanation}
                         </p>
                      )}
                    </div>
                  )}

                  {hasSolutionCode && (
                    <CodeBlock
                      code={q.solutionCode}
                      language={q.solutionCodeLanguage || q.solutionLanguage || q.codeLanguage || 'cpp'}
                      title="Solution / Reference Code"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
