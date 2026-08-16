export const metadata = {
  title: 'Non-Affiliation Disclaimer | VU SIGMA Educational Portal',
  description: 'Educational disclaimer and non-affiliation notice for VU SIGMA study portal.'
};

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-extrabold mb-6 text-amber-600 dark:text-amber-400">Educational Disclaimer</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: July 30, 2026</p>

      <div className="p-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl mb-8">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">Important Notice on Non-Affiliation</h2>
        <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
          VU SIGMA is an independent educational initiative created solely for student revision and exam practice. 
          <strong> VU SIGMA is NOT affiliated with, endorsed by, sponsored by, or connected in any official capacity to the Virtual University of Pakistan or any official university board.</strong>
        </p>
      </div>

      <section className="space-y-6 text-base leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Trademark & Brand Disclaimer</h2>
          <p>
            All university names, course codes (e.g., CS101, MTH101, ENG101), logos, and trademarks mentioned on this website belong to their respective owners. Their reference on this website is purely for identification and educational organization purposes under fair use guidelines.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Content Accuracy & Verification</h2>
          <p>
            The practice questions, solutions, and explanations hosted on VU SIGMA are curated by students and academic experts. While we make every effort to verify solution accuracy, students are encouraged to cross-reference with official university course handouts.
          </p>
        </div>
      </section>
    </div>
  );
}
