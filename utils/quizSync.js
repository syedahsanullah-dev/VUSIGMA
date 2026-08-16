import Quiz from '@/models/Quiz';
import Question from '@/models/Question';
import Subject from '@/models/Subject';

/**
 * Calculates and persists the accurate question count for a specific Quiz document in MongoDB
 * @param {string|ObjectId} quizId - MongoDB ObjectId or ID string of the target Quiz
 * @returns {Promise<number>} Updated question count
 */
export async function syncQuizQuestionCount(quizId) {
  if (!quizId) return 0;
  try {
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) return 0;

    let count = 0;

    // 1. Explicit questionIds array attached to Quiz
    if (Array.isArray(quiz.questionIds) && quiz.questionIds.length > 0) {
      count = quiz.questionIds.length;
    } else {
      // 2. Direct question.quizId links in Question collection
      const directCount = await Question.countDocuments({ quizId: quiz._id });
      if (directCount > 0) {
        count = directCount;
      } else {
        // 3. Chapter range or Topic criteria
        const hasChapters = Array.isArray(quiz.chapters) && quiz.chapters.length > 0;
        const hasTopics = Array.isArray(quiz.topics) && quiz.topics.length > 0;

        if (hasChapters || hasTopics) {
          let sCode = quiz.subjectCode;
          if (!sCode && quiz.subjectId) {
            const subj = await Subject.findById(quiz.subjectId).select('code').lean();
            if (subj) sCode = subj.code;
          }

          const filter = {};
          if (sCode) filter.subjectCode = sCode.toUpperCase();
          if (hasChapters) filter.chapter = { $in: quiz.chapters };
          if (hasTopics) filter.topic = { $in: quiz.topics };
          if (quiz.category && quiz.category !== 'MIXED') {
            filter.category = quiz.category;
          }
          count = await Question.countDocuments(filter);
        } else if (quiz.isFullCourse || quiz.quizType === 'FULL_SUBJECT' || quiz.isAllQuestions) {
          let sCode = quiz.subjectCode;
          if (!sCode && quiz.subjectId) {
            const subj = await Subject.findById(quiz.subjectId).select('code').lean();
            if (subj) sCode = subj.code;
          }

          const filter = {};
          if (sCode) filter.subjectCode = sCode.toUpperCase();
          if (quiz.category && quiz.category !== 'MIXED') {
            filter.category = quiz.category;
          }
          count = await Question.countDocuments(filter);
        } else {
          // Unconfigured or newly created quiz module with no selected questions -> 0 questions!
          count = 0;
        }
      }
    }

    await Quiz.findByIdAndUpdate(quiz._id, { questionCount: count });
    return count;
  } catch (err) {
    console.error(`[quizSync] Failed to sync questionCount for quiz ${quizId}:`, err);
    return 0;
  }
}

/**
 * Batch syncs questionCount for all quizzes belonging to a specific Subject in a single aggregation
 * @param {string|ObjectId} subjectId 
 */
export async function syncSubjectQuizzesCount(subjectId) {
  if (!subjectId) return;
  try {
    const [subj, quizzes] = await Promise.all([
      Subject.findById(subjectId).select('code').lean(),
      Quiz.find({ subjectId }).select('_id category chapters topics questionIds isFullCourse quizType isAllQuestions').lean()
    ]);

    if (!quizzes || quizzes.length === 0) return;
    const sCode = subj?.code ? subj.code.toUpperCase() : null;

    // Perform a single aggregation pipeline for question counts by category
    const categoryCounts = sCode ? await Question.aggregate([
      { $match: { subjectCode: sCode } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]) : [];

    const countMap = {};
    let totalAll = 0;
    categoryCounts.forEach(({ _id, count }) => {
      const cat = (_id || 'MCQ').toUpperCase();
      countMap[cat] = count;
      totalAll += count;
    });

    const bulkOps = quizzes.map(quiz => {
      let count = 0;
      if (Array.isArray(quiz.questionIds) && quiz.questionIds.length > 0) {
        count = quiz.questionIds.length;
      } else {
        const hasCh = Array.isArray(quiz.chapters) && quiz.chapters.length > 0;
        const hasTop = Array.isArray(quiz.topics) && quiz.topics.length > 0;

        if (hasCh || hasTop) {
          count = quiz.questionCount || 0;
        } else if (quiz.isFullCourse || quiz.quizType === 'FULL_SUBJECT' || quiz.isAllQuestions) {
          const qCat = (quiz.category || 'MCQ').toUpperCase();
          if (qCat === 'MIXED') {
            count = totalAll;
          } else {
            count = countMap[qCat] || 0;
          }
        } else {
          count = 0;
        }
      }

      return {
        updateOne: {
          filter: { _id: quiz._id },
          update: { $set: { questionCount: count } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await Quiz.bulkWrite(bulkOps);
    }
  } catch (err) {
    console.error(`[quizSync] Failed to sync quizzes for subject ${subjectId}:`, err);
  }
}
