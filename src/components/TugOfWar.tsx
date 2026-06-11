import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameDifficulty, Team, WordPair } from '../types';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Swords, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TugOfWarProps {
  teamLeft: Team;
  teamRight: Team;
  wordList: WordPair[];
  selectedDifficulty?: GameDifficulty;
  onGameWin: (winner: Team) => void;
  onUpdateScore: (leftScore: number, rightScore: number) => void;
}

const EASY_WORDS: WordPair[] = [
  { uz: 'Rivojlantirmoq', en: 'Develop' }, { uz: 'Taqdim etmoq', en: 'Present' },
  { uz: 'Tushunmoq', en: 'Understand' }, { uz: 'Imkoniyat', en: 'Opportunity' },
  { uz: 'Tajriba', en: 'Experience' }, { uz: 'Sayohat qilmoq', en: 'Travel' },
  { uz: 'Harakat qilmoq', en: 'Attempt' }, { uz: 'Zaruriy', en: 'Necessary' },
  { uz: 'Qaror qabul qilmoq', en: 'Decide' }, { uz: 'Yaxshilamoq', en: 'Improve' },
  { uz: 'Muallif', en: 'Author' }, { uz: 'Kashf qilmoq', en: 'Discover' },
  { uz: 'Maslahat bermoq', en: 'Advise' }, { uz: 'Niyat', en: 'Purpose' },
  { uz: 'Erishmoq', en: 'Achieve' }, { uz: 'Tavsiya qilmoq', en: 'Recommend' },
  { uz: "G'alaba", en: 'Victory' }, { uz: 'Tasvirlamoq', en: 'Describe' },
  { uz: 'Solishtirmoq', en: 'Compare' }, { uz: "Ta'sir qilmoq", en: 'Influence' },
];
const MEDIUM_WORDS: WordPair[] = [
  { uz: 'Tergov qilmoq', en: 'Investigate' }, { uz: 'Cheklamoq', en: 'Restrict' },
  { uz: 'Tashvishlanish', en: 'Anxiety' }, { uz: 'Isbotlamoq', en: 'Verify' },
  { uz: 'Samarali', en: 'Efficient' }, { uz: 'Ilhomlantirmoq', en: 'Inspire' },
  { uz: 'Moslashmoq', en: 'Adapt' }, { uz: 'Ziddiyat', en: 'Conflict' },
  { uz: 'Raqobatlashmoq', en: 'Compete' }, { uz: 'Kafolatlamoq', en: 'Guarantee' },
  { uz: 'Foyda keltiradigan', en: 'Beneficial' }, { uz: 'Faraz qilmoq', en: 'Assume' },
  { uz: 'Xabardorlik', en: 'Awareness' }, { uz: "Hissa qo'shmoq", en: 'Contribute' },
  { uz: 'Baholash', en: 'Assessment' }, { uz: 'Hamkorlik qilmoq', en: 'Collaborate' },
  { uz: 'Izchil', en: 'Consistent' }, { uz: 'Kengaytirish', en: 'Expand' },
  { uz: 'Tahlil qilmoq', en: 'Analyze' }, { uz: 'Tasdiqlamoq', en: 'Confirm' },
];
const HARD_WORDS: WordPair[] = [
  { uz: 'Hamma joyda mavjud', en: 'Ubiquitous' }, { uz: 'Fikrlash tarzi', en: 'Paradigm' },
  { uz: 'Xulosa chiqarmoq', en: 'Extrapolate' }, { uz: 'Yarashtirish', en: 'Reconcile' },
  { uz: "Yonma-yon qo'yish", en: 'Juxtapose' }, { uz: 'Vazminlik', en: 'Equanimity' },
  { uz: 'Murakkab jumboq', en: 'Conundrum' }, { uz: 'Maqtovga loyiq', en: 'Meritorious' },
  { uz: "Dalillar bilan isbotlamoq", en: 'Substantiate' }, { uz: "O'tkinchi", en: 'Ephemeral' },
  { uz: 'Pinhona', en: 'Surreptitious' }, { uz: 'Zerikarli', en: 'Monotonous' },
  { uz: 'Chuqur bilim', en: 'Erudition' }, { uz: "Eng yuqori cho'qqi", en: 'Zenith' },
  { uz: 'Mavhum', en: 'Obscure' }, { uz: 'Chechanlik', en: 'Eloquence' },
  { uz: 'Chidamli', en: 'Resilient' }, { uz: "Inkor etib bo'lmaydigan", en: 'Irrefutable' },
  { uz: 'Amaliy', en: 'Pragmatic' }, { uz: "G'ayratli", en: 'Assiduous' },
];

type Difficulty = 'easy' | 'medium' | 'hard' | 'custom';
type CharState = 'idle' | 'pulling' | 'slipping' | 'won' | 'lost';

const CONFETTI_COLS = ['#f59e0b','#10b981','#3b82f6','#ef4444','#a855f7','#ec4899','#fff'];
const confettiItems = Array.from({ length: 28 }, (_, i) => ({
  id: i, x: Math.random() * 100, delay: Math.random() * 1.2,
  col: CONFETTI_COLS[i % CONFETTI_COLS.length], sz: 6 + Math.random() * 8, rot: Math.random() * 360,
}));

