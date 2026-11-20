import { useState } from 'react';

const skills = [['listening','Tinglash'],['reading','O‘qish'],['writing','Yozish'],['speaking','Gapirish']];
const steps = [
  {name:'Ilk qadam', focus:'Rasm, qo‘shiq va hikoya orqali birinchi so‘zlarni o‘rganing.', links:[
    ['https://learnenglishkids.britishcouncil.org/grammar-vocabulary/word-games','So‘z o‘yinlari'],
    ['https://learnenglishkids.britishcouncil.org/listen-watch/songs','Qo‘shiqlar'],
    ['https://learnenglishkids.britishcouncil.org/listen-watch/short-stories','Qisqa hikoyalar']
  ]},
  ...['A1','A2','B1','B2','C1'].map((name,i)=>({
    name, focus:['Kundalik mavzularda qisqa gaplarni tushunish va ishlatish.','Oddiy suhbat, xabar va hikoyalar bilan ishlash.','Tanish mavzuda sabab va misol bilan fikr bildirish.','Batafsil matn va turli nuqtai nazarlarni tushunish.','Murakkab matnlar va dalillarga asoslangan fikrlar bilan ishlash.'][i],
    links:skills.filter(([key])=>name!=='C1'||key!=='speaking').map(([key,label])=>[`https://learnenglish.britishcouncil.org/skills/${key}/${name.toLowerCase()}-${key}`,label]),
  })),
];
export function LearningPath({ beginner }: { beginner:boolean }) {
  const [stage,setStage]=useState(beginner?0:3);
  const step=steps[stage];
  return <section className="official-lesson path-lesson">
    <div><strong>British Council bilan o‘quv yo‘li</strong><p>O‘zingizga mos bosqichni oching va bitta ko‘nikmadan boshlang.</p></div>
    <div className="club-tabs" role="group" aria-label="O‘quv bosqichi">{steps.map((item,i)=><button key={item.name} onClick={()=>setStage(i)} aria-pressed={stage===i}>{item.name}</button>)}</div>
    <p>{step.focus}</p><div className="path-links">{step.links.map(([url,label])=><a href={url} key={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>
  </section>;
}
