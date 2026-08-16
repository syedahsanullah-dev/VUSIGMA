'use client';
import { extractAllJson } from './jsonCleaner.js';
import { autoRepairItems } from './schemaValidator.js';
import { deduplicateMCQs, ultraDeduplicateQNA } from './deduplicator.js';

export function processRawInput(rawText, options = {}) {
  const logs = [];
  const dedupMode = options.dedupMode || 'exact'; // 'exact' | 'fuzzy' | 'disabled'

  // Step 1: JSON Extraction
  logs.push('Step 1: Extracting JSON blocks from raw input text...');
  const cleanRes = extractAllJson(rawText);
  logs.push(...cleanRes.logs);

  // Step 2: Syntax & Scheme Auto-Repair
  logs.push('Step 2: Running VU SIGMA Schema Auto-Repair...');
  const { repairedItems, fixCount } = autoRepairItems(cleanRes.extractedData);
  logs.push(`Auto-repaired ${fixCount} formatting, indexing, and category/difficulty field issues.`);

  // Step 3: Categorize into preliminary streams (Strictly respecting explicit item.category)
  const preliminaryMCQs = [];
  const preliminaryShorts = [];
  const preliminaryLongs = [];
  const unrecognizedItems = [];

  repairedItems.forEach((item) => {
    if (item.category === 'MCQ' || ('options' in item && Array.isArray(item.options) && item.options.length > 0)) {
      item.category = 'MCQ';
      if (!item.difficulty) item.difficulty = 'Medium';
      preliminaryMCQs.push(item);
    } else if (item.category === 'SHORT' || item.category === 'LONG' || 'solution' in item || 'answer' in item) {
      item.solution = item.solution || item.answer || '';
      if (!item.difficulty) item.difficulty = 'Medium';

      if (item.category === 'SHORT') {
        preliminaryShorts.push(item);
      } else if (item.category === 'LONG') {
        preliminaryLongs.push(item);
      } else {
        const solText = String(item.solution).trim();
        const lines = solText.split('\n').filter((l) => l.trim().length > 0).length;
        const words = solText.split(/\s+/).filter(Boolean).length;

        if (lines >= 5 || words >= 40) {
          item.category = 'LONG';
          preliminaryLongs.push(item);
        } else {
          item.category = 'SHORT';
          preliminaryShorts.push(item);
        }
      }
    } else {
      unrecognizedItems.push(item);
    }
  });

  // Step 4: Category-Specific Deduplication
  logs.push(`Step 3: Running Deduplication (Mode: ${dedupMode.toUpperCase()}) on MCQs, Shorts, and Longs...`);
  
  // Deduplicate MCQs cleanly
  const mcqDedup = deduplicateMCQs(preliminaryMCQs, dedupMode);
  const uniqueMCQs = mcqDedup.unique;
  const duplicateMCQs = mcqDedup.clusters.flatMap((c) => c.duplicates);

  // Deduplicate Short Questions cleanly
  const shortDedup = ultraDeduplicateQNA(preliminaryShorts, dedupMode);
  const uniqueShorts = shortDedup.unique;
  const duplicateShorts = shortDedup.clusters.flatMap((c) => c.duplicates);

  // Deduplicate Long Questions cleanly
  const longDedup = ultraDeduplicateQNA(preliminaryLongs, dedupMode);
  const uniqueLongs = longDedup.unique;
  const duplicateLongs = longDedup.clusters.flatMap((c) => c.duplicates);

  const totalDuplicatesRemoved = mcqDedup.removedCount + shortDedup.removedCount + longDedup.removedCount;
  const totalUniqueCount = uniqueMCQs.length + uniqueShorts.length + uniqueLongs.length;

  logs.push(
    `Deduplication complete: Removed ${totalDuplicatesRemoved} duplicates (${duplicateMCQs.length} MCQs, ${duplicateShorts.length} Shorts, ${duplicateLongs.length} Longs).`
  );
  logs.push(`Final Output: ${uniqueMCQs.length} MCQs, ${uniqueShorts.length} Short Qs, ${uniqueLongs.length} Long Qs.`);

  return {
    rawExtractedCount: cleanRes.extractedData.length,
    syntaxFixedCount: fixCount,
    duplicatesRemovedCount: totalDuplicatesRemoved,
    totalUniqueCount,

    uniqueMCQs,
    uniqueShorts,
    uniqueLongs,
    unrecognizedItems,

    mcqsJson: JSON.stringify(uniqueMCQs, null, 2),
    shortJson: JSON.stringify(uniqueShorts, null, 2),
    longJson: JSON.stringify(uniqueLongs, null, 2),

    duplicateMCQs,
    duplicateShorts,
    duplicateLongs,

    mcqClusters: mcqDedup.clusters,
    shortClusters: shortDedup.clusters,
    longClusters: longDedup.clusters,

    logs,
  };
}
