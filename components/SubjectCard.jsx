'use client';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from './StatusBadge';

export default function SubjectCard({ subject }) {
  const status = subject.status || (subject.isActive === false ? 'disabled' : 'active');
  const subjectId = subject.code || subject.id || subject._id;

  return (
    <Link 
      href={`/subjects/${subjectId}`}
      className="block group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-blue-100 dark:border-blue-800/50">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {subject.code}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {subject.name}
            </p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      <div className="flex flex-col gap-2 mt-2 flex-1">
        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-slate-500 dark:text-slate-400">Quizzes (MCQ)</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {subject.mcqQuestionsCount || 0} Questions
          </span>
        </div>
        <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-1">
          <span className="text-slate-500 dark:text-slate-400">Short Questions</span>
          <span className="font-bold text-purple-600 dark:text-purple-400">
            {subject.shortQuestionsCount || 0} Questions
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Long Questions</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            {subject.longQuestionsCount || 0} Questions
          </span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-semibold text-blue-600 dark:text-blue-400">
        <span>View Quizzes</span>
        <span>&rarr;</span>
      </div>
    </Link>
  );
}
