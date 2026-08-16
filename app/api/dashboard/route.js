import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const [subjects, quizzes, categoryStats, userCount, subjectStats] = await Promise.all([
      Subject.find().sort({ createdAt: -1 }).lean(),
      Quiz.find().lean(),
      Question.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      User.countDocuments(),
      Question.aggregate([
        { $group: { _id: { subjectCode: '$subjectCode', category: '$category' }, count: { $sum: 1 } } }
      ])
    ]);

    let mcqCount = 0;
    let shortCount = 0;
    let longCount = 0;
    let totalQuestions = 0;

    categoryStats.forEach(stat => {
      const cat = (stat._id || 'MCQ').toUpperCase();
      if (cat === 'MCQ') mcqCount += stat.count;
      else if (cat === 'SHORT') shortCount += stat.count;
      else if (cat === 'LONG') longCount += stat.count;
      totalQuestions += stat.count;
    });

    const recentSubjects = subjects.map(sub => {
      const subIdStr = sub._id.toString();
      const subCode = (sub.code || '').toUpperCase();
      const subQuizzes = quizzes.filter(q => q.subjectId && q.subjectId.toString() === subIdStr);

      const mcqMods = subQuizzes.filter(q => (q.category || 'MCQ').toUpperCase() === 'MCQ').length;
      const shortMods = subQuizzes.filter(q => (q.category || '').toUpperCase() === 'SHORT').length;
      const longMods = subQuizzes.filter(q => (q.category || '').toUpperCase() === 'LONG').length;

      let mcqQs = 0, shortQs = 0, longQs = 0;
      subjectStats.forEach(stat => {
        if (stat._id && stat._id.subjectCode && stat._id.subjectCode.toUpperCase() === subCode) {
          const cat = (stat._id.category || 'MCQ').toUpperCase();
          if (cat === 'MCQ') mcqQs = stat.count;
          else if (cat === 'SHORT') shortQs = stat.count;
          else if (cat === 'LONG') longQs = stat.count;
        }
      });

      return {
        ...sub,
        id: subIdStr,
        mcqModules: mcqMods,
        mcqQuestions: mcqQs,
        shortModules: shortMods,
        shortQuestions: shortQs,
        longModules: longMods,
        longQuestions: longQs
      };
    });

    return NextResponse.json({
      totalSubjects: subjects.length,
      totalModules: quizzes.length,
      totalQuestions,
      mcqCount,
      shortCount,
      longCount,
      userCount,
      recentSubjects
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
