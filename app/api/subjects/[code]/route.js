import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Question from '@/models/Question';
import Quiz from '@/models/Quiz';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { code } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(code);

    const filter = isObjectId
      ? { $or: [{ _id: code }, { code: code.toUpperCase() }] }
      : { code: code.toUpperCase() };

    const subject = await Subject.findOne(filter).lean();

    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    const [quizzes, questions] = await Promise.all([
      Quiz.find({ subjectId: subject._id, isActive: { $ne: false } }).lean(),
      Question.find({
        $or: [
          { subjectCode: subject.code.toUpperCase() },
          { subjectId: subject._id }
        ]
      }).lean()
    ]);

    const formattedQuizzes = quizzes.map(q => {
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

    const mcqQuestionsCount = questions.filter(q => (q.category || 'MCQ').toUpperCase() === 'MCQ').length;
    const shortQuestionsCount = questions.filter(q => (q.category || '').toUpperCase() === 'SHORT').length;
    const longQuestionsCount = questions.filter(q => (q.category || '').toUpperCase() === 'LONG').length;
    const totalQuestionsCount = questions.length;

    return NextResponse.json({
      success: true,
      data: {
        ...subject,
        id: subject._id.toString(),
        totalQuestionsCount,
        mcqQuestionsCount,
        shortQuestionsCount,
        longQuestionsCount,
        quizzes: formattedQuizzes,
        questions: questions.map(q => ({ ...q, id: q._id.toString() }))
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const { code } = await params;
    const body = await request.json();
    const isObjectId = mongoose.Types.ObjectId.isValid(code);
    const filter = isObjectId
      ? { $or: [{ _id: code }, { code: code.toUpperCase() }] }
      : { code: code.toUpperCase() };

    const updated = await Subject.findOneAndUpdate(filter, body, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const { code } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(code);
    const filter = isObjectId
      ? { $or: [{ _id: code }, { code: code.toUpperCase() }] }
      : { code: code.toUpperCase() };

    const subject = await Subject.findOneAndDelete(filter);

    if (!subject) {
      return NextResponse.json({ success: false, error: 'Subject not found' }, { status: 404 });
    }

    await Promise.all([
      Question.deleteMany({ subjectCode: subject.code.toUpperCase() }),
      Quiz.deleteMany({ subjectId: subject._id })
    ]);

    return NextResponse.json({ success: true, message: 'Subject and associated data deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
