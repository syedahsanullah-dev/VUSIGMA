'use client';
export function extractAllJson(content) {
  const logs = [];
  const extractedData = [];
  let blockCount = 0;

  logs.push(`Reading input content (${content.length.toLocaleString()} characters)...`);

  const tryParseJSON = (jsonStr) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      let fixed = jsonStr.replace(/,\s*([\]}])/g, '$1');
      try {
        return JSON.parse(fixed);
      } catch {
        fixed = fixed.replace(/'/g, '"');
        try {
          return JSON.parse(fixed);
        } catch {
          return null;
        }
      }
    }
  };

  let idx = 0;
  const len = content.length;

  while (idx < len) {
    const startArray = content.indexOf('[', idx);
    const startObj = content.indexOf('{', idx);

    const starts = [startArray, startObj].filter((s) => s !== -1);
    if (starts.length === 0) break;

    const startIdx = Math.min(...starts);
    const isArray = startIdx === startArray;
    const openChar = isArray ? '[' : '{';
    const closeChar = isArray ? ']' : '}';

    let depth = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < len; i++) {
      const char = content[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === openChar) {
          depth++;
        } else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      const candidateStr = content.substring(startIdx, endIdx + 1);
      const parsed = tryParseJSON(candidateStr);

      if (parsed !== null) {
        blockCount++;

        // Check if Scheme 2 Full Subject Import payload
        if (typeof parsed === 'object' && parsed !== null && 'subject' in parsed && 'questions' in parsed && Array.isArray(parsed.questions)) {
          logs.push(`Detected Full Subject Import payload for subject "${parsed.subject?.code || 'Subject'}" with ${parsed.questions.length} questions.`);
          parsed.questions.forEach((qItem) => {
            if (typeof qItem === 'object' && qItem !== null) {
              extractedData.push(normalizeKeys(qItem));
            }
          });
        } else if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (typeof item === 'object' && item !== null) {
              extractedData.push(normalizeKeys(item));
            }
          });
          logs.push(`Found JSON array block with ${parsed.length} items at index ${startIdx}`);
        } else if (typeof parsed === 'object' && parsed !== null) {
          const isQuestionObj = Boolean(parsed.questionText || parsed.question || parsed.qText || parsed.prompt || parsed.options || parsed.solution || parsed.answer);
          if (isQuestionObj) {
            extractedData.push(normalizeKeys(parsed));
            logs.push(`Found single JSON question object block at index ${startIdx}`);
          } else {
            logs.push(`Skipped non-question metadata block at index ${startIdx}`);
          }
        }
        idx = endIdx + 1;
        continue;
      }
    }

    idx = startIdx + 1;
  }

  if (extractedData.length === 0) {
    logs.push("Warning: Could not extract any valid JSON blocks.");
  } else {
    logs.push(`Successfully extracted ${extractedData.length} total items from ${blockCount} JSON block(s).`);
  }

  return {
    extractedData,
    blockCount,
    logs,
    rawCleanJson: JSON.stringify(extractedData, null, 2),
  };
}

