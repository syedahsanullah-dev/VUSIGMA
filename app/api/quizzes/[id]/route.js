import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Subject from '@/models/Subject';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    let quiz;
    if (isObjectId) {
      quiz = await Quiz.findById(id).lean();
    } else {
      // Find quiz by slug or title match
      const decoded = decodeURIComponent(id).replace(/-/g, ' ');
      quiz = await Quiz.findOne({ title: new RegExp(decoded, 'i') }).lean();
    }

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz module not found' }, { status: 404 });
    }

    const quizId = quiz._id;
    let sCode = quiz.subjectCode;
    if (!sCode && quiz.subjectId) {
      const foundSubj = await Subject.findById(quiz.subjectId).select('code').lean();
      if (foundSubj && foundSubj.code) sCode = foundSubj.code;
    }

    let questions = [];

    // 1. Explicit questionIds on quiz
    if (Array.isArray(quiz.questionIds) && quiz.questionIds.length > 0) {
      questions = await Question.find({
        _id: { $in: quiz.questionIds },
        status: { $nin: ['disabled', 'draft', 'archived'] }
      }).sort({ chapter: 1, createdAt: 1 }).lean();
    } else {
      // 2. Direct quizId links on questions
      const directLinked = await Question.find({
        quizId: quiz._id,
        status: { $nin: ['disabled', 'draft', 'archived'] }
      }).sort({ chapter: 1, createdAt: 1 }).lean();

      if (directLinked.length > 0) {
        questions = directLinked;
      } else {
        // 3. Chapters / topics or Full Subject flags
        const hasCh = Array.isArray(quiz.chapters) && quiz.chapters.length > 0;
        const hasTop = Array.isArray(quiz.topics) && quiz.topics.length > 0;
        const isFull = quiz.isFullCourse || quiz.quizType === 'FULL_SUBJECT' || quiz.isAllQuestions;

        if (hasCh || hasTop || isFull) {
          const questionFilter = { status: { $nin: ['disabled', 'draft', 'archived'] } };
          if (sCode) questionFilter.subjectCode = sCode.toUpperCase();
          if (hasCh) questionFilter.chapter = { $in: quiz.chapters };
          if (hasTop) questionFilter.topic = { $in: quiz.topics };
          if (quiz.category && quiz.category !== 'MIXED') {
            questionFilter.category = quiz.category;
          }

          questions = await Question.find(questionFilter).sort({ chapter: 1, createdAt: 1 }).lean();
        } else {
          // Unconfigured / empty quiz module -> 0 questions!
          questions = [];
        }
      }
    }

    const formattedQuiz = {
      ...quiz,
      id: quizId.toString(),
      _id: quizId.toString()
    };

    const formattedQuestions = questions.map(q => ({
      ...q,
      id: q._id.toString(),
      _id: q._id.toString()
    }));

    return NextResponse.json({
      ...formattedQuiz,
      questions: formattedQuestions
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { syncQuizQuestionCount } from '@/utils/quizSync';

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    if (body.status) body.status = String(body.status).toLowerCase();
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { _id: id } : { title: new RegExp(decodeURIComponent(id).replace(/-/g, ' '), 'i') };

    const updated = await Quiz.findOneAndUpdate(filter, body, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    // Sync questionCount on admin save
    const count = await syncQuizQuestionCount(updated._id);
    const result = updated.toJSON();
    result.questionCount = count;

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const filter = isObjectId ? { _id: id } : { title: new RegExp(decodeURIComponent(id).replace(/-/g, ' '), 'i') };

    const quiz = await Quiz.findOneAndDelete(filter);
    if (quiz) {
      // Unlink quizId so questions remain intact in the Subject Question Pool
      await Question.updateMany({ quizId: quiz._id }, { quizId: null });
    }
    return NextResponse.json({ success: true, message: 'Quiz deleted and associated questions unlinked.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
