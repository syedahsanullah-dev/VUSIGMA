import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import { syncQuizQuestionCount } from '@/utils/quizSync';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const subjectIdParam = searchParams.get('subjectId');
    const category = searchParams.get('category');

    let resolvedSubjectId = subjectIdParam;
    let targetSubjectCode = null;

    if (subjectIdParam) {
      if (mongoose.Types.ObjectId.isValid(subjectIdParam)) {
        resolvedSubjectId = new mongoose.Types.ObjectId(subjectIdParam);
        const targetSubj = await Subject.findById(resolvedSubjectId).select('code').lean();
        if (targetSubj && targetSubj.code) targetSubjectCode = targetSubj.code.toUpperCase();
      } else {
        targetSubjectCode = subjectIdParam.toUpperCase();
        const foundSubj = await Subject.findOne({ code: targetSubjectCode }).select('_id').lean();
        if (foundSubj) {
          resolvedSubjectId = foundSubj._id;
        }
      }
    }

    const filter = { isActive: { $ne: false } };
    if (resolvedSubjectId) filter.subjectId = resolvedSubjectId;
    if (category) filter.category = category;

    const quizzes = await Quiz.find(filter).sort({ createdAt: 1 }).lean();

    // Fetch all questions for subject matching
    const questionFilter = {};
    if (targetSubjectCode) questionFilter.subjectCode = targetSubjectCode;

    const questions = await Question.find(questionFilter).select('subjectCode category').lean();

    const formatted = quizzes.map(q => {
      const qid = q._id.toString();
      const qCat = (q.category || 'MCQ').toUpperCase();

      let count = 0;

      // 1. Explicit questionIds array attached to Quiz
      if (Array.isArray(q.questionIds) && q.questionIds.length > 0) {
        count = q.questionIds.length;
      } else {
        // 2. Direct question.quizId links
        const directCount = questions.filter(item => {
          const itemQuizId = (item.quizId?._id || item.quizId)?.toString();
          return itemQuizId === qid;
        }).length;

        if (directCount > 0) {
          count = directCount;
        } else {
          // 3. Chapter range or Topic criteria
          const hasCh = Array.isArray(q.chapters) && q.chapters.length > 0;
          const hasTop = Array.isArray(q.topics) && q.topics.length > 0;

          if (hasCh || hasTop) {
            count = questions.filter(item => {
              const itemCat = (item.category || 'MCQ').toUpperCase();
              if (qCat !== 'MIXED' && itemCat !== qCat) return false;
              if (hasCh && !q.chapters.includes(Number(item.chapter))) return false;
              if (hasTop && !q.topics.includes(item.topic)) return false;
              return true;
            }).length;
          } else if (q.isFullCourse || q.quizType === 'FULL_SUBJECT' || q.isAllQuestions) {
            count = questions.filter(item => {
              const itemCat = (item.category || 'MCQ').toUpperCase();
              return qCat === 'MIXED' || itemCat === qCat;
            }).length;
          } else {
            count = q.questionCount || 0;
          }
        }
      }

      return {
        ...q,
        id: qid,
        _id: qid,
        questionCount: count
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    if (body.status) body.status = String(body.status).toLowerCase();
    const quiz = await Quiz.create(body);

    const count = await syncQuizQuestionCount(quiz._id);
    const result = quiz.toJSON();
    result.questionCount = count;

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
