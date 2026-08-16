'use client';
import { normalizeKeys } from './jsonCleaner.js';

export function separateQuestionTypes(items) {
  const mcqs = [];
  const qnas = [];
  const short = [];
  const long = [];
  const unrecognized = [];

  items.forEach((item) => {
    if (!item || typeof item !== 'object') {
      unrecognized.push(item);
      return;
    }

    const newItem = normalizeKeys(item);

    if (newItem.category === 'MCQ' || (Array.isArray(newItem.options) && newItem.options.length > 0)) {
      newItem.category = 'MCQ';
      mcqs.push(newItem);
    } else if (newItem.category === 'SHORT' || newItem.category === 'LONG' || newItem.solution) {
      if (newItem.category === 'LONG') {
        long.push(newItem);
      } else {
        newItem.category = 'SHORT';
        short.push(newItem);
      }
      qnas.push(newItem);
    } else {
      unrecognized.push(newItem);
    }
  });

  return {
    mcqs,
    qnas,
    short,
    long,
    unrecognized,
  };
}

export function generateScheme2Payload(items, subjectInfo) {
  const code = subjectInfo?.code || 'CS603P';
  const name = subjectInfo?.name || 'CS603P - Software Architecture and Design Lab';
  const description = subjectInfo?.description || 'Lab handouts, MCQs, and subjective question bank.';

  const quizzes = [
    {
      id: 'quiz_midterm_mcqs',
      title: 'Mid-term Quiz MCQs',
      category: 'MCQ',
      status: 'active',
    },
    {
      id: 'quiz_short_q',
      title: 'Short Questions Bank',
      category: 'SHORT',
      status: 'active',
    },
    {
      id: 'quiz_long_q',
      title: 'Long Questions Bank',
      category: 'LONG',
      status: 'active',
    },
  ];

  const questions = items.map((item) => {
    const q = normalizeKeys(item);

    if (q.category === 'MCQ') q.quizId = 'quiz_midterm_mcqs';
    else if (q.category === 'SHORT') q.quizId = 'quiz_short_q';
    else if (q.category === 'LONG') q.quizId = 'quiz_long_q';
    else q.quizId = 'quiz_midterm_mcqs';

    return q;
  });

  return {
    subject: {
      name,
      code,
      description,
      status: 'active',
    },
    quizzes,
    questions,
  };
}
