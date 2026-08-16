'use client';
export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' },
  { value: 'disabled', label: 'Disabled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-200' },
  { value: 'new', label: '🔥 New', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200' },
  { value: 'upcoming', label: '⏳ Upcoming', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200' },
  { value: 'updating', label: '🔄 Updating', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200' },
  { value: 'updated', label: '✅ Updated', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200' },
  { value: 'best', label: '⭐ Best', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200' },
  { value: 'midterm', label: '🎯 Best for Midterm', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200' },
  { value: 'finalterm', label: '🏆 Best for Finalterm', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200' }
];

export default function StatusBadge({ status = 'active' }) {
  if (status === 'disabled' || status === 'active' || !status) {
    if (status === 'disabled') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          Disabled
        </span>
      );
    }
    return null;
  }

  const found = STATUS_OPTIONS.find(opt => opt.value === status);
  if (!found) return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${found.color}`}>
      {found.label}
    </span>
  );
}
