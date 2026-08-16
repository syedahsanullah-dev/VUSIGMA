'use client';
import React from 'react';
import { BarChart3, CheckSquare, FileText, BookOpen, Layers, Award } from 'lucide-react';
import { analyzeQuestionData } from '@/utils/quizformat/questionCounter';

export function CounterTab({ items }) {
  const summary = analyzeQuestionData(items);

  const mcqPercentage = summary.totalItems > 0 ? Math.round((summary.mcqCount / summary.totalItems) * 100) : 0;
  const qaPercentage = summary.totalItems > 0 ? Math.round((summary.qaCount / summary.totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Dataset Counter & Analytics
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              VU SIGMA import analytics, question categories (MCQ / SHORT / LONG), and difficulty metrics.
            </p>
          </div>
          <div className="badge badge-indigo text-sm py-1.5 px-3">
            {summary.totalItems} Total Records
          </div>
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MCQs */}
        <div className="glass-panel p-5 glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">MCQ Questions</span>
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-indigo-300">{summary.mcqCount}</span>
            <span className="text-xs text-slate-400 ml-2">({mcqPercentage}% of total)</span>
          </div>
        </div>

        {/* Card 2: Subjective (Short + Long) */}
        <div className="glass-panel p-5 glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Subjective (Short/Long)</span>
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-cyan-300">{summary.qaCount}</span>
            <span className="text-xs text-slate-400 ml-2">({qaPercentage}% of total)</span>
          </div>
        </div>

        {/* Card 3: Short vs Long Split */}
        <div className="glass-panel p-5 glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Short vs Long Split</span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-bold text-emerald-300">{summary.shortCount}</span>
              <span className="text-xs text-slate-400 ml-1">Short</span>
            </div>
            <span className="text-slate-600">/</span>
            <div>
              <span className="text-2xl font-bold text-teal-300">{summary.longCount}</span>
              <span className="text-xs text-slate-400 ml-1">Long</span>
            </div>
          </div>
        </div>

        {/* Card 4: Difficulty Distribution */}
        <div className="glass-panel p-5 glass-panel-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase">Difficulty Levels</span>
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="badge badge-emerald text-[11px]">Easy: {summary.difficultyDistribution.Easy}</span>
            <span className="badge badge-indigo text-[11px]">Med: {summary.difficultyDistribution.Medium}</span>
            <span className="badge badge-rose text-[11px]">Hard: {summary.difficultyDistribution.Hard}</span>
          </div>
        </div>
      </div>

      {/* Graphical Breakdown & Chapter Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Ratio Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Category & Type Breakdown Ratio
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Multiple Choice (MCQ)</span>
                <span>{summary.mcqCount} ({mcqPercentage}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${mcqPercentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Short Questions (SHORT)</span>
                <span>
                  {summary.shortCount} (
                  {summary.totalItems > 0 ? Math.round((summary.shortCount / summary.totalItems) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${summary.totalItems > 0 ? (summary.shortCount / summary.totalItems) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Long Questions (LONG)</span>
                <span>
                  {summary.longCount} (
                  {summary.totalItems > 0 ? Math.round((summary.longCount / summary.totalItems) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${summary.totalItems > 0 ? (summary.longCount / summary.totalItems) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Distribution List */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Chapter / Lecture Distribution
          </h3>

          <div className="flex-1 max-h-60 overflow-y-auto space-y-2 pr-1">
            {Object.entries(summary.chapterDistribution).length > 0 ? (
              Object.entries(summary.chapterDistribution).map(([chapter, count], idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs"
                >
                  <span className="text-slate-300 font-medium truncate max-w-[80%]">{chapter}</span>
                  <span className="badge badge-cyan">{count} items</span>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-xs">No items loaded to analyze chapters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
