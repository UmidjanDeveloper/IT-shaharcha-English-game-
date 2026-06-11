import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameDifficulty, Team, WordPair } from '../types';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Swords, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TugOfWarProps {
  teamLeft: Team; teamRight: Team; wordList: WordPair[];
  selectedDifficulty?: GameDifficulty;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (l: number, r: number) => void;
}

const EASY: WordPair[] = [
  {uz:'Rivojlantirmoq',en:'Develop'},{uz:'Taqdim etmoq',en:'Present'},
  {uz:'Tushunmoq',en:'Understand'},{uz:'Imkoniyat',en:'Opportunity'},
  {uz:'Tajriba',en:'Experience'},{uz:'Sayohat qilmoq',en:'Travel'},
  {uz:'Harakat qilmoq',en:'Attempt'},{uz:'Zaruriy',en:'Necessary'},
  {uz:'Qaror qabul qilmoq',en:'Decide'},{uz:'Yaxshilamoq',en:'Improve'},
  {uz:'Muallif',en:'Author'},{uz:'Kashf qilmoq',en:'Discover'},
  {uz:'Maslahat bermoq',en:'Advise'},{uz:'Niyat',en:'Purpose'},
  {uz:"G'alaba",en:'Victory'},{uz:'Tasvirlamoq',en:'Describe'},
  {uz:'Solishtirmoq',en:'Compare'},{uz:"Ta'sir qilmoq",en:'Influence'},
  {uz:'Erishmoq',en:'Achieve'},{uz:'Tavsiya qilmoq',en:'Recommend'},
];
const MEDIUM: WordPair[] = [
  {uz:'Tergov qilmoq',en:'Investigate'},{uz:'Cheklamoq',en:'Restrict'},
  {uz:'Tashvishlanish',en:'Anxiety'},{uz:'Isbotlamoq',en:'Verify'},
  {uz:'Samarali',en:'Efficient'},{uz:'Ilhomlantirmoq',en:'Inspire'},
  {uz:'Moslashmoq',en:'Adapt'},{uz:'Ziddiyat',en:'Conflict'},
  {uz:'Raqobatlashmoq',en:'Compete'},{uz:'Kafolatlamoq',en:'Guarantee'},
  {uz:'Foyda keltiradigan',en:'Beneficial'},{uz:'Faraz qilmoq',en:'Assume'},
  {uz:'Xabardorlik',en:'Awareness'},{uz:"Hissa qo'shmoq",en:'Contribute'},
  {uz:'Baholash',en:'Assessment'},{uz:'Hamkorlik qilmoq',en:'Collaborate'},
  {uz:'Izchil',en:'Consistent'},{uz:'Kengaytirish',en:'Expand'},
  {uz:'Tahlil qilmoq',en:'Analyze'},{uz:'Tasdiqlamoq',en:'Confirm'},
];
const HARD: WordPair[] = [
  {uz:'Hamma joyda mavjud',en:'Ubiquitous'},{uz:'Fikrlash tarzi',en:'Paradigm'},
  {uz:'Xulosa chiqarmoq',en:'Extrapolate'},{uz:'Yarashtirish',en:'Reconcile'},
  {uz:"Yonma-yon qo'yish",en:'Juxtapose'},{uz:'Vazminlik',en:'Equanimity'},
  {uz:'Murakkab jumboq',en:'Conundrum'},{uz:'Maqtovga loyiq',en:'Meritorious'},
  {uz:'Dalillar bilan isbotlamoq',en:'Substantiate'},{uz:"O'tkinchi",en:'Ephemeral'},
  {uz:'Pinhona',en:'Surreptitious'},{uz:'Zerikarli',en:'Monotonous'},
  {uz:'Chuqur bilim',en:'Erudition'},{uz:"Eng yuqori cho'qqi",en:'Zenith'},
  {uz:'Mavhum',en:'Obscure'},{uz:'Chechanlik',en:'Eloquence'},
  {uz:'Chidamli',en:'Resilient'},{uz:"Inkor etib bo'lmaydigan",en:'Irrefutable'},
  {uz:'Amaliy',en:'Pragmatic'},{uz:"G'ayratli",en:'Assiduous'},
];

type CS = 'idle'|'pulling'|'slipping'|'won'|'lost';

