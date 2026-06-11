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

// ─────────────────────────────────────────────────────────────
// CHIBI CHARACTER  (HUGE head, big expressive eyes, cartoon)
// ─────────────────────────────────────────────────────────────
function TugChar({ team, cx: baseX, state }: { team:'left'|'right'; cx:number; state:CS }) {
  const L  = team === 'left';
  const rs = L ? 1 : -1;

  // Pose lean & vertical shift
  let lean = L ? -5 : 5;
  let vy   = 0;
  if (state==='pulling')  { lean=L?-22:22; vy=6; }
  if (state==='slipping') { lean=L?32:-32; vy=-4; }
  if (state==='won')      { lean=0; vy=-18; }
  if (state==='lost')     { lean=L?18:-18; vy=14; }

  const GY = 316;
  const HX = baseX + lean * 0.5;         // head cx
  const HY = GY - 204 + vy;              // head cy   ← BIG chibi head
  const HR = 42;                          // head radius
  const BX = baseX + lean * 0.28;        // body cx

  // Vertical body coords (shift with vy)
  const SHY = GY - 148 + vy;  // shoulder top
  const WAY = GY - 86  + vy;  // waist
  const HPY = GY - 72  + vy;  // hip

  // Feet (stay at ground)
  const sp   = state==='pulling'?12 : state==='won'?14 : 0;
  const fRopeX = baseX + rs*(18+sp);
  const fBackX = baseX - rs*(18+sp);
  const KY  = GY - 36;  // knee

  // Shoe toe direction: toward rope for front foot
  const fRToeTip = fRopeX + rs*18;
  const fBToeTip = fBackX - rs*14;

  // ── ARM COORDS ──
  let [peX,peY,phX,phY] = [0,0,0,0];  // pull arm elbow/hand
  let [beX,beY,bhX,bhY] = [0,0,0,0];  // back arm

  if (state==='won') {
    [peX,peY,phX,phY]=[HX+rs*44,SHY-16,HX+rs*52,SHY-44];
    [beX,beY,bhX,bhY]=[HX-rs*44,SHY-16,HX-rs*52,SHY-44];
  } else if (state==='lost') {
    [peX,peY,phX,phY]=[BX+rs*26,WAY-4,BX+rs*22,GY-100];
    [beX,beY,bhX,bhY]=[BX-rs*22,WAY-4,BX-rs*18,GY-100];
  } else if (state==='pulling') {
    [peX,peY,phX,phY]=[BX+rs*62,SHY+22,BX+rs*100,SHY+12];
    [beX,beY,bhX,bhY]=[BX-rs*32,SHY+28,BX-rs*46,WAY-14];
  } else if (state==='slipping') {
    [peX,peY,phX,phY]=[BX+rs*46,SHY+4,BX+rs*72,SHY-18];
    [beX,beY,bhX,bhY]=[BX-rs*46,SHY+4,BX-rs*70,SHY-14];
  } else {  // idle
    [peX,peY,phX,phY]=[BX+rs*54,SHY+22,BX+rs*86,SHY+14];
    [beX,beY,bhX,bhY]=[BX-rs*26,SHY+24,BX-rs*38,WAY-10];
  }

  // ── COLORS ──
  const SC='#FBBF24', SD='#D97706';           // skin
  const T1=L?'#1d4ed8':'#dc2626';             // shirt main
  const TL=L?'#93c5fd':'#fca5a5';             // shirt light
  const TD=L?'#1e3a8a':'#991b1b';             // shirt dark
  const PA=L?'#1e3a5f':'#4a0404';             // pants
  const HC='#1C0A00';                          // hair
  const WH='#f8fafc';                          // shoe white

  // ── FACE ──
  const ELX=HX-15, ERX=HX+15, EY=HY+4;
  const IC='#5D3A1A';  // iris

  let eyeL: React.ReactNode, eyeR: React.ReactNode;
  let brow: React.ReactNode;
  let mth:  React.ReactNode;
  let fx:   React.ReactNode = null;

  if (state==='won') {
    // ^.^ squinting happy crescents
    eyeL=<path d={`M ${ELX-17} ${EY+4} Q ${ELX} ${EY-14} ${ELX+17} ${EY+4}`}
      stroke={HC} strokeWidth="4.5" fill="#FDDEA0" strokeLinecap="round"/>;
    eyeR=<path d={`M ${ERX-17} ${EY+4} Q ${ERX} ${EY-14} ${ERX+17} ${EY+4}`}
      stroke={HC} strokeWidth="4.5" fill="#FDDEA0" strokeLinecap="round"/>;
    brow=<>
      <path d={`M ${ELX-17} ${EY-20} Q ${ELX} ${EY-28} ${ELX+17} ${EY-20}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d={`M ${ERX-17} ${EY-20} Q ${ERX} ${EY-28} ${ERX+17} ${EY-20}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
    </>;
    mth=<>
      <path d={`M ${HX-22} ${HY+20} Q ${HX} ${HY+37} ${HX+22} ${HY+20}`}
        stroke={HC} strokeWidth="3" fill="white" strokeLinecap="round"/>
      <path d={`M ${HX-12} ${HY+24} Q ${HX} ${HY+32} ${HX+12} ${HY+24}`}
        fill="#F87171" opacity="0.5"/>
    </>;
    fx=<>
      <ellipse cx={HX-28} cy={HY+16} rx="12" ry="6" fill="#FF6B8A" opacity="0.55"/>
      <ellipse cx={HX+28} cy={HY+16} rx="12" ry="6" fill="#FF6B8A" opacity="0.55"/>
      <path d={`M ${ELX+10} ${EY+8} Q ${ELX+14} ${EY+22} ${ELX+12} ${EY+36}`}
        stroke="#60A5FA" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <text x={HX-14} y={HY-52} fontSize="30">🏆</text>
    </>;

  } else if (state==='lost') {
    // Sad watery eyes with big tears
    eyeL=<>
      <ellipse cx={ELX} cy={EY} rx="17" ry="19" fill="white" stroke={HC} strokeWidth="2"/>
      <circle  cx={ELX} cy={EY+5} r="12" fill={IC}/>
      <circle  cx={ELX} cy={EY+5} r="7"  fill="#0A0A0A"/>
      <circle  cx={ELX+4} cy={EY} r="3.5" fill="white"/>
      <path d={`M ${ELX-17} ${EY+14} Q ${ELX} ${EY+22} ${ELX+17} ${EY+14}`}
        fill="#BFDBFE" opacity="0.6"/>
    </>;
    eyeR=<>
      <ellipse cx={ERX} cy={EY} rx="17" ry="19" fill="white" stroke={HC} strokeWidth="2"/>
      <circle  cx={ERX} cy={EY+5} r="12" fill={IC}/>
      <circle  cx={ERX} cy={EY+5} r="7"  fill="#0A0A0A"/>
      <circle  cx={ERX+4} cy={EY} r="3.5" fill="white"/>
      <path d={`M ${ERX-17} ${EY+14} Q ${ERX} ${EY+22} ${ERX+17} ${EY+14}`}
        fill="#BFDBFE" opacity="0.6"/>
    </>;
    brow=<>
      <path d={`M ${ELX-14} ${EY-15} Q ${ELX} ${EY-9} ${ELX+14} ${EY-15}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d={`M ${ERX-14} ${EY-15} Q ${ERX} ${EY-9} ${ERX+14} ${EY-15}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
    </>;
    mth=<path d={`M ${HX-16} ${HY+28} Q ${HX} ${HY+20} ${HX+16} ${HY+28}`}
      stroke={HC} strokeWidth="3.5" fill="none" strokeLinecap="round"/>;
    fx=<>
      <path d={`M ${ELX+4} ${EY+20} Q ${ELX+8} ${EY+38} ${ELX+5} ${EY+54}`}
        stroke="#3B82F6" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d={`M ${ERX-4} ${EY+20} Q ${ERX-8} ${EY+38} ${ERX-5} ${EY+54}`}
        stroke="#3B82F6" strokeWidth="6" fill="none" strokeLinecap="round"/>
    </>;

  } else if (state==='pulling') {
    // Squinting lines + gritted teeth
    eyeL=<>
      <path d={`M ${ELX-17} ${EY+4} L ${ELX+17} ${EY+4}`}
        stroke={HC} strokeWidth="6" strokeLinecap="round"/>
      <path d={`M ${ELX-12} ${EY+10} Q ${ELX} ${EY+15} ${ELX+12} ${EY+10}`}
        stroke={SD} strokeWidth="2" fill="none" opacity="0.4"/>
    </>;
    eyeR=<>
      <path d={`M ${ERX-17} ${EY+4} L ${ERX+17} ${EY+4}`}
        stroke={HC} strokeWidth="6" strokeLinecap="round"/>
      <path d={`M ${ERX-12} ${EY+10} Q ${ERX} ${EY+15} ${ERX+12} ${EY+10}`}
        stroke={SD} strokeWidth="2" fill="none" opacity="0.4"/>
    </>;
    brow=<>
      <line x1={ELX-15} y1={EY-10} x2={ELX+15} y2={EY-17}
        stroke={HC} strokeWidth="6" strokeLinecap="round"/>
      <line x1={ERX-15} y1={EY-17} x2={ERX+15} y2={EY-10}
        stroke={HC} strokeWidth="6" strokeLinecap="round"/>
    </>;
    mth=<>
      <rect x={HX-15} y={HY+17} width="30" height="13" rx="4" fill={HC}/>
      {([-10,-5,0,5,10] as number[]).map(o=>(
        <line key={o} x1={HX+o} y1={HY+17} x2={HX+o} y2={HY+30}
          stroke="white" strokeWidth="2.5"/>
      ))}
    </>;
    fx=<>
      <ellipse cx={HX-rs*38} cy={HY+12} rx="11" ry="5.5" fill="#EF4444" opacity="0.38"/>
      <ellipse cx={HX+rs*38} cy={HY+12} rx="11" ry="5.5" fill="#EF4444" opacity="0.38"/>
      <line x1={HX-rs*42} y1={HY-26} x2={HX-rs*54} y2={HY-33}
        stroke="#FBBF24" strokeWidth="4" strokeLinecap="round"/>
      <line x1={HX-rs*40} y1={HY-12} x2={HX-rs*54} y2={HY-12}
        stroke="#FBBF24" strokeWidth="4" strokeLinecap="round"/>
      <line x1={HX-rs*38} y1={HY+2} x2={HX-rs*50} y2={HY+7}
        stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round"/>
      <ellipse cx={HX+rs*42} cy={HY-10} rx="5" ry="8" fill="#7DD3FC" opacity="0.85"/>
      <ellipse cx={HX+rs*30} cy={HY+2}  rx="3.5" ry="6" fill="#7DD3FC" opacity="0.65"/>
    </>;

  } else if (state==='slipping') {
    // O_O shocked wide
    eyeL=<>
      <circle cx={ELX} cy={EY} r="19" fill="white" stroke={HC} strokeWidth="2.5"/>
      <circle cx={ELX} cy={EY} r="12" fill={IC}/>
      <circle cx={ELX} cy={EY} r="7"  fill="#0A0A0A"/>
      <circle cx={ELX+5} cy={EY-4} r="3.5" fill="white"/>
    </>;
    eyeR=<>
      <circle cx={ERX} cy={EY} r="19" fill="white" stroke={HC} strokeWidth="2.5"/>
      <circle cx={ERX} cy={EY} r="12" fill={IC}/>
      <circle cx={ERX} cy={EY} r="7"  fill="#0A0A0A"/>
      <circle cx={ERX+5} cy={EY-4} r="3.5" fill="white"/>
    </>;
    brow=<>
      <path d={`M ${ELX-17} ${EY-22} Q ${ELX} ${EY-31} ${ELX+17} ${EY-22}`}
        stroke={HC} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
      <path d={`M ${ERX-17} ${EY-22} Q ${ERX} ${EY-31} ${ERX+17} ${EY-22}`}
        stroke={HC} strokeWidth="5.5" fill="none" strokeLinecap="round"/>
    </>;
    mth=<>
      <ellipse cx={HX} cy={HY+26} rx="14" ry="15" fill={HC}/>
      <ellipse cx={HX} cy={HY+24} rx="9"  ry="10" fill="#7F1D1D" opacity="0.75"/>
    </>;
    fx=<>
      <text x={HX-13} y={HY-50} fontSize="28">😱</text>
      <ellipse cx={HX+rs*48} cy={HY-10} rx="5.5" ry="9" fill="#7DD3FC" opacity="0.9"/>
      <ellipse cx={HX+rs*36} cy={HY-22} rx="4"   ry="7" fill="#7DD3FC" opacity="0.7"/>
      <ellipse cx={HX+rs*56} cy={HY-26} rx="3.5" ry="6" fill="#7DD3FC" opacity="0.6"/>
    </>;

  } else { // idle
    eyeL=<>
      <ellipse cx={ELX} cy={EY} rx="16" ry="19" fill="white" stroke={HC} strokeWidth="2"/>
      <circle  cx={ELX+rs*2} cy={EY+2} r="11" fill={IC}/>
      <circle  cx={ELX+rs*2} cy={EY+2} r="6.5" fill="#0A0A0A"/>
      <circle  cx={ELX+rs*2+4} cy={EY-2} r="3.5" fill="white"/>
      <circle  cx={ELX+rs*2-2} cy={EY+6} r="1.8" fill="white"/>
      <path d={`M ${ELX-16} ${EY-16} Q ${ELX} ${EY-22} ${ELX+16} ${EY-16}`}
        stroke={HC} strokeWidth="2.5" fill="none"/>
    </>;
    eyeR=<>
      <ellipse cx={ERX} cy={EY} rx="16" ry="19" fill="white" stroke={HC} strokeWidth="2"/>
      <circle  cx={ERX+rs*2} cy={EY+2} r="11" fill={IC}/>
      <circle  cx={ERX+rs*2} cy={EY+2} r="6.5" fill="#0A0A0A"/>
      <circle  cx={ERX+rs*2+4} cy={EY-2} r="3.5" fill="white"/>
      <circle  cx={ERX+rs*2-2} cy={EY+6} r="1.8" fill="white"/>
      <path d={`M ${ERX-16} ${EY-16} Q ${ERX} ${EY-22} ${ERX+16} ${EY-16}`}
        stroke={HC} strokeWidth="2.5" fill="none"/>
    </>;
    brow=<>
      <path d={`M ${ELX-15} ${EY-14} Q ${ELX} ${EY-19} ${ELX+15} ${EY-15}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d={`M ${ERX-15} ${EY-15} Q ${ERX} ${EY-19} ${ERX+15} ${EY-14}`}
        stroke={HC} strokeWidth="5" fill="none" strokeLinecap="round"/>
    </>;
    mth=<path d={`M ${HX-10} ${HY+22} Q ${HX} ${HY+29} ${HX+10} ${HY+22}`}
      stroke={HC} strokeWidth="3.5" fill="none" strokeLinecap="round"/>;
    fx=<>
      <ellipse cx={HX-28} cy={HY+17} rx="10" ry="5.5" fill="#FFAAAA" opacity="0.38"/>
      <ellipse cx={HX+28} cy={HY+17} rx="10" ry="5.5" fill="#FFAAAA" opacity="0.38"/>
    </>;
  }

  const AW=20, FW=15;  // arm/forearm stroke widths (thicker = more cartoon)

  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={baseX} cy={GY+8} rx="34" ry="8" fill="rgba(0,0,0,0.22)"/>

      {/* ── LEGS ── */}
      {state==='won' ? (
        <>
          {/* Jump: legs bent outward */}
          <path d={`M ${BX-4} ${HPY} C ${BX-rs*8} ${HPY+28} ${fBackX+rs*4} ${KY+20} ${fBackX} ${GY}`}
            stroke={PA} strokeWidth="22" fill="none" strokeLinecap="round"/>
          <path d={`M ${BX+4} ${HPY} C ${BX+rs*8} ${HPY+28} ${fRopeX-rs*4} ${KY+20} ${fRopeX} ${GY}`}
            stroke={PA} strokeWidth="22" fill="none" strokeLinecap="round"/>
          {/* Shoes — lifted off ground */}
          <ellipse cx={fBackX} cy={GY-10} rx="20" ry="8" fill={WH} stroke={T1} strokeWidth="2.5"/>
          <ellipse cx={fRopeX} cy={GY-6}  rx="20" ry="8" fill={WH} stroke={T1} strokeWidth="2.5"/>
        </>
      ) : (
        <>
          <path d={`M ${BX+4} ${HPY} C ${BX+rs*6} ${HPY+26} ${fRopeX+rs*2} ${KY+14} ${fRopeX} ${GY}`}
            stroke={PA} strokeWidth="22" fill="none" strokeLinecap="round"/>
          <path d={`M ${BX-4} ${HPY} C ${BX-rs*6} ${HPY+26} ${fBackX-rs*2} ${KY+14} ${fBackX} ${GY}`}
            stroke={`${PA}cc`} strokeWidth="20" fill="none" strokeLinecap="round"/>
          {/* Front shoe (rope side — drawn on top) */}
          <ellipse cx={fBackX} cy={GY+5} rx="20" ry="8" fill={WH} stroke={HC} strokeWidth="1.5"/>
          <path d={`M ${fBackX} ${GY-2} L ${fBToeTip} ${GY+5}`}
            stroke={T1} strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          <ellipse cx={fRopeX} cy={GY+5} rx="22" ry="9" fill={WH} stroke={T1} strokeWidth="2.5"/>
          <path d={`M ${fRopeX} ${GY-2} L ${fRToeTip} ${GY+5}`}
            stroke={T1} strokeWidth="5" strokeLinecap="round" opacity="0.75"/>
        </>
      )}

      {/* ── BACK ARM (behind body) ── */}
      {state!=='won' && (
        <>
          <path d={`M ${BX-rs*24} ${SHY+8} C ${BX-rs*36} ${SHY+22} ${beX} ${beY} ${beX} ${beY}`}
            stroke={TD} strokeWidth={AW} fill="none" strokeLinecap="round"/>
          <path d={`M ${beX} ${beY} C ${beX} ${beY} ${bhX} ${bhY} ${bhX} ${bhY}`}
            stroke={TD} strokeWidth={FW} fill="none" strokeLinecap="round"/>
          <circle cx={bhX} cy={bhY} r="12" fill={SC} stroke={SD} strokeWidth="2"/>
        </>
      )}

      {/* ── SHIRT BODY ── */}
      <path d={`
        M ${HX-30} ${SHY}
        C ${HX-36} ${SHY+14} ${BX-26} ${WAY-10} ${BX-22} ${WAY}
        L ${BX+22} ${WAY}
        C ${BX+26} ${WAY-10} ${HX+36} ${SHY+14} ${HX+30} ${SHY}
        C ${HX+20} ${SHY-6} ${HX-20} ${SHY-6} ${HX-30} ${SHY}
        Z`}
        fill={T1} stroke={TD} strokeWidth="2"/>
      {/* Shine */}
      <path d={`M ${HX-26} ${SHY+5} C ${HX-30} ${SHY+20} ${HX-24} ${WAY-14} ${HX-14} ${WAY-10}`}
        stroke={TL} strokeWidth="7" fill="none" opacity="0.28" strokeLinecap="round"/>
      {/* V collar */}
      <path d={`M ${HX-13} ${SHY} L ${HX} ${SHY+18} L ${HX+13} ${SHY}`}
        fill={TD} opacity="0.7"/>
      {/* Team stripe on side */}
      <path d={`M ${HX+rs*26} ${SHY+6} C ${HX+rs*30} ${SHY+24} ${BX+rs*22} ${WAY-8} ${BX+rs*18} ${WAY}`}
        stroke={TL} strokeWidth="5" fill="none" opacity="0.5" strokeLinecap="round"/>

      {/* Shorts */}
      <rect x={BX-22} y={WAY} width="44" height="22" rx="5" fill={PA}/>
      {/* Belt */}
      <rect x={BX-24} y={WAY-8} width="48" height="12" rx="4" fill="#78350F"/>
      <rect x={BX-7}  y={WAY-8} width="14" height="12" rx="3" fill="#CA8A04"/>
      <rect x={BX-5}  y={WAY-6} width="10" height="8"  rx="2" fill="#FBBF24"/>

      {/* ── NECK ── */}
      <path d={`M ${HX-11} ${HY+HR-8} L ${HX-11} ${SHY+2} L ${HX+11} ${SHY+2} L ${HX+11} ${HY+HR-8}`}
        fill={SC} stroke={SD} strokeWidth="0.8"/>

      {/* ── EARS ── */}
      <ellipse cx={HX-HR+4} cy={HY+5} rx="8"  ry="11" fill={SC} stroke={SD} strokeWidth="1.5"/>
      <ellipse cx={HX-HR+4} cy={HY+5} rx="4.5" ry="7" fill={SD} opacity="0.25"/>
      <ellipse cx={HX+HR-4} cy={HY+5} rx="8"  ry="11" fill={SC} stroke={SD} strokeWidth="1.5"/>
      <ellipse cx={HX+HR-4} cy={HY+5} rx="4.5" ry="7" fill={SD} opacity="0.25"/>

      {/* ── HEAD oval ── */}
      <ellipse cx={HX} cy={HY} rx={HR} ry={HR+3} fill={SC} stroke={SD} strokeWidth="1.8"/>
      {/* Subtle cheek shading */}
      <ellipse cx={HX-18} cy={HY+12} rx="12" ry="7" fill={SD} opacity="0.1"/>
      <ellipse cx={HX+18} cy={HY+12} rx="12" ry="7" fill={SD} opacity="0.1"/>

      {/* ── HAIR ── */}
      {/* Main cap */}
      <path d={`M ${HX-HR+2} ${HY-10}
        C ${HX-HR-4} ${HY-48} ${HX+HR+4} ${HY-48} ${HX+HR-2} ${HY-10}`}
        fill={HC}/>
      {/* Spiky top */}
      <path d={`M ${HX-24} ${HY-HR+6}
        Q ${HX-32} ${HY-HR-12} ${HX-18} ${HY-HR+2}
        Q ${HX-8}  ${HY-HR-18} ${HX}    ${HY-HR-4}
        Q ${HX+8}  ${HY-HR-22} ${HX+20} ${HY-HR+2}
        Q ${HX+30} ${HY-HR-8}  ${HX+24} ${HY-HR+6}`}
        fill={HC}/>
      {/* Side hair */}
      <path d={`M ${HX-HR+2} ${HY-10} C ${HX-HR-10} ${HY+5} ${HX-HR-8} ${HY+22} ${HX-HR+2} ${HY+28}`}
        fill={HC}/>
      <path d={`M ${HX+HR-2} ${HY-10} C ${HX+HR+10} ${HY+5} ${HX+HR+8} ${HY+22} ${HX+HR-2} ${HY+28}`}
        fill={HC}/>
      {/* Hair highlight */}
      <path d={`M ${HX-16} ${HY-HR-10} C ${HX-8} ${HY-HR-18} ${HX+8} ${HY-HR-18} ${HX+16} ${HY-HR-10}`}
        stroke="white" strokeWidth="3" fill="none" opacity="0.22" strokeLinecap="round"/>

      {/* ── FACE ── */}
      {brow}
      {eyeL}
      {eyeR}
      {/* Nose */}
      <ellipse cx={HX-4} cy={HY+13} rx="3.5" ry="2.5" fill={SD} opacity="0.28"/>
      <ellipse cx={HX+4} cy={HY+13} rx="3.5" ry="2.5" fill={SD} opacity="0.28"/>
      {mth}
      {fx}

      {/* ── FRONT ARM (over everything) ── */}
      {state==='won' ? (
        <>
          <path d={`M ${BX-rs*24} ${SHY+8} C ${BX-rs*36} ${SHY+22} ${beX} ${beY} ${beX} ${beY}`}
            stroke={T1} strokeWidth={AW} fill="none" strokeLinecap="round"/>
          <path d={`M ${beX} ${beY} L ${bhX} ${bhY}`}
            stroke={T1} strokeWidth={FW} fill="none" strokeLinecap="round"/>
          <circle cx={bhX} cy={bhY} r="12" fill={SC} stroke={SD} strokeWidth="2"/>
          <path d={`M ${BX+rs*24} ${SHY+8} C ${BX+rs*36} ${SHY+22} ${peX} ${peY} ${peX} ${peY}`}
            stroke={T1} strokeWidth={AW} fill="none" strokeLinecap="round"/>
          <path d={`M ${peX} ${peY} L ${phX} ${phY}`}
            stroke={T1} strokeWidth={FW} fill="none" strokeLinecap="round"/>
          <circle cx={phX} cy={phY} r="12" fill={SC} stroke={SD} strokeWidth="2"/>
        </>
      ) : (
        <>
          <path d={`M ${BX+rs*24} ${SHY+8} C ${BX+rs*40} ${SHY+18} ${peX} ${peY} ${peX} ${peY}`}
            stroke={T1} strokeWidth={AW} fill="none" strokeLinecap="round"/>
          <path d={`M ${peX} ${peY} C ${peX} ${peY} ${phX} ${phY} ${phX} ${phY}`}
            stroke={T1} strokeWidth={FW} fill="none" strokeLinecap="round"/>
          <circle cx={phX} cy={phY} r="12" fill={SC} stroke={SD} strokeWidth="2"/>
          {/* Fingers on rope */}
          {(state==='idle'||state==='pulling') && ([-6,0,6] as number[]).map(o=>(
            <ellipse key={o} cx={phX+rs*o*0.4} cy={phY+12+Math.abs(o)*0.3}
              rx="5" ry="3.5" fill={SD}/>
          ))}
        </>
      )}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// REAL BRAIDED ROPE  (3 sine-wave strands, no ellipse dots!)
// ─────────────────────────────────────────────────────────────
function TugRope({ rp, lp, rpp }: { rp:number; lp:boolean; rpp:boolean }) {
  const sh = -rp * 12;
  const lx = 296 + sh, rx = 704 + sh;
  const ry = 280, sag = lp||rpp ? 3 : 10;
  const my = ry + sag, mx = (lx+rx)/2;
  const base = `M ${lx},${ry} Q ${mx},${my} ${rx},${ry}`;

  // Generate a sinusoidal strand along the bezier
  const strand = (phase: number, amp: number) => {
    const N = 80;
    return Array.from({ length: N+1 }, (_, i) => {
      const t = i / N;
      const bx = (1-t)*(1-t)*lx + 2*(1-t)*t*mx + t*t*rx;
      const by = (1-t)*(1-t)*ry + 2*(1-t)*t*my + t*t*ry;
      const off = Math.sin(t * Math.PI * 18 + phase) * amp;
      return `${i===0?'M':'L'} ${bx.toFixed(1)},${(by+off).toFixed(1)}`;
    }).join(' ');
  };

  return (
    <g>
      {/* Drop shadow */}
      <path d={base} stroke="rgba(0,0,0,0.38)" strokeWidth="30" fill="none" strokeLinecap="round"/>
      {/* Dark bark */}
      <path d={base} stroke="#2C1005" strokeWidth="26" fill="none" strokeLinecap="round"/>
      {/* 3 braided strands — phase offset by 120° each */}
      <path d={strand(0,              5.5)} stroke="#7C3D12" strokeWidth="11" fill="none" strokeLinecap="round"/>
      <path d={strand(Math.PI*2/3,    5.5)} stroke="#A5601E" strokeWidth="10" fill="none" strokeLinecap="round"/>
      <path d={strand(Math.PI*4/3,    5.5)} stroke="#C9854A" strokeWidth="9"  fill="none" strokeLinecap="round"/>
      {/* Highlight ridge on top */}
      <path d={strand(Math.PI,        -3.5)} stroke="#E8B060" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round"/>
      <path d={strand(Math.PI,        -5)}   stroke="white"   strokeWidth="2" fill="none" opacity="0.15" strokeLinecap="round"/>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// CONFETTI
// ─────────────────────────────────────────────────────────────
const CC = ['#f59e0b','#10b981','#3b82f6','#ef4444','#a855f7','#ec4899','#fff'];
const CONF = Array.from({length:32},(_,i)=>({
  id:i, x:Math.random()*100, delay:Math.random()*1.4,
  col:CC[i%CC.length], sz:6+Math.random()*8, rot:Math.random()*360,
}));

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function TugOfWar({ teamLeft, teamRight, wordList, selectedDifficulty, onGameWin, onUpdateScore }: TugOfWarProps) {
  const [phase, setPhase]     = useState<'difficulty'|'battle'|'ended'>('difficulty');
  const [diff,  setDiff]      = useState<'easy'|'medium'|'hard'|'custom'>('medium');
  const [musicOn,setMusicOn]  = useState(true);
  const [rop,   setRop]       = useState(0);
  const WIN = 12;

  const [words,setWords]      = useState<WordPair[]>(MEDIUM);
  const [lW,setLW]            = useState(MEDIUM[0]);
  const [lO,setLO]            = useState<string[]>([]);
  const [lFrz,setLFrz]        = useState(false);
  const [lPl,setLPl]          = useState<WordPair[]>([]);
  const [rW,setRW]            = useState(MEDIUM[1]);
  const [rO,setRO]            = useState<string[]>([]);
  const [rFrz,setRFrz]        = useState(false);
  const [rPl,setRPl]          = useState<WordPair[]>([]);
  const [lStr,setLStr]        = useState(0);
  const [rStr,setRStr]        = useState(0);
  const [lPull,setLPull]      = useState(false);
  const [rPull,setRPull]      = useState(false);
  const [lSlip,setLSlip]      = useState(false);
  const [rSlip,setRSlip]      = useState(false);
  const [shake,setShake]      = useState(false);
  const [showC,setShowC]      = useState(false);
  const [lFx,setLFx] = useState<{id:number;text:string}[]>([]);
  const [rFx,setRFx] = useState<{id:number;text:string}[]>([]);

  const ref = useRef<HTMLIFrameElement>(null);
  const yt  = useCallback((fn:string,a:unknown[]=[])=>{
    ref.current?.contentWindow?.postMessage(JSON.stringify({event:'command',func:fn,args:a}),'*');
  },[]);

  useEffect(()=>{
    const h=(e:MessageEvent)=>{
      try{const d=JSON.parse(typeof e.data==='string'?e.data:'{}');
        if(d.event==='onReady'&&phase==='battle'&&musicOn){yt('unMute');yt('setVolume',[90]);}
      }catch{}
    };
    window.addEventListener('message',h);
    return()=>window.removeEventListener('message',h);
  },[phase,musicOn,yt]);

  useEffect(()=>{
    if(phase==='battle'&&musicOn){
      yt('unMute');yt('setVolume',[90]);yt('playVideo');
      const t1=setTimeout(()=>{yt('unMute');yt('setVolume',[90]);},500);
      const t2=setTimeout(()=>{yt('unMute');yt('setVolume',[90]);},1200);
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
    let a=[...cur]; if(!a.length) a=[...pool].sort(()=>Math.random()-.5);
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
    } else {
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
    } else {
      sound.playIncorrect();setRStr(0);addFx('r','😱 XATO!');
      setRFrz(true);setRSlip(true);
      const nx=Math.max(-WIN,rop-3);setRop(nx);
      if(nx<=-WIN)end('l');
      else setTimeout(()=>{setRFrz(false);setRSlip(false);gq('r',words,rPl);},1500);
    }
  };

  const win  = phase==='ended'?(rop<=-WIN?'l':'r'):null;
  const pct  = ((rop+WIN)/(WIN*2))*100;
  const sh   = -rop*12;
  const flagX= 500+rop*14;

  const lSt:CS = phase==='ended'?(win==='l'?'won':'lost'):lPull?'pulling':lSlip?'slipping':'idle';
  const rSt:CS = phase==='ended'?(win==='r'?'won':'lost'):rPull?'pulling':rSlip?'slipping':'idle';

  return (
    <div className={`w-full max-w-6xl mx-auto px-2 py-2 select-none ${shake?'translate-x-0.5':''} transition-transform duration-75`}>

      {/* Music — ALWAYS mounted so video pre-buffers */}
      <iframe ref={ref}
        src="https://www.youtube.com/embed/j763AfSrlF0?autoplay=1&loop=1&playlist=j763AfSrlF0&controls=0&mute=1&enablejsapi=1"
        allow="autoplay" title="music"
        className="absolute top-0 left-0 w-0 h-0 pointer-events-none opacity-0"/>

      {/* ── DIFFICULTY ── */}
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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"/>🎵 Bolalar Raqsi
            </span>
            <button onClick={()=>{sound.playTap();setMusicOn(!musicOn);}}
              className={`py-1.5 px-4 rounded-xl border text-[10px] font-black uppercase cursor-pointer ${musicOn?'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':'bg-slate-900 text-slate-400 border-slate-700'}`}>
              {musicOn?<Volume2 className="w-4 h-4 inline"/>:<VolumeX className="w-4 h-4 inline"/>}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              {d:'easy'  ,e:'🌱',l:'Headway Beginner',s:"Oson so'zlar"},
              {d:'medium',e:'⚡',l:'Headway Upper',   s:"O'rta daraja"},
              {d:'hard'  ,e:'🏆',l:'IELTS Advanced',  s:'Qiyin akademik'},
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

      {/* ── BATTLE ── */}
      {(phase==='battle'||phase==='ended')&&(
        <div className="space-y-3">
          {/* Header */}
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
                <Zap className="w-3 h-3"/>{diff==='easy'?'BEGINNER':diff==='hard'?'IELTS':diff==='custom'?'MAXSUS':'UPPER'}
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
                    className="absolute left-[14%] text-cyan-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-cyan-500/40 shadow">{e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {rFx.map(e=>(
                  <motion.div key={e.id}
                    initial={{opacity:0,y:230,scale:0.8}} animate={{opacity:[0,1,1,0],y:[230,120]}}
                    exit={{opacity:0}} transition={{duration:1.4}}
                    className="absolute right-[14%] text-rose-300 font-black text-sm bg-slate-950/90 px-3 py-1 rounded-xl border border-rose-500/40 shadow">{e.text}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <svg viewBox="0 0 1000 340" className="w-full" style={{maxHeight:390,background:'linear-gradient(180deg,#050520 0%,#0c1a5e 50%,#1a0a2e 100%)'}}>
              <defs>
                <linearGradient id="grs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a"/><stop offset="100%" stopColor="#14532d"/>
                </linearGradient>
                <radialGradient id="spot" cx="50%" cy="30%" r="55%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12"/>
                  <stop offset="100%" stopColor="transparent"/>
                </radialGradient>
              </defs>

              {/* Stars */}
              {[60,140,220,310,400,480,560,650,740,830,900,970,180,440,700,950].map((sx,i)=>(
                <circle key={i} cx={sx} cy={10+i*5%38} r={i%4===0?2.5:1.2} fill="white" opacity={0.25+i%3*0.18}/>
              ))}

              {/* Spotlight glow */}
              <rect width="1000" height="340" fill="url(#spot)"/>

              {/* Mountains */}
              <polygon points="0,230 90,148 180,230"     fill="#070730" opacity="0.85"/>
              <polygon points="70,230 210,124 350,230"   fill="#070730" opacity="0.80"/>
              <polygon points="660,230 800,128 940,230"  fill="#070730" opacity="0.80"/>
              <polygon points="820,230 910,146 1000,230" fill="#070730" opacity="0.85"/>
              {/* Snow */}
              <polygon points="210,124 228,145 192,145" fill="white" opacity="0.25"/>
              <polygon points="800,128 818,150 782,150" fill="white" opacity="0.22"/>

              {/* Colourful crowd */}
              {Array.from({length:30},(_,i)=>{
                const cx=14+i*34; const cy=225-Math.abs(Math.sin(i)*9);
                const c=['#3b82f6','#ef4444','#10b981','#a855f7','#f59e0b','#ec4899'][i%6];
                return <g key={i}>
                  <ellipse cx={cx} cy={cy+24} rx="12" ry="5" fill={c} opacity="0.32"/>
                  <line x1={cx} y1={cy+22} x2={cx} y2={cy} stroke={c} strokeWidth="6" opacity="0.35" strokeLinecap="round"/>
                  <circle cx={cx} cy={cy-10} r="10" fill={c} opacity="0.42"/>
                  {i%4===0&&<circle cx={cx} cy={cy-20} r="5" fill="white" opacity="0.4"/>}
                </g>;
              })}

              {/* Grass */}
              <rect x="0" y="308" width="1000" height="32" fill="url(#grs)"/>
              {Array.from({length:55},(_,i)=>(
                <line key={i} x1={i*18+5} y1={308} x2={i*18+(i%3-1)*4} y2={300} stroke="#16a34a" strokeWidth="1.8" opacity="0.5"/>
              ))}
              <rect x="0" y="316" width="1000" height="24" fill="#713f12" opacity="0.6"/>

              {/* Zone dashes */}
              <line x1="185" y1="308" x2="185" y2="228" stroke="#60a5fa" strokeWidth="2" strokeDasharray="6,4" opacity="0.4"/>
              <line x1="815" y1="308" x2="815" y2="228" stroke="#f87171" strokeWidth="2" strokeDasharray="6,4" opacity="0.4"/>

              {/* CHARACTERS */}
              {[220,138,56].map(bx=>(
                <TugChar key={bx} team="left"  cx={bx+sh} state={lSt}/>
              ))}
              {[780,862,944].map(bx=>(
                <TugChar key={bx} team="right" cx={bx+sh} state={rSt}/>
              ))}

              {/* ROPE */}
              <TugRope rp={rop} lp={lPull} rpp={rPull}/>

              {/* FLAG */}
              <line x1={flagX} y1="256" x2={flagX} y2="308" stroke="#FBBF24" strokeWidth="4"/>
              <polygon points={`${flagX},256 ${flagX+28},265 ${flagX},274`}
                fill={rop<-4?'#3b82f6':rop>4?'#ef4444':'#e11d48'} stroke="white" strokeWidth="1.5"/>
              <circle cx={flagX} cy="309" r="7" fill="#FBBF24"/>
              <ellipse cx={flagX} cy="309" rx="11" ry="4"
                fill={rop<-4?'#3b82f6':rop>4?'#ef4444':'#e11d48'} opacity="0.45"/>

              {/* TENSION BAR */}
              <g transform="translate(500,16)">
                <rect x="-168" y="0" width="336" height="15" rx="7" fill="#0f172a" stroke="#1e293b" strokeWidth="1"/>
                <motion.rect x="-168" y="0" height="15" rx="7"
                  animate={{width:`${pct*3.36}px`}} transition={{type:'spring',stiffness:85,damping:14}}
                  fill={pct<35?'#3b82f6':pct>65?'#ef4444':'#a855f7'} opacity="0.9"/>
                <line x1="0" y1="0" x2="0" y2="15" stroke="white" strokeWidth="2" opacity="0.5"/>
                <text x="-162" y="12" fontSize="8" fill="#93c5fd" fontWeight="bold">{teamLeft.name}</text>
                <text x="162"  y="12" fontSize="8" fill="#fca5a5" fontWeight="bold" textAnchor="end">{teamRight.name}</text>
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

          {/* WIN */}
          {phase==='ended'&&(
            <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',stiffness:200}}
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
