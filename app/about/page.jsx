export const metadata = {
  title: 'About Us | VU SIGMA Educational Exam Portal',
  description: 'Learn about VU SIGMA, our mission, academic verification process, interactive study tools, and commitment to educational excellence.'
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-400">About VU SIGMA</h1>

      <section className="space-y-8 text-base leading-relaxed">
        <div className="p-8 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-indigo-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Our Mission</h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong>VU SIGMA</strong> is a modern educational portal built to revolutionize exam preparation for distance-learning students. We combine interactive Learn Mode engines, topic breakdowns, detailed solution explanations, and instant AI tutoring to help students master challenging academic subjects with confidence.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">What Makes VU SIGMA Unique?</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-indigo-600 mb-2">⚡ Interactive Learn Mode</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Study questions at your own pace with instant answer reveals, detailed solution breakdowns, and chapter filters.
              </p>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-emerald-600 mb-2">🎯 Topic-by-Topic Mastery</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Filter questions by specific chapters and concepts to focus directly on your exam weak points.
              </p>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-purple-600 mb-2">📚 Verified Academic Solutions</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                All questions and MCQs undergo content quality checks to ensure solution accuracy against standard handouts.
              </p>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-amber-600 mb-2">🚀 Faster Server Pre-rendering</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Built with Next.js App Router for instant page loading, offline access, and mobile optimization.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Editorial Quality & E-E-A-T Standards</h2>
          <p>
            Our content team continuously updates question banks for the 2026 academic session. Each subject page contains static syllabus breakdowns, study tips, and FAQs curated by experienced educators to adhere to high educational standards.
          </p>
        </div>
      </section>
    </div>
  );
}
