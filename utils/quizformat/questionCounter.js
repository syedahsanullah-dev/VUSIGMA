'use client';
export function analyzeQuestionData(items) {
  let mcqCount = 0;
  let qaCount = 0;
  let shortCount = 0;
  let longCount = 0;
  let unrecognizedCount = 0;
  let missingCorrectOptionCount = 0;

  const chapterDistribution = {};
  const difficultyDistribution = {
    Easy: 0,
    Medium: 0,
    Hard: 0,
    Unspecified: 0,
  };
  const categoryDistribution = {
    MCQ: 0,
    SHORT: 0,
    LONG: 0,
    Unspecified: 0,
  };

  items.forEach((item) => {
    // Chapter stats
    const chapter = item.chapter || item.lecture || 'Unspecified Chapter';
    chapterDistribution[chapter] = (chapterDistribution[chapter] || 0) + 1;

    // Difficulty stats
    const diff = item.difficulty || 'Unspecified';
    if (diff in difficultyDistribution) {
      difficultyDistribution[diff]++;
    } else {
      difficultyDistribution.Unspecified++;
    }

    // Category stats
    const cat = item.category || 'Unspecified';
    if (cat in categoryDistribution) {
      categoryDistribution[cat]++;
    } else {
      categoryDistribution.Unspecified++;
    }

    // Type classification
    if ('options' in item && Array.isArray(item.options)) {
      mcqCount++;
      if (
        item.correctOption === undefined ||
        item.correctOption === null ||
        typeof item.correctOption !== 'number' ||
        item.correctOption < 0 ||
        item.correctOption >= item.options.length
      ) {
        missingCorrectOptionCount++;
      }
    } else if ('solution' in item || 'answer' in item) {
      qaCount++;
      const solText = String(item.solution || item.answer || '').trim();
      const lineCount = solText.split('\n').filter((l) => l.trim().length > 0).length;
      const wordCount = solText.split(/\s+/).filter(Boolean).length;

      if (item.category === 'LONG' || lineCount >= 5 || wordCount >= 40) {
        longCount++;
      } else {
        shortCount++;
      }
    } else {
      unrecognizedCount++;
    }
  });

  return {
    totalItems: items.length,
    mcqCount,
    qaCount,
    shortCount,
    longCount,
    unrecognizedCount,
    missingCorrectOptionCount,
    difficultyDistribution,
    categoryDistribution,
    chapterDistribution,
  };
}