// ─────────────────────────────────────────────────────────────────────────────
// UZBEK CHARACTER — realistic proportions, atlas shirt, doppi hat.
// Upper body rotates around hip pivot; legs stay planted on ground.
// ─────────────────────────────────────────────────────────────────────────────
function TugChar({ team, bx, state }: { team:'left'|'right'; bx:number; state:CS }) {
  const L  = team === 'left';
  const rs = L ? 1 : -1;
  const GY = 316;
  const HY = GY - 76; // hip pivot Y = 240

  const lean =
    state==='pulling'  ? (L ? -34 : 34) :
    state==='slipping' ? (L ?  16 : -16) :
    state==='won'      ? 0 :
    state==='lost'     ? (L ?  10 : -10) :
    (L ? -22 : 22);

  const SK  = '#C4784A', SKD = '#9A5C35';
  const SC  = L ? '#1565C0' : '#B71C1C';
  const SP  = L ? '#64B5F6' : '#FFB300';
  const PA  = '#1a1a3e';
  const SH  = L ? '#1565C0' : '#B71C1C';

  const fFX = bx + rs * 34;
  const bFX = bx - rs * 28;

  return (
    <g>
      <ellipse cx={bx} cy={GY+9} rx={32} ry={8} fill="rgba(0,0,0,0.22)"/>

      {/* LEGS */}
      <path d={`M ${bx-rs*8} ${HY+4} Q ${bFX+rs} ${GY-42} ${bFX} ${GY}`}
        stroke={PA} strokeWidth={22} fill="none" strokeLinecap="round"/>
      <path d={`M ${bx+rs*8} ${HY+4} Q ${fFX-rs*3} ${GY-44} ${fFX} ${GY}`}
        stroke={PA} strokeWidth={24} fill="none" strokeLinecap="round"/>

      {/* SHOES */}
      <ellipse cx={bFX} cy={GY+5} rx={17} ry={8} fill={SH} opacity={0.72}/>
      <ellipse cx={fFX} cy={GY+5} rx={19} ry={9} fill={SH}/>
      <line x1={fFX-7} y1={GY+1} x2={fFX+rs*9} y2={GY+3}
        stroke="white" strokeWidth={1.5} opacity={0.45} strokeLinecap="round"/>

      {/* UPPER BODY (rotated around hip) */}
      <g transform={`rotate(${lean}, ${bx}, ${HY})`}>

        {/* BACK ARM */}
        <path d={`M ${bx-rs*16} ${HY-60} C ${bx-rs*28} ${HY-48} ${bx-rs*32} ${HY-33} ${bx-rs*26} ${HY-22}`}
          stroke={SC} strokeWidth={18} fill="none" strokeLinecap="round"/>
        <circle cx={bx-rs*26} cy={HY-22} r={10} fill={SKD}/>

        {/* SHIRT */}
        <path d={`M ${bx-16} ${HY} L ${bx-24} ${HY-72}
          C ${bx-22} ${HY-82} ${bx+22} ${HY-82} ${bx+24} ${HY-72} L ${bx+16} ${HY} Z`}
          fill={SC}/>

        {/* Atlas ikat leaf-oval pattern */}
        {([
          [bx-12,HY-18, 25],[bx+1, HY-18,-20],[bx+13,HY-20, 22],
          [bx-8, HY-38,-18],[bx+10,HY-40, 20],
          [bx-11,HY-58, 22],[bx+2, HY-57,-15],[bx+14,HY-60, 18],
        ] as [number,number,number][]).map(([px,py,rot],i)=>(
          <ellipse key={i} cx={px} cy={py} rx={5} ry={8}
            fill={SP} opacity={0.42} transform={`rotate(${rot},${px},${py})`}/>
        ))}

        {/* Collar */}
        <path d={`M ${bx-10} ${HY-72} L ${bx} ${HY-62} L ${bx+10} ${HY-72}`}
          fill={SKD} opacity={0.45}/>

        {/* NECK */}
        <ellipse cx={bx} cy={HY-76} rx={11} ry={8} fill={SK}/>

        {/* HEAD */}
        <ellipse cx={bx} cy={HY-108} rx={28} ry={30} fill={SK}/>

        {/* Far ear */}
        <ellipse cx={bx-rs*26} cy={HY-106} rx={7} ry={9} fill={SK} stroke={SKD} strokeWidth={1}/>
        <ellipse cx={bx-rs*26} cy={HY-106} rx={3.5} ry={5} fill={SKD} opacity={0.3}/>

        {/* DOPPI HAT */}
        <ellipse cx={bx} cy={HY-134} rx={33} ry={10} fill="#111827"/>
        <path d={`M ${bx-29} ${HY-134} Q ${bx-27} ${HY-167} ${bx} ${HY-172}
          Q ${bx+27} ${HY-167} ${bx+29} ${HY-134} Z`} fill="#1a1a2e"/>
        {[-16,-8,0,8,16].map(ox=>(
          <line key={`v${ox}`} x1={bx+ox} y1={HY-136} x2={bx+ox} y2={HY-163}
            stroke="white" strokeWidth={1.2} opacity={0.28}/>
        ))}
        {[HY-143, HY-154].map((hy,i)=>(
          <line key={`h${i}`} x1={bx-24} y1={hy} x2={bx+24} y2={hy}
            stroke="white" strokeWidth={0.8} opacity={0.2}/>
        ))}
        {[-12,-4,4,12].map(ox=>(
          <polygon key={`d${ox}`}
            points={`${bx+ox},${HY-139} ${bx+ox+4},${HY-145} ${bx+ox},${HY-151} ${bx+ox-4},${HY-145}`}
            fill="white" opacity={0.22}/>
        ))}

        {/* FACE */}
        <ellipse cx={bx-18} cy={HY-101} rx={9} ry={5} fill="#ff7c7c" opacity={0.2}/>
        <ellipse cx={bx+18} cy={HY-101} rx={9} ry={5} fill="#ff7c7c" opacity={0.2}/>

        {/* Eyes */}
        {state==='won' ? (
          <>
            <path d={`M ${bx-18} ${HY-108} Q ${bx-10} ${HY-118} ${bx-2} ${HY-108}`}
              stroke={SKD} strokeWidth={5} fill="#f5d0a0" strokeLinecap="round"/>
            <path d={`M ${bx+2} ${HY-108} Q ${bx+10} ${HY-118} ${bx+18} ${HY-108}`}
              stroke={SKD} strokeWidth={5} fill="#f5d0a0" strokeLinecap="round"/>
          </>
        ) : state==='pulling' ? (
          <>
            <path d={`M ${bx-18} ${HY-107} L ${bx-2} ${HY-111}`}
              stroke={SKD} strokeWidth={5} strokeLinecap="round"/>
            <path d={`M ${bx+2} ${HY-111} L ${bx+18} ${HY-107}`}
              stroke={SKD} strokeWidth={5} strokeLinecap="round"/>
          </>
        ) : (
          <>
            <ellipse cx={bx-10} cy={HY-108} rx={8} ry={9} fill="white"/>
            <ellipse cx={bx+10} cy={HY-108} rx={8} ry={9} fill="white"/>
            <circle  cx={bx-9+rs} cy={HY-107} r={5} fill="#111"/>
            <circle  cx={bx+11+rs} cy={HY-107} r={5} fill="#111"/>
            <circle  cx={bx-7+rs} cy={HY-110} r={2} fill="white"/>
            <circle  cx={bx+13+rs} cy={HY-110} r={2} fill="white"/>
          </>
        )}

        {/* Eyebrows */}
        {state==='pulling' ? (
          <>
            <line x1={bx-18} y1={HY-120} x2={bx-2}  y2={HY-127} stroke="#3d1f00" strokeWidth={3.5} strokeLinecap="round"/>
            <line x1={bx+2}  y1={HY-127} x2={bx+18} y2={HY-120} stroke="#3d1f00" strokeWidth={3.5} strokeLinecap="round"/>
          </>
        ) : state==='lost' ? (
          <>
            <path d={`M ${bx-18} ${HY-122} Q ${bx-10} ${HY-118} ${bx-2} ${HY-122}`} stroke="#3d1f00" strokeWidth={3} fill="none" strokeLinecap="round"/>
            <path d={`M ${bx+2} ${HY-122} Q ${bx+10} ${HY-118} ${bx+18} ${HY-122}`} stroke="#3d1f00" strokeWidth={3} fill="none" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <path d={`M ${bx-18} ${HY-121} Q ${bx-10} ${HY-126} ${bx-2} ${HY-121}`} stroke="#3d1f00" strokeWidth={3} fill="none" strokeLinecap="round"/>
            <path d={`M ${bx+2} ${HY-121} Q ${bx+10} ${HY-126} ${bx+18} ${HY-121}`} stroke="#3d1f00" strokeWidth={3} fill="none" strokeLinecap="round"/>
          </>
        )}

        {/* Nose */}
        <ellipse cx={bx-4} cy={HY-100} rx={3} ry={2} fill={SKD} opacity={0.35}/>
        <ellipse cx={bx+4} cy={HY-100} rx={3} ry={2} fill={SKD} opacity={0.35}/>

        {/* Mouth */}
        {state==='won' ? (
          <path d={`M ${bx-14} ${HY-92} Q ${bx} ${HY-80} ${bx+14} ${HY-92}`}
            stroke="#333" strokeWidth={3} fill="white" strokeLinecap="round"/>
        ) : state==='lost' ? (
          <path d={`M ${bx-11} ${HY-88} Q ${bx} ${HY-95} ${bx+11} ${HY-88}`}
            stroke="#333" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
        ) : state==='pulling' ? (
          <>
            <rect x={bx-13} y={HY-96} width={26} height={12} rx={4} fill="#2a1000"/>
            {[-7,0,7].map(o=>(
              <line key={o} x1={bx+o} y1={HY-96} x2={bx+o} y2={HY-84}
                stroke="white" strokeWidth={2.5}/>
            ))}
          </>
        ) : state==='slipping' ? (
          <ellipse cx={bx} cy={HY-89} rx={11} ry={9} fill="#2a1000"/>
        ) : (
          <path d={`M ${bx-9} ${HY-92} Q ${bx} ${HY-86} ${bx+9} ${HY-92}`}
            stroke="#333" strokeWidth={2.5} fill="none" strokeLinecap="round"/>
        )}

        {/* State effects */}
        {state==='pulling' && (
          <>
            {[-1,0,1].map(i=>(
              <line key={i}
                x1={bx-rs*36+i*6} y1={HY-130+i*4}
                x2={bx-rs*50+i*8} y2={HY-144+i*4}
                stroke="#FBBF24" strokeWidth={3} strokeLinecap="round"/>
            ))}
            <path d={`M ${bx+rs*26} ${HY-118} Q ${bx+rs*30} ${HY-108} ${bx+rs*26} ${HY-102}`}
              fill="#93C5FD" opacity={0.9}/>
          </>
        )}
        {state==='won' && (
          <>
            <ellipse cx={bx-20} cy={HY-97} rx={11} ry={6} fill="#FF6B8A" opacity={0.55}/>
            <ellipse cx={bx+20} cy={HY-97} rx={11} ry={6} fill="#FF6B8A" opacity={0.55}/>
            <text x={bx-12} y={HY-178} fontSize="26">🏆</text>
          </>
        )}
        {state==='lost' && (
          <>
            <path d={`M ${bx-8} ${HY-96} Q ${bx-6} ${HY-80} ${bx-8} ${HY-66}`}
              stroke="#3B82F6" strokeWidth={5} fill="none" strokeLinecap="round"/>
            <path d={`M ${bx+8} ${HY-96} Q ${bx+10} ${HY-80} ${bx+8} ${HY-66}`}
              stroke="#3B82F6" strokeWidth={5} fill="none" strokeLinecap="round"/>
          </>
        )}
        {state==='slipping' && (
          [[-20,-32],[-30,-22],[-14,-20]].map(([dx,dy],i)=>(
            <ellipse key={i} cx={bx+rs*dx} cy={HY+dy} rx={4} ry={6} fill="#93C5FD" opacity={0.8}/>
          ))
        )}

        {/* FRONT ARM */}
        <path d={`M ${bx+rs*18} ${HY-64} C ${bx+rs*38} ${HY-56} ${bx+rs*56} ${HY-46} ${bx+rs*68} ${HY-40}`}
          stroke={SC} strokeWidth={20} fill="none" strokeLinecap="round"/>
        <circle cx={bx+rs*68} cy={HY-40} r={12} fill={SKD}/>
        {[-4,0,4].map(o=>(
          <ellipse key={o} cx={bx+rs*74+o*rs*0.2} cy={HY-34}
            rx={4.5} ry={3} fill={SK} opacity={0.7}/>
        ))}
      </g>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROPE — 3 braided sine-wave strands
// ─────────────────────────────────────────────────────────────────────────────
function TugRope({ rp }: { rp:number }) {
  const sh = -rp * 14;
  const lx = 388 + sh, rx = 612 + sh;
  const ry = 228, sag = 8;
  const mx = (lx+rx)/2, my = ry+sag;

  const strand = (phase:number, amp:number) => {
    const N = 70;
    return Array.from({length:N+1},(_,i)=>{
      const t=i/N;
      const px=(1-t)*(1-t)*lx+2*(1-t)*t*mx+t*t*rx;
      const py=(1-t)*(1-t)*ry+2*(1-t)*t*my+t*t*ry;
      const off=Math.sin(t*Math.PI*16+phase)*amp;
      return `${i===0?'M':'L'} ${px.toFixed(1)},${(py+off).toFixed(1)}`;
    }).join(' ');
  };

  return (
    <g>
      <path d={`M ${lx},${ry+6} Q ${mx},${my+6} ${rx},${ry+6}`}
        stroke="rgba(0,0,0,0.38)" strokeWidth={30} fill="none" strokeLinecap="round"/>
      <path d={`M ${lx},${ry} Q ${mx},${my} ${rx},${ry}`}
        stroke="#1C0800" strokeWidth={26} fill="none" strokeLinecap="round"/>
      <path d={strand(0,           4.5)} stroke="#6B3210" strokeWidth={12} fill="none" strokeLinecap="round"/>
      <path d={strand(Math.PI*2/3, 4.5)} stroke="#9C4D1E" strokeWidth={11} fill="none" strokeLinecap="round"/>
      <path d={strand(Math.PI*4/3, 4.5)} stroke="#C07038" strokeWidth={10} fill="none" strokeLinecap="round"/>
      <path d={strand(Math.PI,    -3.5)} stroke="#D4A05A" strokeWidth={4}  fill="none" opacity={0.6} strokeLinecap="round"/>
      <path d={strand(Math.PI,    -5)}   stroke="white"   strokeWidth={2}  fill="none" opacity={0.14} strokeLinecap="round"/>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────────────────────
const CC=['#f59e0b','#10b981','#3b82f6','#ef4444','#a855f7','#ec4899','#ffffff'];
const CONF=Array.from({length:34},(_,i)=>({
  id:i,x:Math.random()*100,delay:Math.random()*1.4,
  col:CC[i%CC.length],sz:6+Math.random()*8,rot:Math.random()*360,
}));

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function TugOfWar({
  teamLeft,teamRight,wordList,selectedDifficulty,onGameWin,onUpdateScore,
}:TugOfWarProps){
  const [phase,setPhase]   =useState<'difficulty'|'battle'|'ended'>('difficulty');
  const [diff, setDiff]    =useState<'easy'|'medium'|'hard'|'custom'>('medium');
  const [musicOn,setMusicOn]=useState(true);
  const [rop,  setRop]     =useState(0);
  const WIN=12;

  const [words,setWords]=useState<WordPair[]>(MEDIUM);
  const [lW,setLW]=useState(MEDIUM[0]);
  const [lO,setLO]=useState<string[]>([]);
  const [lFrz,setLFrz]=useState(false);
  const [lPl,setLPl]=useState<WordPair[]>([]);
  const [rW,setRW]=useState(MEDIUM[1]);
  const [rO,setRO]=useState<string[]>([]);
  const [rFrz,setRFrz]=useState(false);
  const [rPl,setRPl]=useState<WordPair[]>([]);
  const [lStr,setLStr]=useState(0);
  const [rStr,setRStr]=useState(0);
  const [lPull,setLPull]=useState(false);
  const [rPull,setRPull]=useState(false);
  const [lSlip,setLSlip]=useState(false);
  const [rSlip,setRSlip]=useState(false);
  const [shake,setShake]=useState(false);
  const [showC,setShowC]=useState(false);
  const [lFx,setLFx]=useState<{id:number;text:string}[]>([]);
  const [rFx,setRFx]=useState<{id:number;text:string}[]>([]);

  const ref=useRef<HTMLIFrameElement>(null);
  const yt=useCallback((fn:string,a:unknown[]=[])=>{
    ref.current?.contentWindow?.postMessage(JSON.stringify({event:'command',func:fn,args:a}),'*');
  },[]);

  useEffect(()=>{
    const h=(e:MessageEvent)=>{
      try{
        const d=JSON.parse(typeof e.data==='string'?e.data:'{}');
        if(d.event==='onReady'&&phase==='battle'&&musicOn){yt('unMute');yt('setVolume',[88]);}
      }catch{}
    };
    window.addEventListener('message',h);
    return()=>window.removeEventListener('message',h);
  },[phase,musicOn,yt]);

  useEffect(()=>{
    if(phase==='battle'&&musicOn){
      yt('unMute');yt('setVolume',[88]);yt('playVideo');
      const t1=setTimeout(()=>{yt('unMute');yt('setVolume',[88]);},600);
      const t2=setTimeout(()=>{yt('unMute');yt('setVolume',[88]);},1400);
      return()=>{clearTimeout(t1);clearTimeout(t2);};
    }
    yt('mute');
  },[phase,musicOn,yt]);

  useEffect(()=>{
    if(selectedDifficulty&&selectedDifficulty!=='custom'){
      const d=selectedDifficulty==='beginner'?'easy':selectedDifficulty==='advanced'?'hard':'medium';
      go(d);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedDifficulty]);

  const go=(d:'easy'|'medium'|'hard'|'custom')=>{
    sound.playCorrect();setDiff(d);
    const ws=d==='easy'?EASY:d==='hard'?HARD:d==='custom'&&wordList?.length?wordList:MEDIUM;
    setWords(ws);setPhase('battle');
    gq('l',ws,[...ws].sort(()=>Math.random()-.5));
    gq('r',ws,[...ws].sort(()=>Math.random()-.5));
  };
  const gq=(side:'l'|'r',pool:WordPair[],cur:WordPair[])=>{
    let a=[...cur];if(!a.length)a=[...pool].sort(()=>Math.random()-.5);
    const it=a.pop()!;
    const opts=[it.en,...pool.filter(w=>w.en!==it.en).map(w=>w.en).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
    if(side==='l'){setLPl(a);setLW(it);setLO(opts);}
    else{setRPl(a);setRW(it);setRO(opts);}
  };
  const addFx=(side:'l'|'r',t:string)=>{
    const e={id:Date.now(),text:t};
    if(side==='l'){setLFx(p=>[...p,e]);setTimeout(()=>setLFx(p=>p.slice(1)),1600);}
    else{setRFx(p=>[...p,e]);setTimeout(()=>setRFx(p=>p.slice(1)),1600);}
  };
  const end=(s:'l'|'r')=>{
    setPhase('ended');sound.playWin();setShowC(true);
    onUpdateScore(s==='l'?WIN:0,s==='r'?WIN:0);
    setTimeout(()=>onGameWin(s==='l'?{...teamLeft,score:WIN}:{...teamRight,score:WIN}),5000);
  };
  const ansL=(opt:string)=>{
    if(lFrz||phase!=='battle')return;
    if(opt===lW.en){
      sound.playCorrect();const st=lStr+1;setLStr(st);
      addFx('l',st>=2?`🔥 COMBO x${st}`:"💪 TO'G'RI!");
      setLPull(true);setShake(true);
      setTimeout(()=>setLPull(false),700);setTimeout(()=>setShake(false),300);
      const nx=Math.max(-WIN,rop-(st>=2?1.5:1));setRop(nx);
      if(nx<=-WIN)end('l');else gq('l',words,lPl);
    }else{
      sound.playIncorrect();setLStr(0);addFx('l','😱 XATO!');
      setLFrz(true);setLSlip(true);
      const nx=Math.min(WIN,rop+3);setRop(nx);
      if(nx>=WIN)end('r');
      else setTimeout(()=>{setLFrz(false);setLSlip(false);gq('l',words,lPl);},1500);
    }
  };
  const ansR=(opt:string)=>{
    if(rFrz||phase!=='battle')return;
    if(opt===rW.en){
      sound.playCorrect();const st=rStr+1;setRStr(st);
      addFx('r',st>=2?`🔥 COMBO x${st}`:"💪 TO'G'RI!");
      setRPull(true);setShake(true);
      setTimeout(()=>setRPull(false),700);setTimeout(()=>setShake(false),300);
      const nx=Math.min(WIN,rop+(st>=2?1.5:1));setRop(nx);
      if(nx>=WIN)end('r');else gq('r',words,rPl);
    }else{
      sound.playIncorrect();setRStr(0);addFx('r','😱 XATO!');
      setRFrz(true);setRSlip(true);
      const nx=Math.max(-WIN,rop-3);setRop(nx);
      if(nx<=-WIN)end('l');
      else setTimeout(()=>{setRFrz(false);setRSlip(false);gq('r',words,rPl);},1500);
    }
  };

  const win  =phase==='ended'?(rop<=-WIN?'l':'r'):null;
  const pct  =((rop+WIN)/(WIN*2))*100;
  const sh   =-rop*14;
  const flagX=500+rop*14;

  const lSt:CS=phase==='ended'?(win==='l'?'won':'lost'):lPull?'pulling':lSlip?'slipping':'idle';
  const rSt:CS=phase==='ended'?(win==='r'?'won':'lost'):rPull?'pulling':rSlip?'slipping':'idle';

  const LBX=[120,210,300];
  const RBX=[880,790,700];

  return(
    <div className={`w-full max-w-6xl mx-auto px-2 py-2 select-none transition-transform duration-75 ${shake?'translate-x-0.5':''}`}>

      {/* Music iframe — always mounted */}
      <iframe ref={ref}
        src="https://www.youtube.com/embed/g1YohGdFIXM?autoplay=1&loop=1&playlist=g1YohGdFIXM&controls=0&mute=1&enablejsapi=1"
        allow="autoplay" title="music"
        className="absolute top-0 left-0 w-0 h-0 pointer-events-none opacity-0"/>

      {/* ── DIFFICULTY SCREEN ── */}
      {phase==='difficulty'&&(
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"/>
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 uppercase tracking-widest block">IT SHAHARCHA</span>
            <h2 className="text-2xl font-black text-white uppercase flex items-center justify-center gap-2">
              <Swords className="w-6 h-6 text-rose-500"/> ARQON TORTISH
            </h2>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-900">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"/>🎵 Andijon Polkasi
            </span>
            <button onClick={()=>{sound.playTap();setMusicOn(!musicOn);}}
              className={`py-1.5 px-4 rounded-xl border text-[10px] font-black uppercase cursor-pointer ${musicOn?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':'bg-slate-900 text-slate-400 border-slate-700'}`}>
              {musicOn?<Volume2 className="w-4 h-4 inline"/>:<VolumeX className="w-4 h-4 inline"/>}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {d:'easy',  e:'🌱',l:'Headway Beginner',s:"Oson so'zlar"},
              {d:'medium',e:'⚡',l:'Headway Upper',   s:"O'rta daraja"},
              {d:'hard',  e:'🏆',l:'IELTS Advanced',  s:'Qiyin akademik'},
            ] as const).map(({d,e,l,s})=>(
              <button key={d} onClick={()=>go(d)}
                className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl text-center active:scale-95 transition-all cursor-pointer">
                <div className="text-2xl">{e}</div>
                <h4 className="font-extrabold text-white text-xs uppercase mt-1">{l}</h4>
                <p className="text-[9px] text-zinc-500 mt-0.5">{s}</p>
              </button>
            ))}
          </div>
          {wordList?.length>0&&(
            <button onClick={()=>go('custom')}
              className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl active:scale-95 cursor-pointer flex items-center justify-center gap-2">
              <span className="text-xl">✍️</span>
              <div>
                <h4 className="font-extrabold text-white text-xs uppercase">O'QITUVCHI LUG'ATI</h4>
                <p className="text-[9px] text-indigo-400 mt-0.5">{wordList.length} ta so'z</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── BATTLE / ENDED ── */}
      {(phase==='battle'||phase==='ended')&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{teamLeft.emoji}</span>
              <span style={{color:teamLeft.color}} className="font-black uppercase text-sm">{teamLeft.name}</span>
              {lStr>1&&<span className="bg-cyan-500 text-black px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{lStr}🔥</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setMusicOn(!musicOn)}>
                {musicOn?<Volume2 className="w-4 h-4 text-emerald-400"/>:<VolumeX className="w-4 h-4 text-slate-500"/>}
              </button>
              <span className="text-[9px] text-amber-400 font-black uppercase flex items-center gap-1">
                <Zap className="w-3 h-3"/>
                {diff==='easy'?'BEGINNER':diff==='hard'?'IELTS':diff==='custom'?'MAXSUS':'UPPER'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {rStr>1&&<span className="bg-rose-500 text-black px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{rStr}🔥</span>}
              <span style={{color:teamRight.color}} className="font-black uppercase text-sm">{teamRight.name}</span>
              <span className="text-xl">{teamRight.emoji}</span>
            </div>
          </div>

          {/* ARENA */}
          <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            {showC&&(
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {CONF.map(p=>(
                  <motion.div key={p.id}
                    initial={{y:-20,x:`${p.x}vw`,opacity:1,rotate:p.rot}}
                    animate={{y:'110vh',opacity:[1,1,0],rotate:p.rot+720}}
                    transition={{duration:2.5+Math.random(),delay:p.delay,ease:'easeIn'}}
                    style={{position:'absolute',top:0,width:p.sz,height:p.sz*0.5,borderRadius:2,background:p.col}}/>
                ))}
              </div>
            )}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <AnimatePresence>
                {lFx.map(e=>(
                  <motion.div key={e.id}
                    initial={{opacity:0,y:230,scale:0.8}} animate={{opacity:[0,1,1,0],y:[230,120]}}
                    exit={{opacity:0}} transition={{duration:1.4}}
                    className="absolute left-[12%] text-cyan-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-cyan-500/40 shadow">
                    {e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rFx.map(e=>(
                  <motion.div key={e.id}
                    initial={{opacity:0,y:230,scale:0.8}} animate={{opacity:[0,1,1,0],y:[230,120]}}
                    exit={{opacity:0}} transition={{duration:1.4}}
                    className="absolute right-[12%] text-rose-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-rose-500/40 shadow">
                    {e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <svg viewBox="0 0 1000 340" className="w-full"
              style={{maxHeight:400,background:'linear-gradient(180deg,#050520 0%,#0c1a5e 55%,#1a0a2e 100%)'}}>
              <defs>
                <radialGradient id="spot2" cx="50%" cy="30%" r="55%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.12"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
                <linearGradient id="grass2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a"/><stop offset="100%" stopColor="#14532d"/>
                </linearGradient>
              </defs>

              <rect width="1000" height="340" fill="url(#spot2)"/>

              {[60,130,200,280,360,440,520,600,680,760,840,920].map((sx,i)=>(
                <circle key={i} cx={sx} cy={8+i*5%35} r={i%4===0?2.2:1.1}
                  fill="white" opacity={0.2+i%3*0.15}/>
              ))}

              {Array.from({length:26},(_,i)=>{
                const cx=20+i*37,cy=222-Math.abs(Math.sin(i)*7);
                const c=['#3b82f6','#ef4444','#10b981','#a855f7','#f59e0b'][i%5];
                return <g key={i}>
                  <ellipse cx={cx} cy={cy+22} rx={11} ry={4} fill={c} opacity={0.28}/>
                  <rect x={cx-5} y={cy+2} width={10} height={20} rx={4} fill={c} opacity={0.32}/>
                  <circle cx={cx} cy={cy-9} r={9} fill={c} opacity={0.4}/>
                </g>;
              })}

              <rect x="0" y="308" width="1000" height="32" fill="url(#grass2)"/>
              <rect x="0" y="316" width="1000" height="24" fill="#713f12" opacity={0.55}/>

              <line x1="190" y1="230" x2="190" y2="308" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5,4" opacity={0.4}/>
              <line x1="810" y1="230" x2="810" y2="308" stroke="#f87171" strokeWidth={2} strokeDasharray="5,4" opacity={0.4}/>

              {/* Back characters */}
              {LBX.slice(0,2).map(b=><TugChar key={b} team="left"  bx={b+sh} state={lSt}/>)}
              {RBX.slice(0,2).map(b=><TugChar key={b} team="right" bx={b+sh} state={rSt}/>)}

              {/* Rope (over rear chars, under front chars) */}
              <TugRope rp={rop}/>

              {/* Front characters (on top of rope) */}
              <TugChar team="left"  bx={LBX[2]+sh} state={lSt}/>
              <TugChar team="right" bx={RBX[2]+sh} state={rSt}/>

              {/* Center flag */}
              <line x1={flagX} y1="256" x2={flagX} y2="310" stroke="#FBBF24" strokeWidth={4}/>
              <polygon points={`${flagX},256 ${flagX+30},265 ${flagX},274`}
                fill={rop<-5?'#3b82f6':rop>5?'#ef4444':'#e11d48'} stroke="white" strokeWidth={1.5}/>
              <circle cx={flagX} cy="311" r={7} fill="#FBBF24"/>

              {/* Tension bar */}
              <g transform="translate(500,14)">
                <rect x="-172" y="0" width="344" height="16" rx="8" fill="#0f172a" stroke="#1e293b" strokeWidth={1}/>
                <motion.rect x="-172" y="0" height="16" rx="8"
                  animate={{width:`${pct*3.44}px`}}
                  transition={{type:'spring',stiffness:80,damping:14}}
                  fill={pct<35?'#3b82f6':pct>65?'#ef4444':'#a855f7'} opacity={0.9}/>
                <line x1="0" y1="0" x2="0" y2="16" stroke="white" strokeWidth={2} opacity={0.45}/>
                <text x="-166" y="12" fontSize="8" fill="#93c5fd" fontWeight="bold">{teamLeft.name}</text>
                <text x="166"  y="12" fontSize="8" fill="#fca5a5" fontWeight="bold" textAnchor="end">{teamRight.name}</text>
              </g>
            </svg>
          </div>

          {/* TERMINALS */}
          {phase==='battle'&&(
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className={`p-5 rounded-3xl border-2 transition-all ${lFrz?'bg-rose-950/30 border-rose-500/60':'bg-slate-900/90 border-blue-500/40'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span style={{color:teamLeft.color}} className="text-xs font-black uppercase">{teamLeft.emoji} {teamLeft.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">TERMINAL A</span>
                </div>
                {lFrz?(
                  <div className="h-[188px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce"/>
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">1.5s kutish...</p>
                  </div>
                ):(
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-blue-500/20">
                      <span className="text-blue-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase">{lW.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {lO.map((o,i)=>(
                        <button key={i} onClick={()=>ansL(o)}
                          className="bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500 hover:text-blue-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95">
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={`p-5 rounded-3xl border-2 transition-all ${rFrz?'bg-rose-950/30 border-rose-500/60':'bg-slate-900/90 border-red-500/40'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span style={{color:teamRight.color}} className="text-xs font-black uppercase">{teamRight.emoji} {teamRight.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">TERMINAL B</span>
                </div>
                {rFrz?(
                  <div className="h-[188px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce"/>
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">1.5s kutish...</p>
                  </div>
                ):(
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-red-500/20">
                      <span className="text-red-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase">{rW.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {rO.map((o,i)=>(
                        <button key={i} onClick={()=>ansR(o)}
                          className="bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 hover:text-red-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95">
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {phase==='ended'&&(
            <motion.div
              initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{type:'spring',stiffness:200}}
              className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/50 border-2 border-amber-500/40 py-10 px-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"/>
              <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:1.5}}>
                <Sparkles className="w-14 h-14 text-yellow-400 mx-auto"/>
              </motion.div>
              <div>
                <span className="text-[10px] text-yellow-500 font-extrabold tracking-widest uppercase block">🎊 MUSOBAQA YAKUNLANDI!</span>
                <h3 className="text-3xl font-black text-white uppercase mt-2">
                  {win==='l'?teamLeft.name:teamRight.name}
                </h3>
                <p className="text-xl font-black text-yellow-400 mt-1">G'ALABA QOZONDI! 🏆</p>
              </div>
              <div className="flex justify-center gap-4 text-4xl">
                {(['🥇','🎉','⭐'] as const).map((e,i)=>(
                  <motion.span key={i} animate={{y:[0,-12,0]}} transition={{repeat:Infinity,duration:0.8,delay:i*0.2}}>{e}</motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
