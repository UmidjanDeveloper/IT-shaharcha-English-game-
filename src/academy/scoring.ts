import type { Writing } from './lessons';

function normalize(text: string) {
  return text.normalize('NFKC').toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
}

export function scoreWriting(answer: string, task: Writing) {
  const text = normalize(answer);
  const criteria = task.criteria.map(({ label, patterns, hint }) => ({
    label,
    passed: patterns.some(pattern => pattern.test(text)),
    hint,
  }));
  const errors = task.mistakes.flatMap(({ pattern, note }) => {
    const match = text.match(pattern);
    return match ? [{ phrase: match[0], note }] : [];
  });
  const points = Math.max(0, criteria.filter(item => item.passed).length - errors.length);
  return { score: Math.round(points * 10 / criteria.length), criteria, errors };
}
