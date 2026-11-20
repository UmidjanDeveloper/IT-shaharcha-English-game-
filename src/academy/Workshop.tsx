import { useState } from 'react';

const topics = [
  {name:'Maktab', words:[['pencil','qalam'],['desk','parta'],['ruler','chizg‘ich'],['eraser','o‘chirg‘ich']], sentences:['My pencil is on the desk','I use a ruler in class','Please give me your eraser']},
  {name:'Sayohat', words:[['ticket','chipta'],['station','bekat'],['journey','sayohat'],['map','xarita']], sentences:['We bought a train ticket','The station is near my house','I checked the map before leaving']},
  {name:'Tabiat', words:[['forest','o‘rmon'],['river','daryo'],['leaf','barg'],['mountain','tog‘']], sentences:['The river flows through our town','We walked through the forest','A green leaf fell down']},
  {name:'Texnologiya', words:[['screen','ekran'],['device','qurilma'],['folder','jild'],['keyboard','klaviatura']], sentences:['I saved my work in a folder','The screen is very bright','We use a keyboard to type']},
  {name:'Ovqat', words:[['bread','non'],['rice','guruch'],['milk','sut'],['onion','piyoz']], sentences:['We eat rice for lunch','My sister buys fresh bread','Please put the milk in the fridge']},
  {name:'Sport', words:[['match','o‘yin'],['coach','murabbiy'],['race','poyga'],['team','jamoa']], sentences:['Our team won the match','The coach showed us a new exercise','She finished the race first']},
];
const modes=['So‘z terish','Gap qurish','Juftini ochish'] as const;
export const workshops=topics.flatMap((topic,t)=>modes.map((mode,m)=>({id:`workshop-${t}-${m}`,title:topic.name+' · '+mode,t,m,description:['Tarjimaga qarab inglizcha so‘zni yozing.','Aralash so‘zlardan gap tuzing.','Yopiq kartalardan so‘z va tarjimani juftlang.'][m]})));

function shuffle<T,>(items:T[]) {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
}

export function Workshop({game,onExit}:{game:typeof workshops[number];onExit:()=>void}) {
  const topic=topics[game.t];
  const [step,setStep]=useState(0), [input,setInput]=useState(''),[message,setMessage]=useState('');
  const [deck]=useState(()=>shuffle(topic.words.flat()));
  const [cards,setCards]=useState<string[]>([]),[found,setFound]=useState<string[]>([]);
  const [tiles,setTiles]=useState(()=>shuffle(topic.sentences[0].split(' ')));
  const [ordered,setOrdered]=useState<number[]>([]);
  const total=game.m===1?topic.sentences.length:topic.words.length;
  const word=topic.words[step];
  function advance() {
    setStep(step+1);setOrdered([]);setInput('');setMessage('');
    if(step+1<topic.sentences.length)setTiles(shuffle(topic.sentences[step+1].split(' ')));
  }
  function pick(value:string) {
    const chosen=[...cards,value];setCards(chosen);
    if(chosen.length<2)return;
    if(topic.words.some(pair=>chosen.every(v=>pair.includes(v)))) {
      setFound([...found,...chosen]);setCards([]);advance();
    }else setMessage('Bu kartalar juft emas. Ikkalasini eslab qoling.');
  }
  return <section className="practice"><button className="back-button" onClick={onExit}>← O‘yinlarga qaytish</button>
    <div className="practice-heading"><h1>{game.title}</h1><p>{game.description}</p></div>
    <div className="practice-card"><strong>{step} / {total}</strong>
    {step===total?<><h2>Barcha topshiriqlar bajarildi!</h2><button className="primary-button" onClick={onExit}>Boshqa o‘yin tanlash</button></>:
      game.m===2?<><div className="club-tiles">{deck.map((v,i)=><button key={v} disabled={found.includes(v)||cards.includes(v)||cards.length===2} onClick={()=>pick(v)}>{found.includes(v)||cards.includes(v)?v:`${i+1}-karta`}</button>)}</div>{cards.length===2&&<button className="secondary-button" onClick={()=>{setCards([]);setMessage('');}}>Kartalarni yopish</button>}</>:
      <form onSubmit={e=>{e.preventDefault();const guess=game.m===0?input:ordered.map(i=>tiles[i]).join(' ');const expected=game.m===0?word[0]:topic.sentences[step];if(guess.trim().toLowerCase()===expected.toLowerCase())advance();else setMessage(game.m===0?`Birinchi harf: ${expected[0]}. Yana urinib ko‘ring.`:'So‘z tartibini tekshiring. Tanlangan so‘zni bosib olib tashlashingiz mumkin.');}}>
      {game.m===0?<label>{word[1]}<input className="mock-input" value={input} onChange={e=>setInput(e.target.value)} required autoComplete="off"/></label>:
      <><div className="club-tiles" aria-label="Tuzilgan gap">{ordered.map(i=><button type="button" key={i} onClick={()=>setOrdered(ordered.filter(n=>n!==i))}>{tiles[i]}</button>)}</div><div className="club-tiles">{tiles.map((v,i)=><button type="button" key={i} disabled={ordered.includes(i)} onClick={()=>setOrdered([...ordered,i])}>{v}</button>)}</div></>}
      <button className="primary-button">Tekshirish</button></form>}
      <p role="status">{message}</p>
    </div></section>;
}
