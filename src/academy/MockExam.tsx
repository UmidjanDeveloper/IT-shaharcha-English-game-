import { TutorFeedback } from './TutorFeedback';
import { lazy, Suspense, useState } from 'react';
import { readings, writings } from './lessons';
import type { Level } from './lessons';
import { scoreWriting } from './scoring';
import { SpeakingRound } from './SpeakingStudio';
import { speakingPrompts, analyseSpeaking } from './speaking';

import { mockSections as sections, saveAttempt } from './mockHistory';
import type { MockAttempt, MockResult } from './mockHistory';
import { ResultDetails } from './MockHistory';

const Mentor = lazy(() => import('./Mentor'));

const listening = {
  beginner: [
    ['On which day does the club meet?', 'Friday'],
    ['What is the room number?', '12', 'twelve'],
    ['What should you bring?', 'a pencil', 'pencil'],
  ],
  intermediate: [
    ['Where will the workshop take place?', 'science lab', 'the science lab', 'science laboratory'],
    ['What time does it start?', '3:30', '3.30', '15:30', 'half past three'],
    ['What should students bring?', 'a notebook', 'notebook'],
  ],
  ielts: [
    ['Where will the opening talk take place?', 'gallery', 'the gallery'],
    ['What time does the talk begin?', '6:15', '18:15', '6.15', 'six fifteen'],
    ['Where can visitors collect a map?', 'reception', 'the reception', 'reception desk'],
  ],
};
const normalize = (s: string) => s.toLowerCase().trim().replace(/[.!?]+$/, '').replace(/\s+/g,' ');


