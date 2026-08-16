'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800 dark:text-slate-200">
      <h1 className="text-4xl font-extrabold mb-4 text-indigo-600 dark:text-indigo-400">Contact Us</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Have questions, feedback, or need help with a subject course? Reach out to the VU SIGMA academic team.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Mail className="w-8 h-8 text-indigo-600 mb-3" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Email Us</h3>
            <p className="text-sm text-slate-500 mt-1">Direct Publisher & Support Contact</p>
            <a href="mailto:support@vusigma.com" className="text-sm font-semibold text-indigo-600 underline mt-2 block">
              support@vusigma.com
            </a>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <MessageSquare className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Response Time</h3>
            <p className="text-sm text-slate-500 mt-1">Our editorial team responds within 24 to 48 hours.</p>
          </div>
        </div>

        <div className="md:col-span-2">
          {submitted ? (
            <div className="p-8 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">Message Sent!</h3>
              <p className="text-emerald-700 dark:text-emerald-300 mt-2">
                Thank you for contacting VU SIGMA. We have received your message and will respond shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
