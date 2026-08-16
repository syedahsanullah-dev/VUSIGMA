import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import User from '@/models/User';
import Setting from '@/models/Setting';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin privileges required.' }, { status: 403 });
    }

    const [subjects, quizzes, questions, users, settings] = await Promise.all([
      Subject.find().lean(),
      Quiz.find().lean(),
      Question.find().lean(),
      User.find().select('-passwordHash').lean(),
      Setting.find().lean()
    ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      counts: {
        subjects: subjects.length,
        quizzes: quizzes.length,
        questions: questions.length,
        users: users.length,
        settings: settings.length
      },
      database: {
        subjects,
        quizzes,
        questions,
        users,
        settings
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Dump export failed' }, { status: 500 });
  }
}
