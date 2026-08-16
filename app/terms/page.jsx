export const metadata = {
  title: 'Terms of Service | VU SIGMA Educational Portal',
  description: 'Terms of service governing the use of VU SIGMA exam preparation portal, practice engines, and study resources.'
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-400">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: July 30, 2026</p>

      <section className="space-y-6 text-base leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using <strong>VU SIGMA</strong> ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, please do not access or use our portal.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">2. Educational Use Only</h2>
          <p>
            VU SIGMA is designed strictly for student self-study, self-assessment, and revision purposes. The interactive MCQs, study notes, and practice exams are created to assist students in understanding course concepts.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">3. Intellectual Property Rights</h2>
          <p>
            All custom learning engine code, platform designs, original topic summaries, and interactive UI elements are the intellectual property of VU SIGMA. Original course handouts, syllabus structures, and course names belong to their respective academic institutions.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">4. User Conduct</h2>
          <p>
            Users agree not to attempt to breach platform security, reverse engineer API endpoints, perform automated scraping of question banks, or use the service for unauthorized commercial distribution.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">5. Limitation of Liability</h2>
          <p>
            While we strive for 100% accuracy in answers and explanations, VU SIGMA is provided "as is" without warranty of any kind. We are not responsible for official academic exam outcomes or grading results.
          </p>
        </div>
      </section>
    </div>
  );
}
