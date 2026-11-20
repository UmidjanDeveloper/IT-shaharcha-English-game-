import { useState } from 'react';
import { BookOpenText, Gamepad2, Headphones, Mic, PencilLine } from 'lucide-react';
import type { CefrLevel } from './grammar/curriculum';
import { grammar } from './grammar/curriculum';

export type PathTarget = 'reading' | 'quiz' | 'speaking' | 'sprint' | 'mock' | 'games';
const steps: { name: CefrLevel; focus: string }[] = [
  { name: 'A1', focus: 'Kundalik mavzularda qisqa gaplarni tushunish va ishlatish: o‘zingiz, oila, maktab.' },
  { name: 'A2', focus: 'Oddiy suhbat, xabar va hikoyalar bilan ishlash; o‘tgan va kelasi zamon.' },
  { name: 'B1', focus: 'Tanish mavzuda sabab va misol bilan fikr bildirish; Present Perfect, shart gaplar.' },
  { name: 'B2', focus: 'Batafsil matn va turli nuqtai nazarlarni tushunish; IELTS 5.5–6.5 darajasi.' },
  { name: 'C1', focus: 'Murakkab matnlar, akademik uslub va dalillar bilan ishlash; IELTS 7+ darajasi.' },
];

export function LearningPath({ beginner, onGrammar, onOpen }: { beginner: boolean; onGrammar: (level: CefrLevel) => void; onOpen: (target: PathTarget) => void }) {
  const [stage, setStage] = useState(beginner ? 0 : 2);
  const step = steps[stage];
  return <section className="official-lesson path-lesson">
    <div><strong>Shaharcha o‘quv yo‘li</strong><p>Darajangizni tanlang: avval grammatika, keyin to‘rt ko‘nikma mashqlari va o‘yinlar.</p></div>
    <div className="club-tabs" role="group" aria-label="O‘quv bosqichi">{steps.map((item, i) => <button key={item.name} onClick={() => setStage(i)} aria-pressed={stage === i}>{item.name}</button>)}</div>
    <p>{step.focus}</p>
    <div className="path-links">
      <button onClick={() => onGrammar(step.name)}><PencilLine size={16} /> Grammatika {step.name} · {grammar[step.name].length} mavzu</button>
      <button onClick={() => onOpen('reading')}><BookOpenText size={16} /> O‘qish</button>
      <button onClick={() => onOpen('mock')}><Headphones size={16} /> Tinglash</button>
      <button onClick={() => onOpen('speaking')}><Mic size={16} /> Gapirish</button>
      <button onClick={() => onOpen('games')}><Gamepad2 size={16} /> O‘yinlar</button>
    </div>
  </section>;
}
