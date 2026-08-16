import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Setting from '@/models/Setting';
import { getAuthUser } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  showExplanations: true,
  examTimerEnabled: true,
  maxExamQuestions: 30,
  passThreshold: 60,
  allowSelfRegistration: true,
  maintenanceMode: false
};

export async function GET(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const settingsDocs = await Setting.find();
    const settingsObj = { ...DEFAULT_SETTINGS };

    settingsDocs.forEach((doc) => {
      settingsObj[doc.key] = doc.value;
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser();
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin access required.' }, { status: 403 });
    }

    const updates = await request.json();
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid settings object payload.' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
    }

    const allDocs = await Setting.find();
    const finalSettings = { ...DEFAULT_SETTINGS };
    allDocs.forEach((doc) => {
      finalSettings[doc.key] = doc.value;
    });

    return NextResponse.json({ success: true, settings: finalSettings });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
