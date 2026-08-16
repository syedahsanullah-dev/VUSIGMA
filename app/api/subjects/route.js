import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Subject from '@/models/Subject';
import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const subjects = await Subject.find({ isActive: { $ne: false } }).sort({ name: 1 }).lean();

    const [quizCounts, questionCounts] = await Promise.all([
      Quiz.aggregate([
        { $match: { isActive: { $ne: false } } },
        {
          $group: {
            _id: {
              subjectId: '$subjectId',
              subjectCode: { $toUpper: { $trim: { input: '$subjectCode' } } },
              category: { $toUpper: { $ifNull: ['$category', 'MCQ'] } }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      Question.aggregate([
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'matchedSubject'
          }
        },
        {
          $project: {
            category: { $toUpper: { $ifNull: ['$category', 'MCQ'] } },
            resolvedCode: {
              $toUpper: {
                $trim: {
                  input: {
                    $ifNull: [
                      '$subjectCode',
                      { $arrayElemAt: ['$matchedSubject.code', 0] }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: {
              subjectCode: '$resolvedCode',
              category: '$category'
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const quizCountMap = {};
    quizCounts.forEach(({ _id, count }) => {
      if (!_id) return;
      const sid = _id.subjectId ? _id.subjectId.toString() : null;
      const scode = _id.subjectCode ? String(_id.subjectCode).toUpperCase().trim() : null;
      const cat = (_id.category || 'MCQ').toUpperCase();

      if (sid) {
        if (!quizCountMap[sid]) quizCountMap[sid] = { MCQ: 0, SHORT: 0, LONG: 0 };
        quizCountMap[sid][cat] = (quizCountMap[sid][cat] || 0) + count;
      }
      if (scode) {
        if (!quizCountMap[scode]) quizCountMap[scode] = { MCQ: 0, SHORT: 0, LONG: 0 };
        quizCountMap[scode][cat] = (quizCountMap[scode][cat] || 0) + count;
      }
    });

    const questionCountMap = {};
    questionCounts.forEach(({ _id, count }) => {
      if (!_id || !_id.subjectCode) return;
      const scode = String(_id.subjectCode).toUpperCase().trim();
      const cat = (_id.category || 'MCQ').toUpperCase();
      if (!questionCountMap[scode]) questionCountMap[scode] = { MCQ: 0, SHORT: 0, LONG: 0 };
      questionCountMap[scode][cat] = (questionCountMap[scode][cat] || 0) + count;
    });

    const formatted = subjects.map(s => {
      const sid = s._id.toString();
      const scode = (s.code || '').toUpperCase().trim();
      const qzCounts = quizCountMap[scode] || quizCountMap[sid] || { MCQ: 0, SHORT: 0, LONG: 0 };
      const qCounts = questionCountMap[scode] || { MCQ: 0, SHORT: 0, LONG: 0 };

      const mcqModules = qzCounts.MCQ || (qCounts.MCQ > 0 ? 1 : 0);
      const shortModules = qzCounts.SHORT || (qCounts.SHORT > 0 ? 1 : 0);
      const longModules = qzCounts.LONG || (qCounts.LONG > 0 ? 1 : 0);

      return {
        ...s,
        id: sid,
        _id: sid,
        mcqCount: mcqModules,
        shortCount: shortModules,
        longCount: longModules,
        mcqQuestionsCount: qCounts.MCQ || 0,
        shortQuestionsCount: qCounts.SHORT || 0,
        longQuestionsCount: qCounts.LONG || 0,
        totalQuestionsCount: (qCounts.MCQ || 0) + (qCounts.SHORT || 0) + (qCounts.LONG || 0)
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
    if (!body.code || !body.name) {
      return NextResponse.json({ success: false, error: 'Subject code and name are required' }, { status: 400 });
    }

    const formattedCode = String(body.code).toUpperCase().trim();
    const existing = await Subject.findOne({ code: formattedCode });
    if (existing) {
      return NextResponse.json({ success: false, error: `Subject with code ${formattedCode} already exists` }, { status: 409 });
    }

    const subject = await Subject.create({
      ...body,
      code: formattedCode
    });

    return NextResponse.json({ success: true, data: subject.toJSON() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