export function MockExam({ level, onExit, award }: { level: Level; onExit: () => void; award: () => void }) {
  const [results, setResults] = useState<MockResult[]>([]);
  const [item, setItem] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [spoken, setSpoken] = useState('');
  const [review, setReview] = useState(false);
  const [attempt, setAttempt] = useState<MockAttempt | null>(null);
  const [saveState, setSaveState] = useState<'new' | 'saved' | 'error'>('new');
  function persist() {
    if (!attempt) return;
    try {
      saveAttempt(localStorage, attempt);
      setSaveState('saved');
    } catch { setSaveState('error'); }
  }
  const stage = results.length;
  const reading = readings[level][item];
  const writingSet = level === 'ielts' ? [writings.ielts[0], writings.ielts[2]] : [writings[level][0]];
  const writing = writingSet[item];
  const speakingSet = level === 'ielts' ? [0,2,4] : [0];
  const prompt = speakingPrompts[level][speakingSet[item]];
  const listen = listening[level];
  const itemCount = [1,readings[level].length,writingSet.length,speakingSet.length][stage];

  function change(index: number, text: string) {
    setAnswers(previous => { const next = [...previous]; next[index] = text; return next; });
  }
  function submit() {
    let details: string[];
    if (stage === 0) {
      details = listen.map(([question,...accepted], i) => {
        const correct = accepted.some(value => normalize(answers[i]) === normalize(value));
        return `${correct ? '✓' : '×'} ${question} — ${answers[i]}${correct ? '' : ' · Javob: ' + accepted[0]}`;
      });
      if (details.some(line => line.startsWith('×'))) {
        details.push('Qayta mashq: audioni tinglab, xato savoldagi ma’lumot aytilgan joyda pauza qiling. Javobni qayta yozing.');
      }
    } else if (stage === 1) {
      const q = reading.question;
      details = [`${Number(answers[0]) === q.correct ? '✓' : '×'} ${q.prompt} — Tanlovingiz: ${q.options[Number(answers[0])]}. Javob: ${q.options[q.correct]}. ${q.explanation}`];
    } else if (stage === 2) {
      const report = scoreWriting(answers[0], writing);
      details = [`${writing.title}: ${report.score}/10 mashq balli.`, ...report.criteria.filter(c => !c.passed).map(c => c.hint), ...report.errors.map(e => e.phrase + ' — ' + e.note)];
    } else {
      const report = analyseSpeaking(spoken);
      details = [`${prompt.topic}: ${report.words} ta so‘z.`, ...report.errors.map(e => e.phrase + ' — ' + e.tip)];
      if (report.words < prompt.goal) details.push(`Qayta mashq: “${prompt.topic}” savoliga bitta sabab va aniq misol qo‘shib javob bering.`);
    }
    const combined = [...notes,...details];
    if (item + 1 < itemCount) {
      setNotes(combined); setItem(item+1);
    } else {
      const finished = [...results, { section: sections[stage], details: combined }];
      setResults(finished); setNotes([]); setItem(0);
      if (stage === 3) {
        const completed = Date.now();
        const id = Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
        setAttempt({ id, completed, level, results: finished });
        award();
      }
    }
    setSpoken(''); setAnswers([]); window.scrollTo(0,0);
  }

  const ready = stage === 0 ? listen.every((_,i) => answers[i]?.trim()) : stage === 3 ? !!spoken : !!answers[0]?.trim();
  return <section className="practice">
    <button className="back-button" onClick={onExit}>← Mashqlarga qaytish</button>
    <div className="practice-heading"><div className="practice-kicker">4 ko‘nikma · {level === 'ielts' ? 'IELTS formatida' : level === 'beginner' ? 'Boshlang‘ich' : 'O‘rta'}</div>
      <h1>{stage < 4 ? sections[stage] : 'Sinov yakuni'}</h1>
      <p>{stage < 4 ? `${stage+1}/4 bo‘lim · ${item+1}/${itemCount} topshiriq` : 'To‘rtta ko‘nikma bo‘yicha mini-mock yakunlandi.'}</p>
    </div>
    {stage < 3 && <div className="practice-card speaking-prompt mock-card" key={stage+'-'+item}>
      <div className="coach-stage"><Suspense fallback="Ustoz yuklanmoqda…"><Mentor pose="idle" /></Suspense></div>
      <div>
      {stage === 0 && <><h2>Eshiting va javob yozing</h2><audio className="mock-audio" controls preload="metadata" src={`/listening/${level}.mp3`} />
        {listen.map(([question],i) => <label key={question}>{question}<input className="mock-input" maxLength={200} value={answers[i] ?? ''} onChange={e=>change(i,e.target.value)} /></label>)}</>}
      {stage === 1 && <><h2>{reading.title}</h2><p>{reading.passage}</p><fieldset><legend>{reading.question.prompt}</legend>{reading.question.options.map((option,i)=><label key={option}><input type="radio" name="reading" checked={answers[0]===String(i)} onChange={()=>change(0,String(i))}/> {option}</label>)}</fieldset></>}
      {stage === 2 && <><h2>{writing.title}</h2><p>{writing.instruction}</p><p>{writing.prompt}</p><label>Inglizcha javob<textarea rows={7} className="mock-input" maxLength={5000} value={answers[0] ?? ''} onChange={e=>change(0,e.target.value)} /></label><TutorFeedback skill="Writing" prompt={writing.prompt} answer={answers[0] ?? ''} /></>}
      </div></div>}
    {stage === 3 && <SpeakingRound key={item} prompt={prompt} award={()=>{}} onTranscriptReview={setSpoken} />}
    {stage < 4 ? <button className="primary-button" style={{marginTop:14}} disabled={!ready} onClick={submit}>{stage === 3 && item+1 === itemCount ? 'Natijalarni ko‘rish' : 'Javobni topshirish →'}</button> :
      <div className="practice-card"><h2>Natijalar</h2><ResultDetails results={results} />
      <p className="grading-note">Bu brauzerda oxirgi 10 ta saqlangan sinov ko‘rinadi. Umumiy doskada natijani keyingi o‘quvchi ham ko‘ra oladi.</p>
      <button className="primary-button" disabled={saveState === 'saved'} onClick={persist}>{saveState === 'saved' ? 'Natija saqlandi' : 'Natijani saqlash'}</button>
      {saveState === 'error' && <p role="status">Brauzer natijani saqlay olmadi. Hisobotni shu sahifada ko‘rishingiz mumkin.</p>}
      <button className="secondary-button" onClick={()=>setReview(!review)}>Rasmiy IELTS namunalari</button>
      {review && <p><a className="speaking-source" href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noreferrer">IELTS Academic sample test questions ↗</a></p>}</div>}
    <p className="grading-note">Mini-mock original o‘quv topshiriqlaridan tuzilgan. Ballar mashq mezonlarini bildiradi. <a href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test" target="_blank" rel="noreferrer"><u>Rasmiy IELTS Academic namunalari ↗</u></a></p>
    <a className="speaking-source" href="/mentor/CREDITS.txt" target="_blank" rel="noreferrer">3D harakat manbasi va litsenziya</a>
  </section>;
}
