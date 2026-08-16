import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Setting from '@/models/Setting';
import { getAuthUser } from '@/lib/auth';
import { syncSubjectQuizzesCount } from '@/utils/quizSync';

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Super Admin privileges required.' }, { status: 403 });
    }

    const payload = await request.json();
    const { mode = 'merge' } = payload;
    const dbObj = payload.database || payload;

    const subjectsList = Array.isArray(dbObj.subjects) ? dbObj.subjects : [];
    const quizzesList = Array.isArray(dbObj.quizzes) ? dbObj.quizzes : [];
    const questionsList = Array.isArray(dbObj.questions) ? dbObj.questions : [];
    const settingsList = Array.isArray(dbObj.settings) ? dbObj.settings : [];

    if (mode === 'overwrite') {
      const confirmHeader = request.headers.get('x-confirm-overwrite');
      if (confirmHeader !== 'DESTROY_ALL_DATA') {
        return NextResponse.json({ error: 'Missing or invalid confirmation header for overwrite mode.' }, { status: 400 });
      }
      await Subject.deleteMany({});
      await Quiz.deleteMany({});
      await Question.deleteMany({});
      await Setting.deleteMany({});
    }

    const subjectIdMap = {};
    const quizIdMap = {};

    let restoredSubjects = 0;
    for (const subj of subjectsList) {
      const oldId = subj.id || subj._id;
      const createdSubj = await Subject.create({
        name: subj.name,
        code: subj.code,
        description: subj.description || '',
        status: subj.status || 'active',
        totalChapters: subj.totalChapters || 0,
        chaptersConfig: subj.chaptersConfig || [],
        isActive: subj.status !== 'disabled'
      });
      restoredSubjects++;
      if (oldId) subjectIdMap[oldId] = createdSubj._id;
    }

    let restoredQuizzes = 0;
    for (const qz of quizzesList) {
      const oldId = qz.id || qz._id;
      const mappedSubjectId = qz.subjectId ? (subjectIdMap[qz.subjectId] || qz.subjectId) : null;
      if (mappedSubjectId) {
        const createdQuiz = await Quiz.create({
          subjectId: mappedSubjectId,
          title: qz.title,
          description: qz.description || '',
          quizType: qz.quizType || 'CHAPTER_QUIZ',
          category: qz.category || 'MCQ',
          chapters: qz.chapters || [],
          topics: qz.topics || [],
          timeLimitMinutes: qz.timeLimitMinutes || 15,
          status: qz.status || 'published',
          isActive: qz.status !== 'disabled'
        });
        restoredQuizzes++;
        if (oldId) quizIdMap[oldId] = createdQuiz._id;
      }
    }

    let restoredQuestions = 0;
    if (questionsList.length > 0) {
      const subjectCodeByOldIdMap = {};
      subjectsList.forEach(s => {
        if (s.id || s._id) subjectCodeByOldIdMap[s.id || s._id] = (s.code || '').toUpperCase();
      });

      const questionDocs = questionsList.map(q => {
        const targetSubjCode = (q.subjectCode || subjectCodeByOldIdMap[q.subjectId] || '').toUpperCase();
        const chNum = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
        const multiImages = Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0
          ? q.imagesBase64
          : (q.imageBase64 ? [q.imageBase64] : []);

        return {
          subjectCode: targetSubjCode,
          category: q.category || 'MCQ',
          questionText: q.questionText,
          options: q.options || [],
          correctOption: q.correctOption !== undefined ? q.correctOption : 0,
          explanation: q.explanation || '',
          solution: q.solution || '',
          chapter: chNum,
          chapterNumber: chNum,
          topic: q.topic || 'General',
          difficulty: q.difficulty || 'Medium',
          imageBase64: q.imageBase64 || (multiImages[0] || ''),
          imagesBase64: multiImages,
          codeSnippet: q.codeSnippet || '',
          codeLanguage: q.codeLanguage || 'cpp',
          solutionCode: q.solutionCode || '',
          solutionCodeLanguage: q.solutionCodeLanguage || 'cpp',
          hasCode: Boolean(q.codeSnippet || q.solutionCode || q.hasCode),
          status: q.status || 'published',
          isStarred: Boolean(q.isStarred),
          isRepeated: Boolean(q.isRepeated),
          isImportant: Boolean(q.isImportant),
          isConceptual: Boolean(q.isConceptual)
        };
      }).filter(q => q.questionText);

      if (questionDocs.length > 0) {
        await Question.insertMany(questionDocs);
        restoredQuestions = questionDocs.length;
      }
    }

    let restoredSettings = 0;
    if (settingsList.length > 0) {
      for (const st of settingsList) {
        await Setting.findOneAndUpdate(
          { key: st.key },
          { value: st.value },
          { upsert: true, new: true }
        );
        restoredSettings++;
      }
    }

    // Sync counters across all restored subjects
    await Promise.all(Object.values(subjectIdMap).map(sid => syncSubjectQuizzesCount(sid)));

    return NextResponse.json({
      success: true,
      message: 'Full database restored successfully into MongoDB.',
      mode,
      restored: {
        subjects: restoredSubjects,
        quizzes: restoredQuizzes,
        questions: restoredQuestions,
        settings: restoredSettings
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
