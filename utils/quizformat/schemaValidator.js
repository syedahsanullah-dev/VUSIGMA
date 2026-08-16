'use client';
import { normalizeKeys } from './jsonCleaner.js';

export function validateSchema(items) {
  const errors = [];
  let validCount = 0;
  let errorCount = 0;
  let warningCount = 0;

  if (!Array.isArray(items)) {
    return {
      totalChecked: 0,
      validCount: 0,
      errorCount: 1,
      warningCount: 0,
      errors: [{ index: 0, field: 'root', message: 'Payload must be an array of question objects', severity: 'error' }]
    };
  }

  items.forEach((item, index) => {
    let itemHasError = false;

    if (!item || typeof item !== 'object') {
      errors.push({
        index,
        field: 'item',
        message: 'Invalid item: Must be a valid JSON object.',
        severity: 'error'
      });
      errorCount++;
      return;
    }

    // 1. Check questionText
    const qText = item.questionText || item.question || item.qText || item.prompt;
    if (!qText || String(qText).trim().length === 0) {
      errors.push({
        index,
        field: 'questionText',
        message: 'Missing or empty questionText',
        severity: 'error',
      });
      itemHasError = true;
      errorCount++;
    }

    // 2. Check category ("MCQ", "SHORT", "LONG")
    const catUpper = item.category ? String(item.category).toUpperCase() : '';
    if (!catUpper || !['MCQ', 'SHORT', 'LONG'].includes(catUpper)) {
      errors.push({
        index,
        field: 'category',
        message: `Missing or invalid category "${item.category}" (allowed: "MCQ", "SHORT", "LONG")`,
        severity: 'warning',
      });
      warningCount++;
    }

    // 3. Check difficulty ("Easy", "Medium", "Hard")
    if (item.difficulty && !['Easy', 'Medium', 'Hard'].includes(String(item.difficulty))) {
      errors.push({
        index,
        field: 'difficulty',
        message: `Invalid difficulty "${item.difficulty}" (allowed: "Easy", "Medium", "Hard")`,
        severity: 'warning',
      });
      warningCount++;
    }

    // 4. MCQ checks
    const effectiveCat = catUpper || (Array.isArray(item.options) ? 'MCQ' : 'SHORT');
    if (effectiveCat === 'MCQ' || 'options' in item || Array.isArray(item.options)) {
      if (!Array.isArray(item.options) || item.options.length < 2) {
        errors.push({
          index,
          field: 'options',
          message: 'MCQ must contain an options array with at least 2 choices',
          severity: 'error',
        });
        itemHasError = true;
        errorCount++;
      } else {
        if (
          item.correctOption === undefined ||
          item.correctOption === null ||
          typeof item.correctOption !== 'number'
        ) {
          errors.push({
            index,
            field: 'correctOption',
            message: 'Missing or non-numeric correctOption index (0-indexed integer required)',
            severity: 'warning',
          });
          warningCount++;
        } else if (item.correctOption < 0 || item.correctOption >= item.options.length) {
          errors.push({
            index,
            field: 'correctOption',
            message: `correctOption index (${item.correctOption}) out of bounds [0..${item.options.length - 1}]`,
            severity: 'error',
          });
          itemHasError = true;
          errorCount++;
        }
      }
    } else if (effectiveCat === 'SHORT' || effectiveCat === 'LONG' || 'solution' in item || 'answer' in item) {
      const sol = item.solution || item.answer;
      if (!sol || String(sol).trim().length === 0) {
        errors.push({
          index,
          field: 'solution',
          message: 'Subjective question solution is empty',
          severity: 'warning',
        });
        warningCount++;
      }
    }

    // 5. Chapter Validation
    if (item.chapter !== undefined && item.chapter !== null) {
      const parsedCh = parseInt(item.chapter, 10);
      if (isNaN(parsedCh) || parsedCh < 1) {
        errors.push({
          index,
          field: 'chapter',
          message: `Chapter "${item.chapter}" should be a positive integer >= 1`,
          severity: 'warning'
        });
        warningCount++;
      }
    }

    // 6. Code Fields Validation
    if (item.codeSnippet && typeof item.codeSnippet !== 'string') {
      errors.push({
        index,
        field: 'codeSnippet',
        message: 'codeSnippet must be a string',
        severity: 'warning'
      });
      warningCount++;
    }
    if (item.solutionCode && typeof item.solutionCode !== 'string') {
      errors.push({
        index,
        field: 'solutionCode',
        message: 'solutionCode must be a string',
        severity: 'warning'
      });
      warningCount++;
    }

    // 7. Image Base64 check
    if (item.imageBase64 && typeof item.imageBase64 === 'string') {
      if (!item.imageBase64.startsWith('data:image/') && !item.imageBase64.startsWith('http')) {
        errors.push({
          index,
          field: 'imageBase64',
          message: 'imageBase64 string should start with data:image/ or URL',
          severity: 'warning',
        });
        warningCount++;
      }
    }

    if (Array.isArray(item.imagesBase64) && item.imagesBase64.length > 10) {
      errors.push({
        index,
        field: 'imagesBase64',
        message: 'imagesBase64 array exceeds maximum 10 images per question',
        severity: 'warning',
      });
      warningCount++;
    }

    if (!itemHasError) {
      validCount++;
    }
  });

  return {
    totalChecked: items.length,
    validCount,
    errorCount,
    warningCount,
    errors,
  };
}

export function autoRepairItems(items) {
  let fixCount = 0;
  const repairLogs = [];

  const repairedItems = items.map((item, index) => {
    const originalJson = JSON.stringify(item);
    const normalized = normalizeKeys(item);
    const newJson = JSON.stringify(normalized);

    if (originalJson !== newJson) {
      fixCount++;
      repairLogs.push(`Item #${index + 1}: Normalized schema fields (${normalized.category}, Ch #${normalized.chapter}, ${normalized.difficulty})`);
    }

    return normalized;
  });

  return {
    repairedItems,
    fixCount,
    repairLogs
  };
}
