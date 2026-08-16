import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { syncSubjectQuizzesCount } from '@/utils/quizSync';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const payload = await request.json();

    const targetSubject = payload.subject || payload;
    const quizzes = payload.quizzes || targetSubject.quizzes || [];
    const questions = payload.questions || targetSubject.questions || [];

    if (!targetSubject || !targetSubject.name || !targetSubject.code) {
      return NextResponse.json({ success: false, error: 'Subject payload must include name and code' }, { status: 400 });
    }

    const createdSubject = await Subject.create({
      name: targetSubject.name,
      code: targetSubject.code.toUpperCase(),
      description: targetSubject.description || '',
      status: targetSubject.status || 'active',
      totalChapters: targetSubject.totalChapters || 45,
      chaptersConfig: targetSubject.chaptersConfig || [],
      isActive: targetSubject.status !== 'disabled'
    });

    const quizIdMap = {};
    const createdQuizzes = [];

    if (quizzes.length > 0) {
      for (const qz of quizzes) {
        const oldId = qz.id || qz._id;
        const createdQuiz = await Quiz.create({
          subjectId: createdSubject._id,
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
        createdQuizzes.push(createdQuiz);
        if (oldId) quizIdMap[oldId] = createdQuiz._id;
      }
    }

    let createdQuestionsCount = 0;
    if (questions.length > 0) {
      const questionDocs = questions.map(q => {
        const mappedQuizId = q.quizId ? (quizIdMap[q.quizId] || q.quizId) : null;
        const chNum = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
        const multiImages = Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0
          ? q.imagesBase64
          : (q.imageBase64 ? [q.imageBase64] : []);

        return {
          subjectCode: createdSubject.code.toUpperCase(),
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
        createdQuestionsCount = questionDocs.length;
      }
    }

    await syncSubjectQuizzesCount(createdSubject._id);

    return NextResponse.json({
      success: true,
      message: 'Subject package imported successfully',
      data: {
        subject: createdSubject,
        quizzesCount: createdQuizzes.length,
        questionsCount: createdQuestionsCount
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
