import { useState } from 'react';
import { quizzes } from './lessons';
import type { Level, Question } from './lessons';
import { vocabulary } from './vocabulary';

function wordQuestions(level: Level): Question[] {
  const words = vocabulary[level].flat();
  return words.slice(0,5).map(([word, translation],i) => {
    const correct = i % 4;
    const options = [1,2,3].map(offset => words[(i+offset)%words.length][1]);
    options.splice(correct,0,translation);
    return { prompt: `“${word}” so‘zining tarjimasi qaysi?`, options, correct, explanation: `${word} — ${translation}` };
  });
}

function Player({ name, questions, offset, onFinish }: { name: string; questions: Question[]; offset: number; onFinish: (n:number)=>void }) {
  const [step,setStep] = useState(0);
  const [score,setScore] = useState(0);
  const [answer,setAnswer] = useState<number|null>(null);
  const q = questions[(step+offset)%questions.length];
  return <article className="arena-side">
    <div className="arena-name"><h2>{name}</h2><strong>{score} ball</strong></div>
    {step === questions.length ? <p>Jamoa yakunladi ✓</p> : <>
      <p>{step+1} / {questions.length}</p><h3>{q.prompt}</h3>
      <div className="arena-answers">{q.options.map((option,i)=><button key={option} disabled={answer!==null} className={answer!==null && i===q.correct ? 'arena-correct' : ''} onClick={()=>{
        if (answer!==null) return;
        setAnswer(i);
        if (i===q.correct) setScore(n=>n+1);
      }}>{option}</button>)}</div>
      {answer!==null && <div role="status"><p><strong>{answer===q.correct?'To‘g‘ri!':'To‘g‘ri javob: '+q.options[q.correct]}</strong> {q.explanation}</p>
        <button className="primary-button" onClick={()=>{setAnswer(null);setStep(step+1);if(step+1===questions.length) onFinish(score);}}>{step+1===questions.length?'Yakunlash':'Keyingi savol'}</button></div>}
    </>}
  </article>;
}

export function BoardArena({ level,onExit }: {level:Level;onExit:()=>void}) {
  const [teams,setTeams] = useState(true);
  const [words,setWords] = useState(false);
  const [names,setNames] = useState(['','']);
  const [playing,setPlaying] = useState(false);
  const [scores,setScores] = useState<[number|null,number|null]>([null,null]);
  const labels = names.map((n,i)=>n.trim() || `${i+1}-${teams?'jamoa':'o‘quvchi'}`);
  const questions = words ? wordQuestions(level) : quizzes[level];
  const done = scores[0]!==null && scores[1]!==null;
  return <section className="practice arena">
    <button className="back-button" onClick={onExit}>← Mashqlarga qaytish</button>
    <div className="practice-heading"><div className="practice-kicker">Bir doska · ikki tomon</div><h1>Doska arenasi</h1></div>
    {!playing ? <div className="practice-card">
      <fieldset><legend>Kimlar bellashadi?</legend>{['Ikki jamoa','Ikki o‘quvchi'].map((label,i)=><label key={label}><input type="radio" name="arena-mode" checked={teams===(i===0)} onChange={()=>setTeams(i===0)}/> {label} </label>)}</fieldset>
      <fieldset><legend>O‘yin</legend>{['Savol-javob','Tarjima poygasi'].map((label,i)=><label key={label}><input type="radio" name="arena-game" checked={words===(i===1)} onChange={()=>setWords(i===1)}/> {label} </label>)}</fieldset>
      {names.map((name,i)=><label key={i}>{i+1}-{teams?'jamoa nomi':'o‘quvchi ismi'}<input className="mock-input" maxLength={32} value={name} onChange={e=>setNames(names.map((n,k)=>k===i?e.target.value:n))}/></label>)}
      <p>Har to‘g‘ri javob 1 ball. Har ikki tomon bir xil savollarni turli tartibda yechadi.</p>
      <button className="primary-button" onClick={()=>setPlaying(true)}>Bellashuvni boshlash</button>
    </div> : <>
      {done && <div className="practice-heading" aria-live="polite"><h2>{scores[0]===scores[1]?'Durrang!':labels[scores[0]!>scores[1]!?0:1]+' g‘olib!'}</h2><p>{scores[0]} — {scores[1]}</p><button className="primary-button" onClick={()=>{setScores([null,null]);setPlaying(false);}}>Yangi bellashuv</button></div>}
      <div className="arena-grid">{labels.map((name,i)=><Player key={i} name={name} questions={questions} offset={i*2} onFinish={score=>setScores(previous=>i===0?[score,previous[1]]:[previous[0],score])}/>)}</div>
    </>}
  </section>;
}
