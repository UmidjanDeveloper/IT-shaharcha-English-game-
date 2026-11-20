import { useEffect, useState } from 'react';
import { readAttempts, removeAttempt } from './mockHistory';
import type { MockAttempt, MockResult } from './mockHistory';

const levelNames = { beginner: 'Boshlang‘ich', intermediate: 'O‘rta', ielts: 'IELTS' };

export function ResultDetails({ results }: { results: MockResult[] }) {
  return <>{results.map(result => <article className="mock-breakdown" key={result.section}>
    <h3>{result.section}</h3>
    <ul>{result.details.map((line, i) => <li key={i}>{line}</li>)}</ul>
  </article>)}</>;
}

export function MockHistory() {
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      try { setAttempts(readAttempts(localStorage)); setError(''); }
      catch { setError('Bu brauzerda saqlangan tarixni o‘qib bo‘lmadi.'); }
    }
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  function remove(id: string) {
    try {
      removeAttempt(localStorage, id);
      setAttempts(previous => previous.filter(attempt => attempt.id !== id));
      setConfirm(null);
      setError('');
    } catch { setError('Bu natijani o‘chirib bo‘lmadi.'); }
  }

  return <section className="mock-history">
    <h2>Mini-mock tarixi</h2>
    {error && <p role="status">{error}</p>}
    {!attempts.length && !error && <p>Mini-mock yakunida “Natijani saqlash” tugmasini bosing. Saqlangan sinovlar shu yerda ko‘rinadi.</p>}
    {attempts.map(attempt => <details key={attempt.id}>
      <summary>{levelNames[attempt.level]} · {new Date(attempt.completed).toLocaleString('uz-UZ', {dateStyle: 'medium', timeStyle: 'short'})}</summary>
      <ResultDetails results={attempt.results} />
      {confirm === attempt.id ? <div className="result-actions">
        <button className="secondary-button" onClick={() => remove(attempt.id)}>O‘chirishni tasdiqlash</button>
        <button className="back-button" onClick={() => setConfirm(null)}>Bekor qilish</button>
      </div> : <button className="back-button" onClick={() => setConfirm(attempt.id)}>Bu natijani o‘chirish</button>}
    </details>)}
  </section>;
}
