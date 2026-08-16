import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Question from '@/models/Question';
import Subject from '@/models/Subject';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Authentication required.' }, { status: 401 });
    }

    const payload = await request.json();
    const { subjectCode, subjectId, code, category = 'MCQ', questions = [] } = payload;

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Questions array is required and cannot be empty' }, { status: 400 });
    }

    let targetCode = subjectCode || code;
    if (!targetCode && subjectId) {
      if (mongoose.Types.ObjectId.isValid(subjectId)) {
        const foundSubj = await Subject.findById(subjectId).select('code').lean();
        if (foundSubj && foundSubj.code) targetCode = foundSubj.code;
      } else {
        targetCode = subjectId;
      }
    }

    const questionDocs = questions.map(q => {
      const chNum = typeof q.chapter === 'number' ? q.chapter : (parseInt(q.chapter, 10) || 1);
      const multiImages = Array.isArray(q.imagesBase64) && q.imagesBase64.length > 0
        ? q.imagesBase64
        : (q.imageBase64 ? [q.imageBase64] : []);

      const qSubjCode = String(q.subjectCode || targetCode || '').toUpperCase();

      return {
        subjectCode: qSubjCode,
        category: q.category || category,
        questionText: q.questionText,
        questionTextUrdu: q.questionTextUrdu || '',
        options: q.options || [],
        optionsUrdu: q.optionsUrdu || [],
        correctOption: q.correctOption !== undefined ? q.correctOption : 0,
        explanation: q.explanation || '',
        explanationUrdu: q.explanationUrdu || '',
        solution: q.solution || '',
        solutionUrdu: q.solutionUrdu || '',
        chapter: chNum,
        chapterNumber: chNum,
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'Medium',
        imageBase64: q.imageBase64 || (multiImages[0] || ''),
        imagesBase64: multiImages,
        codeSnippet: q.codeSnippet || '',
        codeLanguage: q.codeLanguage || 'cpp',
        solutionCode: q.solutionCode || '',
        solutionCodeLanguage: q.solutionCodeLanguage || 'cpp',
        hasCode: Boolean(q.codeSnippet || q.solutionCode || q.hasCode),
        status: q.status || 'published',
        isStarred: Boolean(q.isStarred),
        isRepeated: Boolean(q.isRepeated),
        isImportant: Boolean(q.isImportant),
        isConceptual: Boolean(q.isConceptual)
      };
    }).filter(q => q.questionText && q.subjectCode);

    if (questionDocs.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid questions with subjectCode found in payload' }, { status: 400 });
    }

    const inserted = await Question.insertMany(questionDocs);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted.length} questions.`,
      count: inserted.length
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
