import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Question from '@/models/Question';
import Quiz from '@/models/Quiz';
import Subject from '@/models/Subject';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const [subjectCount, quizCount, questionCount, userCount] = await Promise.all([
      Subject.countDocuments(),
      Quiz.countDocuments(),
      Question.countDocuments(),
      User.countDocuments()
    ]);

    const categoryStats = await Question.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const difficultyStats = await Question.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    const formattedCategories = { MCQ: 0, SHORT: 0, LONG: 0 };
    categoryStats.forEach(item => {
      if (item._id) formattedCategories[item._id] = item.count;
    });

    const formattedDifficulties = { Easy: 0, Medium: 0, Hard: 0 };
    difficultyStats.forEach(item => {
      if (item._id) formattedDifficulties[item._id] = item.count;
    });

    return NextResponse.json({
      summary: {
        subjects: subjectCount,
        quizzes: quizCount,
        questions: questionCount,
        users: userCount
      },
      categories: formattedCategories,
      difficulties: formattedDifficulties
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
