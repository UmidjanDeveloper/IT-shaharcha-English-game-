import { useState } from 'react';
import { ALL_GAMES } from './gameCatalog';
import { workshops } from './Workshop';
import { grammarGames } from './grammar/GrammarCourse';
import { Search } from 'lucide-react';
import BlurText from '../vendor/react-bits/BlurText';
import { RevealGroup, RevealItem } from './motion/Reveal';
import type { GameMode } from '../types';

export type LaunchGame = {id:string;title:string};
const catalog = [
  ...ALL_GAMES.map(g=>({...g,title:g.title.replace(/[\p{Extended_Pictographic}\uFE0F\u2B50]/gu,'').trim()})),
  ...grammarGames.map(g=>({...g,mode:'solo' as GameMode})),
  ...workshops.map(g=>({...g,mode:'solo' as GameMode,icon:'✦'}))
];
export function Library({onStart}:{onStart:(g:LaunchGame)=>void}) {
  const [mode,setMode]=useState<GameMode|'all'>('all');
  const [query,setQuery]=useState('');
  const [count,setCount]=useState(9);
  const games=catalog.filter(g=>(mode==='all'||g.mode===mode)&&g.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="academy-section club-library" id="club-library"><div className="section-head"><div><h2><BlurText text="O‘yin tanlang" animateBy="words" delay={80} /></h2><p>{catalog.length} ta o‘yin va mavzuli mashq. Kim bilan o‘ynaysiz?</p></div>
    <label className="library-search"><Search size={17}/><input aria-label="O‘yinni qidirish" placeholder="O‘yinni qidirish" value={query} onChange={e=>{setQuery(e.target.value);setCount(9);}}/></label></div>
    <div className="club-tabs">{(['all','solo','duel','team'] as const).map((v,i)=><button key={v} aria-pressed={mode===v} onClick={()=>{setMode(v);setCount(9);}}>{['Barchasi','Yakka','Ikki kishi','Jamoalar'][i]}</button>)}</div>
    <RevealGroup key={mode+query} className="library-grid" stagger={.035}>{games.slice(0,count).map(g=><RevealItem key={g.id}><button onClick={()=>onStart(g)}><span aria-hidden="true">{g.icon}</span><strong>{g.title}</strong><small>{g.description}</small></button></RevealItem>)}</RevealGroup>
    {!games.length&&<p>Bu nomdagi o‘yin topilmadi.</p>}
    {games.length>count&&<button className="secondary-button" onClick={()=>setCount(count+12)}>Yana o‘yinlar ({games.length-count})</button>}
  </section>;
}
