import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Question from '@/models/Question';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId) {
      return NextResponse.json({ success: false, error: 'Invalid question ID format' }, { status: 400 });
    }

    const question = await Question.findById(id).lean();
    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { ...question, id: question._id.toString() } });
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

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId) {
      return NextResponse.json({ success: false, error: 'Invalid question ID format' }, { status: 400 });
    }

    const body = await request.json();
    if (body.subjectCode) body.subjectCode = String(body.subjectCode).toUpperCase();
    delete body.subjectId;
    delete body.quizId;

    const updated = await Question.findByIdAndUpdate(id, body, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated.toJSON() });
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

    const { id } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId) {
      return NextResponse.json({ success: false, error: 'Invalid question ID format' }, { status: 400 });
    }

    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