export function normalizeKeys(item) {
  if (!item || typeof item !== 'object') return item;
  const newItem = { ...item };

  // 1. Question Text key normalization
  if (!newItem.questionText) {
    newItem.questionText = newItem.question || newItem.qText || newItem.prompt || '';
    delete newItem.question;
    delete newItem.qText;
    delete newItem.prompt;
  }
  if (typeof newItem.questionText === 'string') {
    newItem.questionText = newItem.questionText.trim();
  }

  // 2. Solution / Answer key normalization
  if (!newItem.solution) {
    newItem.solution = newItem.answer || newItem.sol || '';
    delete newItem.answer;
    delete newItem.sol;
  }
  if (typeof newItem.solution === 'string') {
    newItem.solution = newItem.solution.trim();
  }

  // 3. Explanation normalization
  if (typeof newItem.explanation === 'string') {
    newItem.explanation = newItem.explanation.trim();
  } else {
    newItem.explanation = newItem.explanation || '';
  }

  // 4. Options array string normalization
  if (Array.isArray(newItem.options)) {
    newItem.options = newItem.options.map((opt) => String(opt).trim());
  }

  // 5. Correct Option normalization (0-based integer index)
  if (newItem.correctOption !== undefined && newItem.correctOption !== null) {
    if (typeof newItem.correctOption === 'number') {
      newItem.correctOption = Math.max(0, Math.floor(newItem.correctOption));
    } else {
      const parsedOpt = parseInt(newItem.correctOption, 10);
      if (!isNaN(parsedOpt)) {
        newItem.correctOption = Math.max(0, parsedOpt);
      } else if (Array.isArray(newItem.options)) {
        // String option matching fallback
        const strOpt = String(newItem.correctOption).trim().toLowerCase();
        const matchedIdx = newItem.options.findIndex(o => o.toLowerCase() === strOpt);
        newItem.correctOption = matchedIdx !== -1 ? matchedIdx : 0;
      } else {
        newItem.correctOption = 0;
      }
    }
  } else {
    if (Array.isArray(newItem.options)) {
      newItem.correctOption = 0;
    }
  }

  // 6. Category ("MCQ", "SHORT", "LONG")
  if (newItem.category) {
    const catUpper = String(newItem.category).toUpperCase();
    if (catUpper.includes('MCQ')) newItem.category = 'MCQ';
    else if (catUpper.includes('SHORT')) newItem.category = 'SHORT';
    else if (catUpper.includes('LONG')) newItem.category = 'LONG';
  } else {
    if (Array.isArray(newItem.options) && newItem.options.length > 0) {
      newItem.category = 'MCQ';
    } else if (newItem.solution) {
      const lines = String(newItem.solution).split('\n').filter((l) => l.trim().length > 0).length;
      const words = String(newItem.solution).split(/\s+/).filter(Boolean).length;
      newItem.category = lines >= 5 || words >= 40 ? 'LONG' : 'SHORT';
    } else {
      newItem.category = 'MCQ';
    }
  }

  // 7. Difficulty ("Easy", "Medium", "Hard")
  if (newItem.difficulty) {
    const diffLower = String(newItem.difficulty).toLowerCase();
    if (diffLower.includes('easy')) newItem.difficulty = 'Easy';
    else if (diffLower.includes('hard')) newItem.difficulty = 'Hard';
    else newItem.difficulty = 'Medium';
  } else {
    newItem.difficulty = 'Medium';
  }

  // 8. Chapter & Chapter Number normalization
  let chNum = 1;
  if (newItem.chapter !== undefined && newItem.chapter !== null) {
    if (typeof newItem.chapter === 'number') {
      chNum = Math.max(1, Math.floor(newItem.chapter));
    } else {
      const numMatch = String(newItem.chapter).match(/\d+/);
      if (numMatch) {
        chNum = Math.max(1, parseInt(numMatch[0], 10));
      }
    }
  } else if (newItem.chapterNumber !== undefined && newItem.chapterNumber !== null) {
    chNum = typeof newItem.chapterNumber === 'number' ? Math.max(1, Math.floor(newItem.chapterNumber)) : (parseInt(newItem.chapterNumber, 10) || 1);
  }
  newItem.chapter = chNum;
  newItem.chapterNumber = chNum;

  // 9. Topic normalization
  if (typeof newItem.topic === 'string' && newItem.topic.trim()) {
    newItem.topic = newItem.topic.trim();
  } else {
    newItem.topic = 'General';
  }

  // 10. Code Fields Normalization
  newItem.codeSnippet = typeof newItem.codeSnippet === 'string' ? newItem.codeSnippet.trim() : '';
  newItem.codeLanguage = typeof newItem.codeLanguage === 'string' && newItem.codeLanguage.trim() ? newItem.codeLanguage.trim().toLowerCase() : 'cpp';
  newItem.solutionCode = typeof newItem.solutionCode === 'string' ? newItem.solutionCode.trim() : '';
  newItem.solutionCodeLanguage = typeof newItem.solutionCodeLanguage === 'string' && newItem.solutionCodeLanguage.trim() ? newItem.solutionCodeLanguage.trim().toLowerCase() : 'cpp';
  newItem.hasCode = Boolean(newItem.codeSnippet || newItem.solutionCode);

  // 11. Images Normalization
  const multiImages = Array.isArray(newItem.imagesBase64) && newItem.imagesBase64.length > 0
    ? newItem.imagesBase64.filter(img => typeof img === 'string' && img.trim().length > 0)
    : (newItem.imageBase64 && typeof newItem.imageBase64 === 'string' && newItem.imageBase64.trim() ? [newItem.imageBase64.trim()] : []);
  
  newItem.imagesBase64 = multiImages;
  newItem.imageBase64 = multiImages[0] || '';

  // 12. Boolean Tag Flags
  newItem.isStarred = Boolean(newItem.isStarred);
  newItem.isRepeated = Boolean(newItem.isRepeated);
  newItem.isImportant = Boolean(newItem.isImportant);
  newItem.isConceptual = Boolean(newItem.isConceptual);

  // 13. Status
  newItem.status = newItem.status ? String(newItem.status).trim().toLowerCase() : 'published';

  return newItem;
}
