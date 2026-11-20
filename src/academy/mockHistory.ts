import type { Level } from './lessons';

export const mockSections = ['Listening', 'Reading', 'Writing', 'Speaking'] as const;
export type MockResult = { section: string; details: string[] };
export type MockAttempt = { id: string; completed: number; level: Level; results: MockResult[] };
const prefix = 'shaharcha-mock-v1:';
const limit = 10;

function isAttempt(value: unknown): value is MockAttempt {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<MockAttempt>;
  return typeof entry.id === 'string' && typeof entry.completed === 'number' &&
    Number.isFinite(new Date(entry.completed).getTime()) &&
    ['beginner', 'intermediate', 'ielts'].includes(entry.level ?? '') &&
    Array.isArray(entry.results) && entry.results.length === mockSections.length &&
    entry.results.every((result, i) => result?.section === mockSections[i] &&
      Array.isArray(result.details) && result.details.every(line => typeof line === 'string'));
}

export function readAttempts(store: Storage): MockAttempt[] {
  const attempts: MockAttempt[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const row: unknown = JSON.parse(store.getItem(key) ?? 'null');
      if (isAttempt(row) && key === prefix + row.id) attempts.push(row);
    } catch { /* An unreadable record should not hide other exams. */ }
  }
  return attempts.sort((a, b) => b.completed - a.completed || b.id.localeCompare(a.id));
}

export function saveAttempt(store: Storage, attempt: MockAttempt) {
  store.setItem(prefix + attempt.id, JSON.stringify(attempt));
  for (const old of readAttempts(store).slice(limit)) store.removeItem(prefix + old.id);
}

export function removeAttempt(store: Storage, id: string) {
  store.removeItem(prefix + id);
}
