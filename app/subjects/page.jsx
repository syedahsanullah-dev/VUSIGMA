import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import SubjectCard from '@/components/SubjectCard';

export const metadata = {
  title: 'Subjects Catalog & Exam Prep | VU SIGMA',
  description: 'Browse all available Virtual University subjects, practice midterm and final term MCQs, and access study guides.'
};

export default async function SubjectsCatalogPage() {
  await connectDB();
  const subjects = await Subject.find({ isActive: true }).sort({ code: 1 }).lean();

  const formattedSubjects = subjects.map(s => ({
    ...s,
    id: s._id.toString(),
    _id: s._id.toString()
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Subject Catalog
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Select your course code below to access interactive solved MCQs, chapter topic breakdowns, and exam practice engines.
        </p>
      </div>

      {formattedSubjects.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Subjects Published Yet</h3>
          <p className="text-slate-500 mt-2 text-sm">Course materials for the 2026 academic session are being added continuously.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedSubjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
}