// ─────────────────────────────────────────────────────────────
// CHARACTER
// ─────────────────────────────────────────────────────────────
function TugChar({ team, baseX, state }: { team: 'left'|'right'; baseX: number; state: CharState }) {
  const L  = team === 'left';
  const rs = L ? 1 : -1;

  const shirt  = L ? '#1d4ed8' : '#b91c1c';
  const shirtH = L ? '#60a5fa' : '#f87171';
  const shirtD = L ? '#1e3a8a' : '#7f1d1d';
  const pants  = L ? '#1e3a5f' : '#4c0519';
  const pantsD = L ? '#0f1f38' : '#2d0210';
  const skin   = '#F5C48A';
  const skinD  = '#C8853A';
  const hair   = '#1A0800';
  const shoe   = '#1a1a1a';
  const shoeH  = '#3d3d3d';

  let lean = L ? -6 : 6;
  let oy   = 0;
  if (state === 'pulling')  { lean = L ? -22 : 22; oy = 8;  }
  if (state === 'slipping') { lean = L ? 30 : -30; oy = -4; }
  if (state === 'won')      { lean = 0; oy = -16; }
  if (state === 'lost')     { lean = L ? 18 : -18; oy = 12; }

  const GY   = 310;
  const hx   = baseX + lean * 0.65;
  const hy   = GY - 215 + oy;
  const shY  = hy + 38;
  const waY  = shY + 56;
  const hipY = waY + 18;
  const knY  = hipY + 44;

  const sp  = state === 'won' ? 16 : state === 'pulling' ? 10 : 0;
  const fLx = baseX - 22 - sp * 0.4;
  const fRx = baseX + 22 + sp * 0.4;

  // Arm positions
  let peX: number, peY: number, phX: number, phY: number;
  let beX: number, beY: number, bhX: number, bhY: number;

  if (state === 'won') {
    peX = hx+46; peY = shY-20; phX = hx+54; phY = shY-44;
    beX = hx-46; beY = shY-20; bhX = hx-54; bhY = shY-44;
  } else if (state === 'lost') {
    peX = hx+rs*24; peY = shY+42; phX = hx+rs*20; phY = shY+70;
    beX = hx-rs*18; beY = shY+38; bhX = hx-rs*16; bhY = shY+66;
  } else if (state === 'pulling') {
    peX = hx+rs*54; peY = shY+20; phX = hx+rs*88; phY = shY+14;
    beX = hx-rs*28; beY = shY+28; bhX = hx-rs*40; bhY = shY+50;
  } else if (state === 'slipping') {
    peX = hx+rs*38; peY = shY+2;  phX = hx+rs*62; phY = shY-16;
    beX = hx-rs*38; beY = shY+2;  bhX = hx-rs*60; bhY = shY-12;
  } else {
    peX = hx+rs*46; peY = shY+22; phX = hx+rs*74; phY = shY+16;
    beX = hx-rs*24; beY = shY+25; bhX = hx-rs*36; bhY = shY+46;
  }

  // Face coords
  const eLx = hx-12, eRx = hx+12, eY = hy+3;

  // ── Eyes ──
  let eyes: React.ReactNode;
  if (state === 'won') {
    eyes = <>
      <path d={`M ${eLx-9} ${eY+3} Q ${eLx} ${eY-8} ${eLx+9} ${eY+3}`} stroke={hair} strokeWidth="3" fill={skin} strokeLinecap="round"/>
      <path d={`M ${eRx-9} ${eY+3} Q ${eRx} ${eY-8} ${eRx+9} ${eY+3}`} stroke={hair} strokeWidth="3" fill={skin} strokeLinecap="round"/>
    </>;
  } else if (state === 'lost') {
    eyes = <>
      <ellipse cx={eLx} cy={eY+1} rx="9" ry="10" fill="white" stroke="#D0B090" strokeWidth="1"/>
      <circle cx={eLx} cy={eY+3} r="6" fill="#5D3A1A"/>
      <circle cx={eLx} cy={eY+3} r="3.5" fill="#0A0A0A"/>
      <circle cx={eLx+2} cy={eY+1} r="1.8" fill="white"/>
      <ellipse cx={eRx} cy={eY+1} rx="9" ry="10" fill="white" stroke="#D0B090" strokeWidth="1"/>
      <circle cx={eRx} cy={eY+3} r="6" fill="#5D3A1A"/>
      <circle cx={eRx} cy={eY+3} r="3.5" fill="#0A0A0A"/>
      <circle cx={eRx+2} cy={eY+1} r="1.8" fill="white"/>
      <path d={`M ${eLx+2} ${eY+11} Q ${eLx} ${eY+23} ${eLx+4} ${eY+33}`} stroke="#93C5FD" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d={`M ${eRx-2} ${eY+11} Q ${eRx} ${eY+23} ${eRx-4} ${eY+33}`} stroke="#93C5FD" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    </>;
  } else if (state === 'pulling') {
    eyes = <>
      <path d={`M ${eLx-9} ${eY+4} L ${eLx+9} ${eY+4}`} stroke={hair} strokeWidth="4.5" strokeLinecap="round"/>
      <path d={`M ${eRx-9} ${eY+4} L ${eRx+9} ${eY+4}`} stroke={hair} strokeWidth="4.5" strokeLinecap="round"/>
    </>;
  } else if (state === 'slipping') {
    eyes = <>
      <circle cx={eLx} cy={eY} r="12" fill="white" stroke={hair} strokeWidth="1.5"/>
      <circle cx={eLx} cy={eY} r="7" fill="#5D3A1A"/>
      <circle cx={eLx} cy={eY} r="4" fill="#0A0A0A"/>
      <circle cx={eLx+2.5} cy={eY-2} r="2" fill="white"/>
      <circle cx={eRx} cy={eY} r="12" fill="white" stroke={hair} strokeWidth="1.5"/>
      <circle cx={eRx} cy={eY} r="7" fill="#5D3A1A"/>
      <circle cx={eRx} cy={eY} r="4" fill="#0A0A0A"/>
      <circle cx={eRx+2.5} cy={eY-2} r="2" fill="white"/>
    </>;
  } else {
    eyes = <>
      <ellipse cx={eLx} cy={eY} rx="9" ry="11" fill="white" stroke="#D0B090" strokeWidth="1"/>
      <circle cx={eLx+rs*0.5} cy={eY+1} r="6" fill="#5D3A1A"/>
      <circle cx={eLx+rs*0.5} cy={eY+1} r="3.5" fill="#0A0A0A"/>
      <circle cx={eLx+rs*0.5+2} cy={eY-1} r="1.8" fill="white"/>
      <ellipse cx={eRx} cy={eY} rx="9" ry="11" fill="white" stroke="#D0B090" strokeWidth="1"/>
      <circle cx={eRx+rs*0.5} cy={eY+1} r="6" fill="#5D3A1A"/>
      <circle cx={eRx+rs*0.5} cy={eY+1} r="3.5" fill="#0A0A0A"/>
      <circle cx={eRx+rs*0.5+2} cy={eY-1} r="1.8" fill="white"/>
    </>;
  }

  // ── Brows ──
  let brows: React.ReactNode;
  if (state === 'won') {
    brows = <>
      <path d={`M ${eLx-10} ${eY-16} Q ${eLx} ${eY-22} ${eLx+10} ${eY-16}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M ${eRx-10} ${eY-16} Q ${eRx} ${eY-22} ${eRx+10} ${eY-16}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
    </>;
  } else if (state === 'lost') {
    brows = <>
      <path d={`M ${eLx-8} ${eY-13} Q ${eLx} ${eY-8} ${eLx+8} ${eY-13}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M ${eRx-8} ${eY-13} Q ${eRx} ${eY-8} ${eRx+8} ${eY-13}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
    </>;
  } else if (state === 'pulling') {
    brows = <>
      <line x1={eLx-9} y1={eY-10} x2={eLx+9} y2={eY-15} stroke={hair} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={eRx-9} y1={eY-15} x2={eRx+9} y2={eY-10} stroke={hair} strokeWidth="4.5" strokeLinecap="round"/>
    </>;
  } else if (state === 'slipping') {
    brows = <>
      <path d={`M ${eLx-10} ${eY-18} Q ${eLx} ${eY-24} ${eLx+10} ${eY-18}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M ${eRx-10} ${eY-18} Q ${eRx} ${eY-24} ${eRx+10} ${eY-18}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
    </>;
  } else {
    brows = <>
      <path d={`M ${eLx-9} ${eY-12} Q ${eLx} ${eY-16} ${eLx+9} ${eY-13}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M ${eRx-9} ${eY-13} Q ${eRx} ${eY-16} ${eRx+9} ${eY-12}`} stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round"/>
    </>;
  }

  // ── Mouth ──
  let mouth: React.ReactNode;
  if (state === 'won') {
    mouth = <>
      <path d={`M ${hx-14} ${hy+20} Q ${hx} ${hy+33} ${hx+14} ${hy+20}`} stroke={hair} strokeWidth="2.5" fill="white" strokeLinecap="round"/>
      <path d={`M ${hx-8} ${hy+20} Q ${hx} ${hy+28} ${hx+8} ${hy+20}`} fill="#FF7070" opacity="0.4"/>
    </>;
  } else if (state === 'lost') {
    mouth = <path d={`M ${hx-12} ${hy+26} Q ${hx} ${hy+18} ${hx+12} ${hy+26}`} stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
  } else if (state === 'pulling') {
    mouth = <>
      <rect x={hx-12} y={hy+16} width="24" height="11" rx="3" fill={hair}/>
      {([-8,-3,2,7] as const).map(ox => <line key={ox} x1={hx+ox} y1={hy+16} x2={hx+ox} y2={hy+27} stroke="white" strokeWidth="1.8"/>)}
    </>;
  } else if (state === 'slipping') {
    mouth = <>
      <ellipse cx={hx} cy={hy+22} rx="11" ry="12" fill={hair}/>
      <ellipse cx={hx} cy={hy+20} rx="7" ry="7" fill="#8B0000" opacity="0.7"/>
    </>;
  } else {
    mouth = <path d={`M ${hx-8} ${hy+20} Q ${hx} ${hy+25} ${hx+8} ${hy+20}`} stroke={hair} strokeWidth="2.5" fill="none" strokeLinecap="round"/>;
  }

  // ── Extras ──
  let extras: React.ReactNode = null;
  if (state === 'won') {
    extras = <>
      <ellipse cx={hx-21} cy={hy+14} rx="9" ry="5" fill="#FF6B8A" opacity="0.55"/>
      <ellipse cx={hx+21} cy={hy+14} rx="9" ry="5" fill="#FF6B8A" opacity="0.55"/>
    </>;
  } else if (state === 'pulling') {
    extras = <>
      <ellipse cx={hx+rs*36} cy={hy-10} rx="4" ry="6.5" fill="#7DD3FC" opacity="0.85"/>
      <ellipse cx={hx+rs*26} cy={hy}    rx="3" ry="5"   fill="#7DD3FC" opacity="0.65"/>
      <line x1={hx-rs*38} y1={hy-28} x2={hx-rs*48} y2={hy-35} stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
      <line x1={hx-rs*36} y1={hy-14} x2={hx-rs*48} y2={hy-14} stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
    </>;
  } else if (state === 'slipping') {
    extras = <>
      <ellipse cx={hx+rs*42} cy={hy-8}  rx="4.5" ry="7"   fill="#7DD3FC" opacity="0.9"/>
      <ellipse cx={hx+rs*30} cy={hy-18} rx="3.5" ry="5.5" fill="#7DD3FC" opacity="0.7"/>
    </>;
  } else {
    extras = <>
      <ellipse cx={hx-20} cy={hy+14} rx="8" ry="4.5" fill="#FFAAAA" opacity="0.38"/>
      <ellipse cx={hx+20} cy={hy+14} rx="8" ry="4.5" fill="#FFAAAA" opacity="0.38"/>
    </>;
  }

  const AW = 16, FW = 13;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={baseX} cy={GY+8} rx="30" ry="7" fill="rgba(0,0,0,0.22)"/>

      {/* Legs */}
      {state === 'won' ? (
        <>
          <line x1={baseX-5} y1={hipY} x2={fLx-18} y2={GY-18} stroke={pants} strokeWidth="18" strokeLinecap="round"/>
          <line x1={baseX+5} y1={hipY} x2={fRx+18} y2={GY-12} stroke={pants} strokeWidth="18" strokeLinecap="round"/>
          <ellipse cx={fLx-18} cy={GY-12} rx="18" ry="7" fill={shoe}/>
          <ellipse cx={fLx-10} cy={GY-15} rx="9"  ry="4" fill={shoeH}/>
          <ellipse cx={fRx+18} cy={GY-6}  rx="18" ry="7" fill={shoe}/>
          <ellipse cx={fRx+26} cy={GY-9}  rx="9"  ry="4" fill={shoeH}/>
        </>
      ) : (
        <>
          <line x1={baseX-5} y1={hipY} x2={fLx-2} y2={knY} stroke={pants}  strokeWidth="18" strokeLinecap="round"/>
          <line x1={baseX+5} y1={hipY} x2={fRx+2} y2={knY} stroke={pants}  strokeWidth="18" strokeLinecap="round"/>
          <line x1={fLx-2}   y1={knY}  x2={fLx}   y2={GY}  stroke={pantsD} strokeWidth="15" strokeLinecap="round"/>
          <line x1={fRx+2}   y1={knY}  x2={fRx}   y2={GY}  stroke={pantsD} strokeWidth="15" strokeLinecap="round"/>
          <ellipse cx={fLx} cy={GY+5} rx="18" ry="7" fill={shoe}/>
          <ellipse cx={fLx+(L?4:-4)} cy={GY+2} rx="9" ry="4" fill={shoeH}/>
          <ellipse cx={fRx} cy={GY+5} rx="18" ry="7" fill={shoe}/>
          <ellipse cx={fRx+(L?4:-4)} cy={GY+2} rx="9" ry="4" fill={shoeH}/>
        </>
      )}

      {/* Back arm */}
      {state !== 'won' && <>
        <line x1={hx-rs*22} y1={shY+10} x2={beX} y2={beY} stroke={shirtD} strokeWidth={AW} strokeLinecap="round"/>
        <line x1={beX} y1={beY} x2={bhX} y2={bhY} stroke={shirtD} strokeWidth={FW} strokeLinecap="round"/>
        <circle cx={bhX} cy={bhY} r="10" fill={skin} stroke={skinD} strokeWidth="1"/>
      </>}

      {/* Shirt body */}
      <path d={`M ${hx-26} ${shY} C ${hx-30} ${shY+12} ${baseX-22} ${waY-8} ${baseX-18} ${waY}
               L ${baseX+18} ${waY} C ${baseX+22} ${waY-8} ${hx+30} ${shY+12} ${hx+26} ${shY}
               C ${hx+18} ${shY-6} ${hx-18} ${shY-6} ${hx-26} ${shY} Z`} fill={shirt}/>
      <path d={`M ${hx-22} ${shY+5} C ${hx-26} ${shY+20} ${hx-20} ${shY+44} ${hx-12} ${shY+50}`}
        stroke={shirtH} strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round"/>
      <path d={`M ${hx-11} ${shY} L ${hx} ${shY+15} L ${hx+11} ${shY}`} fill={shirtD} opacity="0.65"/>

      {/* Hip */}
      <rect x={baseX-18} y={waY} width="36" height="20" rx="5" fill={pants}/>

      {/* Belt */}
      <rect x={baseX-20} y={waY-6} width="40" height="10" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1"/>
      <rect x={baseX-5}  y={waY-6} width="10" height="10" rx="2" fill="#CA8A04"/>
      <rect x={baseX-3}  y={waY-4} width="6"  height="6"  rx="1" fill="#FBBF24"/>

      {/* Neck */}
      <rect x={hx-9} y={hy+28} width="18" height="18" rx="7" fill={skin} stroke={skinD} strokeWidth="0.8"/>

      {/* Ears */}
      <ellipse cx={hx-28} cy={hy+4} rx="6" ry="9" fill={skin} stroke={skinD} strokeWidth="1"/>
      <ellipse cx={hx-28} cy={hy+4} rx="3.5" ry="5.5" fill={skinD} opacity="0.28"/>
      <ellipse cx={hx+28} cy={hy+4} rx="6" ry="9" fill={skin} stroke={skinD} strokeWidth="1"/>
      <ellipse cx={hx+28} cy={hy+4} rx="3.5" ry="5.5" fill={skinD} opacity="0.28"/>

      {/* Head */}
      <ellipse cx={hx} cy={hy} rx="29" ry="33" fill={skin} stroke={skinD} strokeWidth="1.2"/>
      <ellipse cx={hx-16} cy={hy+10} rx="10" ry="7" fill={skinD} opacity="0.1"/>
      <ellipse cx={hx+16} cy={hy+10} rx="10" ry="7" fill={skinD} opacity="0.1"/>

      {/* Hair */}
      <path d={`M ${hx-27} ${hy-13} C ${hx-30} ${hy-48} ${hx+30} ${hy-48} ${hx+27} ${hy-13}`} fill={hair}/>
      <path d={`M ${hx-27} ${hy-13} C ${hx-36} ${hy-3} ${hx-35} ${hy+16} ${hx-30} ${hy+20}`} fill={hair}/>
      <path d={`M ${hx+27} ${hy-13} C ${hx+36} ${hy-3} ${hx+35} ${hy+16} ${hx+30} ${hy+20}`} fill={hair}/>
      <path d={`M ${hx-14} ${hy-38} C ${hx-7} ${hy-44} ${hx+7} ${hy-44} ${hx+14} ${hy-38}`}
        stroke="white" strokeWidth="2.5" fill="none" opacity="0.18" strokeLinecap="round"/>

      {/* Face features */}
      {brows}
      {eyes}
      <ellipse cx={hx-3.5} cy={hy+12} rx="2.8" ry="2.2" fill={skinD} opacity="0.3"/>
      <ellipse cx={hx+3.5} cy={hy+12} rx="2.8" ry="2.2" fill={skinD} opacity="0.3"/>
      {mouth}
      {extras}

      {/* Front arm */}
      {state === 'won' ? (
        <>
          <line x1={hx-22} y1={shY+10} x2={beX} y2={beY} stroke={shirt} strokeWidth={AW} strokeLinecap="round"/>
          <line x1={beX} y1={beY} x2={bhX} y2={bhY} stroke={shirt} strokeWidth={FW} strokeLinecap="round"/>
          <circle cx={bhX} cy={bhY} r="10" fill={skin} stroke={skinD} strokeWidth="1"/>
          <line x1={hx+22} y1={shY+10} x2={peX} y2={peY} stroke={shirt} strokeWidth={AW} strokeLinecap="round"/>
          <line x1={peX} y1={peY} x2={phX} y2={phY} stroke={shirt} strokeWidth={FW} strokeLinecap="round"/>
          <circle cx={phX} cy={phY} r="10" fill={skin} stroke={skinD} strokeWidth="1"/>
        </>
      ) : (
        <>
          <line x1={hx+rs*22} y1={shY+10} x2={peX} y2={peY} stroke={shirt} strokeWidth={AW} strokeLinecap="round"/>
          <line x1={peX} y1={peY} x2={phX} y2={phY} stroke={shirt} strokeWidth={FW} strokeLinecap="round"/>
          <circle cx={phX} cy={phY} r="10" fill={skin} stroke={skinD} strokeWidth="1"/>
          {(state === 'idle' || state === 'pulling') && ([-3,0,3] as const).map(fi => (
            <ellipse key={fi} cx={phX+rs*fi} cy={phY+10} rx="4.5" ry="3" fill={skinD}/>
          ))}
        </>
      )}

      {/* Win trophy */}
      {state === 'won' && (
        <text x={hx-14} y={hy-50} fontSize="28">🏆</text>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// ROPE — layered paths, NO ellipse knots
// ─────────────────────────────────────────────────────────────
function TugRope({ ropePosition, lPull, rPull }: { ropePosition: number; lPull: boolean; rPull: boolean }) {
  const sh   = -ropePosition * 12;
  const lx   = 295 + sh, rx = 705 + sh, mx = (lx + rx) / 2;
  const ry   = 282;
  const sag  = lPull || rPull ? 4 : 11;
  const my   = ry + sag;
  const p    = `M ${lx},${ry} Q ${mx},${my} ${rx},${ry}`;
  const ph   = `M ${lx},${ry-6} Q ${mx},${my-6} ${rx},${ry-6}`;
  const psh  = `M ${lx},${ry-8} Q ${mx},${my-8} ${rx},${ry-8}`;
  return (
    <g>
      <path d={p}  stroke="rgba(0,0,0,0.4)"  strokeWidth="30" fill="none" strokeLinecap="round"/>
      <path d={p}  stroke="#3B1A06"           strokeWidth="26" fill="none" strokeLinecap="round"/>
      <path d={p}  stroke="#7C3D12"           strokeWidth="20" fill="none" strokeLinecap="round"/>
      <path d={p}  stroke="#A5601E"           strokeWidth="14" fill="none" strokeLinecap="round"/>
      {/* Braid dash A */}
      <path d={p}  stroke="#4A2008" strokeWidth="18" fill="none" strokeDasharray="22,22" strokeDashoffset="0"  strokeLinecap="butt" opacity="0.55"/>
      {/* Braid dash B (offset = half period, opposite colour) */}
      <path d={p}  stroke="#D4913C" strokeWidth="18" fill="none" strokeDasharray="22,22" strokeDashoffset="22" strokeLinecap="butt" opacity="0.28"/>
      {/* Highlight ridge */}
      <path d={ph} stroke="#E8A84C" strokeWidth="5"  fill="none" opacity="0.55" strokeLinecap="round"/>
      <path d={psh} stroke="white"   strokeWidth="2"  fill="none" opacity="0.18" strokeLinecap="round"/>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TugOfWar({ teamLeft, teamRight, wordList, selectedDifficulty, onGameWin, onUpdateScore }: TugOfWarProps) {
  const [phase,        setPhase]        = useState<'difficulty'|'battle'|'ended'>('difficulty');
  const [difficulty,   setDifficulty]   = useState<Difficulty>('medium');
  const [musicOn,      setMusicOn]      = useState(true);
  const [ropePos,      setRopePos]      = useState(0);
  const WIN = 12;

  const [words,      setWords]      = useState<WordPair[]>(MEDIUM_WORDS);
  const [lWord,      setLWord]      = useState(MEDIUM_WORDS[0]);
  const [lOpts,      setLOpts]      = useState<string[]>([]);
  const [lFrozen,    setLFrozen]    = useState(false);
  const [lPool,      setLPool]      = useState<WordPair[]>([]);
  const [rWord,      setRWord]      = useState(MEDIUM_WORDS[1]);
  const [rOpts,      setROpts]      = useState<string[]>([]);
  const [rFrozen,    setRFrozen]    = useState(false);
  const [rPool,      setRPool]      = useState<WordPair[]>([]);
  const [lStreak,    setLStreak]    = useState(0);
  const [rStreak,    setRStreak]    = useState(0);
  const [lPull,      setLPull]      = useState(false);
  const [rPull,      setRPull]      = useState(false);
  const [lSlip,      setLSlip]      = useState(false);
  const [rSlip,      setRSlip]      = useState(false);
  const [shake,      setShake]      = useState(false);
  const [confetti,   setConfetti]   = useState(false);
  const [lFx, setLFx] = useState<{id:number;text:string}[]>([]);
  const [rFx, setRFx] = useState<{id:number;text:string}[]>([]);

  const musicRef = useRef<HTMLIFrameElement>(null);

  const yt = useCallback((fn: string, args: unknown[] = []) => {
    musicRef.current?.contentWindow?.postMessage(JSON.stringify({ event:'command', func:fn, args }), '*');
  }, []);

  // YouTube ready listener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const d = JSON.parse(typeof e.data === 'string' ? e.data : '{}');
        if (d.event === 'onReady' && phase === 'battle' && musicOn) {
          yt('unMute'); yt('setVolume', [88]);
        }
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [phase, musicOn, yt]);

  // Start/stop music with phase
  useEffect(() => {
    if (phase === 'battle' && musicOn) {
      yt('unMute'); yt('setVolume', [88]); yt('playVideo');
      const t1 = setTimeout(() => { yt('unMute'); yt('setVolume', [88]); }, 500);
      const t2 = setTimeout(() => { yt('unMute'); yt('setVolume', [88]); }, 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    yt('mute');
  }, [phase, musicOn, yt]);

  // Auto-start from parent
  useEffect(() => {
    if (selectedDifficulty && selectedDifficulty !== 'custom') {
      const d: Difficulty = selectedDifficulty === 'beginner' ? 'easy' : selectedDifficulty === 'advanced' ? 'hard' : 'medium';
      startBattle(d);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty]);

  const startBattle = (d: Difficulty) => {
    sound.playCorrect(); setDifficulty(d);
    const ws = d === 'easy' ? EASY_WORDS : d === 'hard' ? HARD_WORDS
             : d === 'custom' && wordList?.length ? wordList : MEDIUM_WORDS;
    setWords(ws); setPhase('battle');
    genQ('left',  ws, [...ws].sort(() => Math.random()-.5));
    genQ('right', ws, [...ws].sort(() => Math.random()-.5));
  };

  const genQ = (side: 'left'|'right', pool: WordPair[], cur: WordPair[]) => {
    let arr = [...cur];
    if (!arr.length) arr = [...pool].sort(() => Math.random()-.5);
    const item = arr.pop()!;
    const dist = pool.filter(w => w.en !== item.en).map(w => w.en).sort(() => Math.random()-.5).slice(0,3);
    const opts = [item.en, ...dist].sort(() => Math.random()-.5);
    if (side === 'left')  { setLPool(arr); setLWord(item); setLOpts(opts); }
    else                  { setRPool(arr); setRWord(item); setROpts(opts); }
  };

  const addFx = (side: 'left'|'right', text: string) => {
    const e = { id: Date.now(), text };
    if (side === 'left') { setLFx(p=>[...p,e]); setTimeout(() => setLFx(p=>p.slice(1)), 1600); }
    else                 { setRFx(p=>[...p,e]); setTimeout(() => setRFx(p=>p.slice(1)), 1600); }
  };

  const endGame = (side: 'left'|'right') => {
    setPhase('ended'); sound.playWin(); setConfetti(true);
    onUpdateScore(side==='left'?WIN:0, side==='right'?WIN:0);
    setTimeout(() => onGameWin(side==='left' ? {...teamLeft,score:WIN} : {...teamRight,score:WIN}), 5000);
  };

  const answerLeft = (opt: string) => {
    if (lFrozen || phase !== 'battle') return;
    if (opt === lWord.en) {
      sound.playCorrect();
      const st = lStreak+1; setLStreak(st);
      addFx('left', st>=2 ? `🔥 COMBO x${st}` : "💪 TO'G'RI!");
      setLPull(true); setShake(true);
      setTimeout(() => setLPull(false), 650);
      setTimeout(() => setShake(false), 300);
      const next = Math.max(-WIN, ropePos - (st>=2?1.5:1));
      setRopePos(next);
      if (next <= -WIN) endGame('left');
      else genQ('left', words, lPool);
    } else {
      sound.playIncorrect(); setLStreak(0);
      addFx('left', '😱 XATO!');
      setLFrozen(true); setLSlip(true);
      const next = Math.min(WIN, ropePos+3);
      setRopePos(next);
      if (next >= WIN) endGame('right');
      else setTimeout(() => { setLFrozen(false); setLSlip(false); genQ('left',words,lPool); }, 1500);
    }
  };

  const answerRight = (opt: string) => {
    if (rFrozen || phase !== 'battle') return;
    if (opt === rWord.en) {
      sound.playCorrect();
      const st = rStreak+1; setRStreak(st);
      addFx('right', st>=2 ? `🔥 COMBO x${st}` : "💪 TO'G'RI!");
      setRPull(true); setShake(true);
      setTimeout(() => setRPull(false), 650);
      setTimeout(() => setShake(false), 300);
      const next = Math.min(WIN, ropePos + (st>=2?1.5:1));
      setRopePos(next);
      if (next >= WIN) endGame('right');
      else genQ('right', words, rPool);
    } else {
      sound.playIncorrect(); setRStreak(0);
      addFx('right', '😱 XATO!');
      setRFrozen(true); setRSlip(true);
      const next = Math.max(-WIN, ropePos-3);
      setRopePos(next);
      if (next <= -WIN) endGame('left');
      else setTimeout(() => { setRFrozen(false); setRSlip(false); genQ('right',words,rPool); }, 1500);
    }
  };

  const winner = phase === 'ended' ? (ropePos <= -WIN ? 'left' : 'right') : null;
  const pct    = ((ropePos + WIN) / (WIN * 2)) * 100;
  const sh     = -ropePos * 12;

  const lState: CharState = phase === 'ended' ? (winner==='left'?'won':'lost')
    : lPull ? 'pulling' : lSlip ? 'slipping' : 'idle';
  const rState: CharState = phase === 'ended' ? (winner==='right'?'won':'lost')
    : rPull ? 'pulling' : rSlip ? 'slipping' : 'idle';

  const flagX = 500 + ropePos * 14;

  return (
    <div className={`w-full max-w-6xl mx-auto px-2 py-2 select-none transition-transform duration-75 ${shake?'translate-x-0.5':''}`}>

      {/* ── MUSIC (always mounted so it pre-buffers) ── */}
      <iframe
        ref={musicRef}
        src="https://www.youtube.com/embed/g1YohGdFIXM?autoplay=1&loop=1&playlist=g1YohGdFIXM&controls=0&mute=1&enablejsapi=1"
        allow="autoplay"
        title="Andijon Polkasi"
        className="absolute top-0 left-0 w-0 h-0 pointer-events-none opacity-0"
      />

      {/* ── DIFFICULTY SCREEN ── */}
      {phase === 'difficulty' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl mt-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500"/>
          <div className="text-center space-y-1">
            <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 uppercase tracking-widest block">IT SHAHARCHA</span>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase flex items-center justify-center gap-2">
              <Swords className="w-6 h-6 text-rose-500"/> ARQON TORTISH
            </h2>
            <p className="text-slate-400 text-xs">To'g'ri javob = arqon tortish! Xato = 3 qadam orqaga!</p>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-900">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"/>🎵 Andijon Polkasi
            </span>
            <button onClick={() => { sound.playTap(); setMusicOn(!musicOn); }}
              className={`py-1.5 px-4 rounded-xl border text-[10px] font-black uppercase cursor-pointer transition-all ${musicOn?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':'bg-slate-900 text-slate-400 border-slate-700'}`}>
              {musicOn ? <Volume2 className="w-4 h-4 inline"/> : <VolumeX className="w-4 h-4 inline"/>}
            </button>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] uppercase font-black text-slate-500 text-center tracking-wider">DARAJANI TANLANG:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { d:'easy',   e:'🌱', l:'Headway Beginner', s:'Oson so\'zlar'  } as const,
                { d:'medium', e:'⚡', l:'Headway Upper',    s:'O\'rta daraja'   } as const,
                { d:'hard',   e:'🏆', l:'IELTS Advanced',   s:'Qiyin akademik' } as const,
              ].map(({ d, e, l, s }) => (
                <button key={d} onClick={() => startBattle(d)}
                  className="p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl text-center active:scale-95 transition-all cursor-pointer">
                  <div className="text-2xl">{e}</div>
                  <h4 className="font-extrabold text-white text-xs uppercase mt-1">{l}</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{s}</p>
                </button>
              ))}
            </div>
            {wordList?.length > 0 && (
              <button onClick={() => startBattle('custom')}
                className="w-full p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                <span className="text-xl">✍️</span>
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase">O'QITUVCHINING LUG'ATI</h4>
                  <p className="text-[9px] text-indigo-400 font-bold mt-0.5">{wordList.length} ta so'z</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BATTLE ── */}
      {(phase === 'battle' || phase === 'ended') && (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{teamLeft.emoji}</span>
              <span style={{ color:teamLeft.color }} className="font-black uppercase text-sm">{teamLeft.name}</span>
              {lStreak > 1 && <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{lStreak}🔥</span>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMusicOn(!musicOn)}>
                {musicOn ? <Volume2 className="w-4 h-4 text-emerald-400"/> : <VolumeX className="w-4 h-4 text-slate-500"/>}
              </button>
              <span className="text-[9px] font-black text-amber-400 uppercase flex items-center gap-1">
                <Zap className="w-3 h-3"/>{difficulty==='easy'?'BEGINNER':difficulty==='hard'?'IELTS':difficulty==='custom'?'MAXSUS':'UPPER'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {rStreak > 1 && <span className="bg-rose-500 text-slate-950 px-2 py-0.5 text-[9px] font-black rounded animate-bounce">x{rStreak}🔥</span>}
              <span style={{ color:teamRight.color }} className="font-black uppercase text-sm">{teamRight.name}</span>
              <span className="text-xl">{teamRight.emoji}</span>
            </div>
          </div>

          {/* Arena */}
          <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl">
            {/* Confetti */}
            {confetti && (
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                {confettiItems.map(p => (
                  <motion.div key={p.id}
                    initial={{ y:-20, x:`${p.x}vw`, opacity:1, rotate:p.rot }}
                    animate={{ y:'110vh', opacity:[1,1,0], rotate:p.rot+720 }}
                    transition={{ duration:2.5+Math.random(), delay:p.delay, ease:'easeIn' }}
                    style={{ position:'absolute', top:0, width:p.sz, height:p.sz*0.5, borderRadius:2, background:p.col }}/>
                ))}
              </div>
            )}
            {/* Float texts */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <AnimatePresence>
                {lFx.map(e=>(
                  <motion.div key={e.id}
                    initial={{opacity:0,y:220,scale:0.8}} animate={{opacity:[0,1,1,0],y:[220,120]}} exit={{opacity:0}}
                    transition={{duration:1.4}}
                    className="absolute left-[14%] text-cyan-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-cyan-500/40 shadow">{e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rFx.map(e=>(
                  <motion.div key={e.id}
                    initial={{opacity:0,y:220,scale:0.8}} animate={{opacity:[0,1,1,0],y:[220,120]}} exit={{opacity:0}}
                    transition={{duration:1.4}}
                    className="absolute right-[14%] text-rose-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-rose-500/40 shadow">{e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* SVG */}
            <svg viewBox="0 0 1000 340" className="w-full" style={{ maxHeight:380, background:'linear-gradient(180deg,#06082a 0%,#0c1a5e 45%,#1a0a2e 100%)' }}>
              <defs>
                <linearGradient id="tw-grass" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803d"/><stop offset="100%" stopColor="#14532d"/>
                </linearGradient>
              </defs>

              {/* Stars */}
              {[50,130,200,290,380,460,540,620,710,800,870,950,160,425,685,920].map((sx,i)=>(
                <circle key={i} cx={sx} cy={12+i*6%40} r={i%4===0?2:1} fill="white" opacity={0.3+i%3*0.15}/>
              ))}

              {/* Mountains */}
              <polygon points="0,225 100,142 200,225" fill="#08083a" opacity="0.8"/>
              <polygon points="80,225 215,120 350,225" fill="#08083a" opacity="0.75"/>
              <polygon points="650,225 785,124 920,225" fill="#08083a" opacity="0.75"/>
              <polygon points="800,225 900,140 1000,225" fill="#08083a" opacity="0.8"/>
              <polygon points="215,120 232,140 198,140" fill="white" opacity="0.22"/>
              <polygon points="785,124 802,144 768,144" fill="white" opacity="0.2"/>

              {/* Crowd */}
              {Array.from({length:28},(_,i)=>{
                const cx=18+i*36; const cy=220-Math.abs(Math.sin(i)*9);
                const cc=['#3b82f6','#ef4444','#10b981','#a855f7','#f59e0b'][i%5];
                return <g key={i}>
                  <line x1={cx} y1={cy+22} x2={cx} y2={cy} stroke={cc} strokeWidth="5" opacity="0.35" strokeLinecap="round"/>
                  <circle cx={cx} cy={cy-9} r="9" fill={cc} opacity="0.38"/>
                  <ellipse cx={cx} cy={cy+24} rx="11" ry="5" fill={cc} opacity="0.28"/>
                </g>;
              })}

              {/* Grass / ground */}
              <rect x="0" y="308" width="1000" height="32" fill="url(#tw-grass)"/>
              {Array.from({length:50},(_,i)=>(
                <line key={i} x1={i*20+6} y1={308} x2={i*20+(i%3-1)*4} y2={300} stroke="#166534" strokeWidth="1.6" opacity="0.5"/>
              ))}
              <rect x="0" y="316" width="1000" height="24" fill="#78350F" opacity="0.55"/>

              {/* Zone tints */}
              <rect x="0"   y="0" width="490"  height="340" fill="#1d4ed8" opacity="0.04"/>
              <rect x="510" y="0" width="490"  height="340" fill="#b91c1c" opacity="0.04"/>
              <line x1="190" y1="308" x2="190" y2="225" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6,4" opacity="0.38"/>
              <line x1="810" y1="308" x2="810" y2="225" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4" opacity="0.38"/>

              {/* CHARACTERS */}
              {[220,140,60].map(bx=>(
                <TugChar key={bx} team="left"  baseX={bx+sh} state={lState}/>
              ))}
              {[780,860,940].map(bx=>(
                <TugChar key={bx} team="right" baseX={bx+sh} state={rState}/>
              ))}

              {/* ROPE */}
              <TugRope ropePosition={ropePos} lPull={lPull} rPull={rPull}/>

              {/* FLAG */}
              <line x1={flagX} y1="258" x2={flagX} y2="308" stroke="#FBBF24" strokeWidth="4"/>
              <polygon points={`${flagX},258 ${flagX+26},267 ${flagX},276`}
                fill={ropePos<-4?'#3b82f6':ropePos>4?'#ef4444':'#e11d48'} stroke="white" strokeWidth="1.5"/>
              <circle cx={flagX} cy="309" r="6" fill="#FBBF24"/>

              {/* TENSION BAR */}
              <g transform="translate(500,18)">
                <rect x="-165" y="0" width="330" height="14" rx="7" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
                <motion.rect x="-165" y="0" height="14" rx="7"
                  animate={{ width:`${pct*3.3}px` }}
                  transition={{ type:'spring', stiffness:90, damping:14 }}
                  fill={pct<35?'#3b82f6':pct>65?'#ef4444':'#a855f7'} opacity="0.9"/>
                <line x1="0" y1="0" x2="0" y2="14" stroke="white" strokeWidth="2" opacity="0.5"/>
                <text x="-160" y="11" fontSize="8" fill="#93c5fd" fontWeight="bold">{teamLeft.name}</text>
                <text x="160"  y="11" fontSize="8" fill="#fca5a5" fontWeight="bold" textAnchor="end">{teamRight.name}</text>
              </g>
            </svg>
          </div>

          {/* TERMINALS */}
          {phase === 'battle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Left */}
              <div className={`p-5 rounded-3xl border-2 transition-all ${lFrozen?'bg-rose-950/30 border-rose-500/60':'bg-slate-900/90 border-blue-500/40'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span style={{color:teamLeft.color}} className="text-xs font-black uppercase">{teamLeft.emoji} {teamLeft.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">TERMINAL A</span>
                </div>
                {lFrozen ? (
                  <div className="h-[188px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce"/>
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">1.5 soniya kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-blue-500/20">
                      <span className="text-blue-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase">{lWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {lOpts.map((opt,i)=>(
                        <button key={i} onClick={()=>answerLeft(opt)}
                          className="bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500 hover:text-blue-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Right */}
              <div className={`p-5 rounded-3xl border-2 transition-all ${rFrozen?'bg-rose-950/30 border-rose-500/60':'bg-slate-900/90 border-red-500/40'}`}>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <span style={{color:teamRight.color}} className="text-xs font-black uppercase">{teamRight.emoji} {teamRight.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">TERMINAL B</span>
                </div>
                {rFrozen ? (
                  <div className="h-[188px] flex flex-col items-center justify-center gap-3">
                    <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce"/>
                    <h4 className="font-black text-rose-400 text-sm">XATO JAVOB! 😱</h4>
                    <p className="text-[10px] text-slate-400">1.5 soniya kutish...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-950 py-4 px-5 rounded-2xl border border-red-500/20">
                      <span className="text-red-400 text-[9px] uppercase font-black block mb-1">🔤 INGLIZCHASI NIMA?</span>
                      <h3 className="text-lg md:text-xl font-black text-white uppercase">{rWord.uz}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {rOpts.map((opt,i)=>(
                        <button key={i} onClick={()=>answerRight(opt)}
                          className="bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500 hover:text-red-300 p-3 md:p-4 rounded-xl text-[11px] md:text-xs font-black text-white transition-all uppercase cursor-pointer active:scale-95">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WIN SCREEN */}
          {phase === 'ended' && (
            <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:200}}
              className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/50 border-2 border-amber-500/40 py-10 px-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"/>
              <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:1.5}}>
                <Sparkles className="w-14 h-14 text-yellow-400 mx-auto"/>
              </motion.div>
              <div>
                <span className="text-[10px] text-yellow-500 font-extrabold tracking-widest uppercase block">🎊 MUSOBAQA YAKUNLANDI! 🎊</span>
                <h3 className="text-3xl font-black text-white uppercase mt-2">
                  {winner==='left'?teamLeft.name:teamRight.name}
                </h3>
                <p className="text-xl font-black text-yellow-400 mt-1">G'ALABA QOZONDI! 🏆</p>
              </div>
              <div className="flex justify-center gap-4 text-4xl">
                {(['🥇','🎉','⭐'] as const).map((e,i)=>(
                  <motion.span key={i} animate={{y:[0,-10,0]}} transition={{repeat:Infinity,duration:0.8,delay:i*0.2}}>{e}</motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
