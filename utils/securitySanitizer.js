/**
 * Security Sanitizer for Anti-Hacking & XSS Protection
 */

export function sanitizeCodeSnippet(input) {
  if (typeof input !== 'string') return '';

  // 1. Remove dangerous script tags and execution wrappers
  let clean = input
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '');

  return clean.trim();
}

export function validateImageBase64(base64Str) {
  if (typeof base64Str !== 'string') return false;
  if (!base64Str.startsWith('data:image/')) return false;

  const validHeaderRegex = /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i;
  return validHeaderRegex.test(base64Str);
}

export function sanitizeQuestionPayload(question) {
  if (!question || typeof question !== 'object') return question;

  const sanitized = { ...question };

  if (typeof sanitized.questionText === 'string') {
    sanitized.questionText = sanitizeCodeSnippet(sanitized.questionText);
  }

  if (typeof sanitized.codeSnippet === 'string') {
    sanitized.codeSnippet = sanitizeCodeSnippet(sanitized.codeSnippet);
  }

  if (typeof sanitized.solution === 'string') {
    sanitized.solution = sanitizeCodeSnippet(sanitized.solution);
  }

  if (typeof sanitized.solutionCode === 'string') {
    sanitized.solutionCode = sanitizeCodeSnippet(sanitized.solutionCode);
  }

  if (typeof sanitized.explanation === 'string') {
    sanitized.explanation = sanitizeCodeSnippet(sanitized.explanation);
  }

  if (Array.isArray(sanitized.options)) {
    sanitized.options = sanitized.options.map(opt => typeof opt === 'string' ? sanitizeCodeSnippet(opt) : opt);
  }

  // Validate multi-image array
  if (Array.isArray(sanitized.imagesBase64)) {
    sanitized.imagesBase64 = sanitized.imagesBase64.filter(img => validateImageBase64(img));
  }

  return sanitized;
}
