import { lazy, Suspense, useState } from 'react';
import { SpeakingRound } from './SpeakingStudio';
import { TutorFeedback } from './TutorFeedback';
const Mentor = lazy(()=>import('./Mentor'));
const base='https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests';
const skills=['Listening','Reading','Writing','Speaking'] as const;
export function OfficialIELTS(){
  const [skill,setSkill]=useState<typeof skills[number]>('Listening');
  const [question,setQuestion]=useState('');
  const [selected,setSelected]=useState('');
  const [answer,setAnswer]=useState('');
  function change(next:typeof skill){setSkill(next);setQuestion('');setSelected('');setAnswer('');}
  return <section className="official-hub"><h2>British Council IELTS</h2>
    <p>Ko‘nikmani tanlang va rasmiy topshiriqni oching.</p>
    <div className="club-tabs">{skills.map(s=><button key={s} onClick={()=>change(s)} aria-pressed={skill===s}>{s}</button>)}</div>
    <div className="official-station"><div className="coach-stage"><Suspense fallback="Ustoz yuklanmoqda…"><Mentor pose="idle"/></Suspense></div>
      <div><h3>{skill} mashqi</h3><p>Savol va ko‘rsatmalar British Council saytida ochiladi. {skill==='Listening'?'Audioni manbadagi pleyrda tinglang.':skill==='Reading'?'Matnni o‘qing va javobni manbadagi kalit bilan tekshiring.':'Mashqni tanlagach, savolni shu yerga kiriting.'}</p>
      <a className="primary-button" href={base+'/'+skill.toLowerCase()} target="_blank" rel="noreferrer">British Council’da ochish ↗</a>
      <a className="speaking-source" href={base} target="_blank" rel="noreferrer">Barcha rasmiy mashqlar ↗</a>
      </div></div>
    {(skill==='Writing'||skill==='Speaking') && <div className="practice-card">
      <label>Manbadan tanlangan savol<textarea className="mock-input" rows={3} maxLength={1500} value={question} onChange={e=>{setQuestion(e.target.value);setSelected('');setAnswer('');}}/></label>
      <button className="secondary-button" disabled={!question.trim()||selected===question.trim()} onClick={()=>setSelected(question.trim())}>Shu savol bilan mashq qilish</button>
      {selected && (skill==='Speaking'?<SpeakingRound key={selected} prompt={{question:selected,section:'Speaking',topic:'Tanlangan topshiriq',cues:[],goal:20,model:''}}/>:<><label>Inglizcha javob<textarea className="mock-input" rows={7} maxLength={5000} value={answer} onChange={e=>setAnswer(e.target.value)}/></label><TutorFeedback skill="Writing" prompt={selected} answer={answer}/></>)}
    </div>}
    <a className="speaking-source" href="/mentor/CREDITS.txt" target="_blank" rel="noreferrer">3D model va harakat manbasi ↗</a>
  </section>;
}
