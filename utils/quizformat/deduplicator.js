'use client';
export function cleanAndNormalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deduplicateMCQs(items, mode = 'exact') {
  if (mode === 'disabled') {
    return {
      unique: items,
      removedCount: 0,
      originalCount: items.length,
      clusters: []
    };
  }

  const unique = [];
  const clusters = [];
  const seenSignatures = new Map();

  let removedCount = 0;

  items.forEach((item, idx) => {
    let qText = '';
    let normOptions = '';

    if (mode === 'exact') {
      qText = String(item.questionText || item.question || '').trim();
      const options = Array.isArray(item.options) ? item.options : [];
      normOptions = options.map((opt) => String(opt).trim()).join('||');
    } else {
      qText = cleanAndNormalizeText(item.questionText || item.question || '');
      const options = Array.isArray(item.options) ? item.options : [];
      normOptions = options.map((opt) => cleanAndNormalizeText(opt)).join('||');
    }

    const signature = `Q:${qText}|OPT:${normOptions}`;

    if (!seenSignatures.has(signature)) {
      seenSignatures.set(signature, item);
      unique.push(item);
    } else {
      removedCount++;
      const existing = seenSignatures.get(signature);
      const existingCluster = clusters.find((c) => c.signature === signature);

      if (existingCluster) {
        existingCluster.duplicates.push(item);
      } else {
        clusters.push({
          id: `cluster-${idx}`,
          signature,
          kept: existing,
          duplicates: [item],
          reason: mode === 'exact' ? 'Exact Question Text and Options Match' : 'Identical Question Text and Normalized Options',
        });
      }
    }
  });

  return {
    unique,
    removedCount,
    originalCount: items.length,
    clusters,
  };
}

export function deduplicateQNA(items, mode = 'exact') {
  if (mode === 'disabled') {
    return {
      unique: items,
      removedCount: 0,
      originalCount: items.length,
      clusters: []
    };
  }

  const unique = [];
  const clusters = [];
  const seenSignatures = new Map();

  let removedCount = 0;

  items.forEach((item, idx) => {
    const qText = String(item.questionText || item.question || '').trim().toLowerCase();
    const signature = `Q:${qText}`;

    if (!seenSignatures.has(signature)) {
      seenSignatures.set(signature, item);
      unique.push(item);
    } else {
      removedCount++;
      const existing = seenSignatures.get(signature);
      const existingCluster = clusters.find((c) => c.signature === signature);

      if (existingCluster) {
        existingCluster.duplicates.push(item);
      } else {
        clusters.push({
          id: `cluster-${idx}`,
          signature,
          kept: existing,
          duplicates: [item],
          reason: 'Exact Match Question Text',
        });
      }
    }
  });

  return {
    unique,
    removedCount,
    originalCount: items.length,
    clusters,
  };
}

export function ultraDeduplicateQNA(items, mode = 'exact') {
  if (mode === 'disabled') {
    return {
      unique: items,
      removedCount: 0,
      originalCount: items.length,
      clusters: []
    };
  }

  const unique = [];
  const clusters = [];
  const seenSignatures = new Map();

  let removedCount = 0;

  items.forEach((item, idx) => {
    const cleanQ = mode === 'exact' ? String(item.questionText || item.question || '').trim() : cleanAndNormalizeText(item.questionText || item.question || '');
    const cleanSol = mode === 'exact' ? String(item.solution || item.answer || '').trim() : cleanAndNormalizeText(item.solution || item.answer || '');

    const signature = `Q:${cleanQ}|S:${cleanSol}`;

    if (!seenSignatures.has(signature)) {
      seenSignatures.set(signature, item);
      unique.push(item);
    } else {
      removedCount++;
      const existing = seenSignatures.get(signature);
      const existingCluster = clusters.find((c) => c.signature === signature);

      if (existingCluster) {
        existingCluster.duplicates.push(item);
      } else {
        clusters.push({
          id: `cluster-${idx}`,
          signature,
          kept: existing,
          duplicates: [item],
          reason: mode === 'exact' ? 'Exact Question & Solution Match' : 'Deep Signature Match (Punctuation, case & whitespace stripped)',
        });
      }
    }
  });

  return {
    unique,
    removedCount,
    originalCount: items.length,
    clusters,
  };
}
