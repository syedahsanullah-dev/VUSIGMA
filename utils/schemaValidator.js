export function validateSingleQuestion(question, index = 0, defaultCategory = 'MCQ') {
  const errors = [];
  const itemLabel = `Item #${index + 1}`;

  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    return { isValid: false, errors: [`${itemLabel}: Must be a valid JSON object.`] };
  }

  if (!question.questionText || typeof question.questionText !== 'string' || !question.questionText.trim()) {
    errors.push(`${itemLabel}: 'questionText' is required and must be a non-empty string.`);
  }

  const cat = question.category || defaultCategory || 'MCQ';

  if (cat === 'MCQ') {
    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${itemLabel} (MCQ): 'options' must be an array with at least 2 choices.`);
    } else {
      question.options.forEach((opt, optIdx) => {
        if (typeof opt !== 'string' || !opt.trim()) {
          errors.push(`${itemLabel} (MCQ): Option #${optIdx + 1} cannot be empty.`);
        }
      });
    }

    if (question.correctOption !== undefined) {
      const idx = Number(question.correctOption);
      if (isNaN(idx) || idx < 0 || (Array.isArray(question.options) && idx >= question.options.length)) {
        errors.push(`${itemLabel} (MCQ): 'correctOption' index (${question.correctOption}) is out of bounds.`);
      }
    }
  } else if (cat === 'SHORT' || cat === 'LONG') {
    // Subjective questions check
    if (question.solution !== undefined && typeof question.solution !== 'string') {
      errors.push(`${itemLabel} (${cat}): 'solution' must be a string.`);
    }
  }

  // Code Fields Validation
  if (question.solutionCode !== undefined && typeof question.solutionCode !== 'string') {
    errors.push(`${itemLabel}: 'solutionCode' must be a string.`);
  }
  if (question.codeSnippet !== undefined && typeof question.codeSnippet !== 'string') {
    errors.push(`${itemLabel}: 'codeSnippet' must be a string.`);
  }

  // Images Validation
  if (question.imagesBase64 !== undefined) {
    if (!Array.isArray(question.imagesBase64)) {
      errors.push(`${itemLabel}: 'imagesBase64' must be an array of base64 image strings.`);
    } else if (question.imagesBase64.length > 10) {
      errors.push(`${itemLabel}: 'imagesBase64' cannot exceed 10 images per question.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateQuestionsArray(questionsList, defaultCategory = 'MCQ') {
  const allErrors = [];

  if (!Array.isArray(questionsList) || questionsList.length === 0) {
    return { isValid: false, errors: ['JSON payload must be a non-empty array of question objects.'] };
  }

  questionsList.forEach((q, idx) => {
    const res = validateSingleQuestion(q, idx, defaultCategory);
    if (!res.isValid) {
      allErrors.push(...res.errors);
    }
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

export function validateFullSubjectPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, errors: ['Full Subject payload must be a JSON object containing { subject, quizzes, questions }.'] };
  }

  if (!payload.subject || typeof payload.subject !== 'object') {
    errors.push("Missing 'subject' object.");
  } else {
    if (!payload.subject.name || typeof payload.subject.name !== 'string' || !payload.subject.name.trim()) {
      errors.push("Subject 'name' is required.");
    }
    if (!payload.subject.code || typeof payload.subject.code !== 'string' || !payload.subject.code.trim()) {
      errors.push("Subject 'code' is required.");
    }
  }

  if (payload.quizzes && !Array.isArray(payload.quizzes)) {
    errors.push("'quizzes' must be an array of quiz modules.");
  }

  if (payload.questions) {
    if (!Array.isArray(payload.questions)) {
      errors.push("'questions' must be an array of questions.");
    } else {
      payload.questions.forEach((q, idx) => {
        const res = validateSingleQuestion(q, idx, q.category || 'MCQ');
        if (!res.isValid) {
          errors.push(...res.errors);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
