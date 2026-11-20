import { useState } from 'react';
import { BookOpenText, Gamepad2, Headphones, Mic, PencilLine } from 'lucide-react';
import { headway } from './grammar/headway';
import type { HeadwayLevelId } from './grammar/headway';

export type PathTarget = 'reading' | 'quiz' | 'speaking' | 'sprint' | 'mock' | 'games';

export function LearningPath({ beginner, onGrammar, onOpen }: { beginner: boolean; onGrammar: (level: HeadwayLevelId) => void; onOpen: (target: PathTarget) => void }) {
  const [stage, setStage] = useState(beginner ? 0 : 2);
  const book = headway[stage];
  return <section className="official-lesson path-lesson">
    <div><strong>Headway o‘quv yo‘li</strong><p>Kitobingizni tanlang: grammatika kitob tartibida, so‘ng to‘rt ko‘nikma mashqlari va o‘yinlar.</p></div>
    <div className="club-tabs" role="group" aria-label="Headway darajasi">{headway.map((b, i) => <button key={b.id} onClick={() => setStage(i)} aria-pressed={stage === i}>{b.title}</button>)}</div>
    <p>{book.about}</p>
    <div className="path-links">
      <button onClick={() => onGrammar(book.id)}><PencilLine size={16} /> Headway {book.title} grammatikasi · {book.lessons.length} dars</button>
      <button onClick={() => onOpen('reading')}><BookOpenText size={16} /> O‘qish</button>
      <button onClick={() => onOpen('mock')}><Headphones size={16} /> Tinglash</button>
      <button onClick={() => onOpen('speaking')}><Mic size={16} /> Gapirish</button>
      <button onClick={() => onOpen('games')}><Gamepad2 size={16} /> O‘yinlar</button>
    </div>
  </section>;
}
