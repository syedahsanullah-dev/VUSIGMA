export const metadata = {
  title: 'Privacy Policy | VU SIGMA Educational Portal',
  description: 'Privacy policy for VU SIGMA. Read about how we handle user data, cookies, Google AdSense, analytics, and data security.'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-extrabold mb-6 text-indigo-600 dark:text-indigo-400">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last Updated: July 30, 2026</p>

      <section className="space-y-6 text-base leading-relaxed">
        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">1. Introduction</h2>
          <p>
            Welcome to <strong>VU SIGMA</strong> ("we", "our", or "us"). We are committed to protecting your personal privacy when you use our educational portal, practice tools, and exam preparation resources. This Privacy Policy outlines how information is collected, used, and safeguarded.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">2. Information We Collect</h2>
          <p>We collect information to provide better services to all our users:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Usage & Analytics Data:</strong> IP addresses, browser types, pages visited, time spent on questions, and device telemetry to optimize user experience.</li>
            <li><strong>Account Information:</strong> If you register an account, we store your name, email address, and encrypted password hash.</li>
            <li><strong>Cookies & Identifiers:</strong> Small data files stored on your device to remember user preferences, session tokens, and display personalized content.</li>
          </ul>
        </div>

        <div className="bg-indigo-50 dark:bg-slate-800/60 p-6 rounded-xl border border-indigo-100 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-3 text-indigo-900 dark:text-indigo-300">3. Google AdSense & Third-Party Advertising</h2>
          <p className="mb-3">
            VU SIGMA uses third-party advertising services, including <strong>Google AdSense</strong>, to serve ads when you visit our website.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google, as a third-party vendor, uses cookies to serve ads on our site.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our site and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Google Ad Settings</a>.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">4. Data Protection & Security</h2>
          <p>
            We implement industry-standard technical and organizational security measures, including SSL encryption and secure password hashing algorithms, to prevent unauthorized access, disclosure, or modification of user data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">5. Contact Us</h2>
          <p>
            If you have any questions or concerns regarding this Privacy Policy, please contact our privacy compliance officer at <a href="mailto:support@vusigma.com" className="text-indigo-600 underline">support@vusigma.com</a> or visit our <a href="/contact" className="text-indigo-600 underline">Contact Us page</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
