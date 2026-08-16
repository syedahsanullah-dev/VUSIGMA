import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const codeParam = searchParams.get('subjectCode') || searchParams.get('subjectId') || searchParams.get('code');
    const category = searchParams.get('category');
    const limitParam = searchParams.get('limit');
    const includeAll = searchParams.get('includeAll') === 'true' || searchParams.get('admin') === 'true';

    const filter = {};

    if (codeParam) {
      if (mongoose.Types.ObjectId.isValid(codeParam)) {
        const foundSubj = await Subject.findById(codeParam).select('code').lean();
        if (foundSubj && foundSubj.code) {
          filter.subjectCode = foundSubj.code.toUpperCase();
        }
      } else {
        filter.subjectCode = codeParam.toUpperCase();
      }
    }

    if (category) filter.category = category;

    // Only exclude disabled/archived if NOT admin / NOT includeAll
    if (!includeAll && !codeParam) {
      filter.status = { $nin: ['disabled', 'archived'] };
    }

    const includeImages = searchParams.get('includeImages') === 'true' || includeAll;

    let query = Question.find(filter).sort({ createdAt: 1 });

    if (!includeImages) {
      query = query.select('-imageBase64 -imagesBase64');
    }

    if (limitParam && limitParam !== 'all') {
      query = query.limit(parseInt(limitParam, 10));
    } else if (!codeParam && !includeAll) {
      query = query.limit(50);
    }

    const questions = await query;
    return NextResponse.json({
      success: true,
      data: questions.map(q => q.toJSON()),
      count: questions.length
    });
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

    if (!body.questionText || !body.questionText.trim()) {
      return NextResponse.json({ success: false, error: 'questionText is required' }, { status: 400 });
    }

    let targetCode = body.subjectCode;
    
    // If targetCode is an ObjectId string, resolve it to the real Subject code
    if (targetCode && mongoose.Types.ObjectId.isValid(targetCode)) {
      const foundSubj = await Subject.findById(targetCode).select('code').lean();
      if (foundSubj && foundSubj.code) {
        targetCode = foundSubj.code;
      }
    }

    if (!targetCode && body.subjectId) {
      if (mongoose.Types.ObjectId.isValid(body.subjectId)) {
        const foundSubj = await Subject.findById(body.subjectId).select('code').lean();
        if (foundSubj && foundSubj.code) {
          targetCode = foundSubj.code;
        }
      } else {
        targetCode = body.subjectId;
      }
    }

    if (!targetCode) {
      return NextResponse.json({ success: false, error: 'subjectCode is required' }, { status: 400 });
    }

    const payload = {
      ...body,
      subjectCode: String(targetCode).toUpperCase()
    };
    delete payload.subjectId;
    delete payload.quizId;

    const newQuestion = await Question.create(payload);

    return NextResponse.json({ success: true, data: newQuestion.toJSON() }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
