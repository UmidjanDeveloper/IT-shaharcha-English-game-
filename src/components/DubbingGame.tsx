import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, ChevronRight, Star, RotateCcw, Film, Play } from 'lucide-react';
import { sound } from '../utils/audio';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DubLine {
  id: string;
  speaker: string;
  text: string;
  uz: string;
  isUserLine: boolean;
}

interface DubScene {
  id: string;
  title: string;
  titleUz: string;
  youtubeId: string;
  startSec: number;
  endSec: number;
  difficulty: 'beginner' | 'elementary' | 'advanced';
  genre: string;
  emoji: string;
  lines: DubLine[];
}

type AppPhase = 'select' | 'watch' | 'dub' | 'result';
type LinePhase = 'tts' | 'ready' | 'recording' | 'scored';

// ─── Scenes (Big Buck Bunny – CC BY, Blender Foundation) ─────────────────────
const SCENES: DubScene[] = [
  {
    id: 'bbb-morning',
    title: 'Good Morning, Bunny!',
    titleUz: 'Xayrli Tong, Bunni!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 10, endSec: 55,
    difficulty: 'beginner', genre: '🐰 Multfilm', emoji: '🌅',
    lines: [
      { id:'l1', speaker:'Narrator', text:'One beautiful morning, Bunny woke up.', uz:'Bir chiroyli ertalab, Bunni uyg\'ondi.', isUserLine:false },
      { id:'l2', speaker:'Bunny', text:'Oh! What a wonderful morning!', uz:'Oh! Qanday ajoyib tong!', isUserLine:true },
      { id:'l3', speaker:'Narrator', text:'He stretched and looked at the sky.', uz:'U cho\'zilib osmonga qaradi.', isUserLine:false },
      { id:'l4', speaker:'Bunny', text:'I love this beautiful garden! Today is perfect!', uz:'Men bu chiroyli bog\'ni yaxshi ko\'raman! Bugun mukammal!', isUserLine:true },
    ]
  },
  {
    id: 'bbb-butterfly',
    title: 'The Beautiful Butterfly',
    titleUz: 'Chiroyli Kapalak',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 55, endSec: 95,
    difficulty: 'beginner', genre: '🦋 Multfilm', emoji: '🦋',
    lines: [
      { id:'l1', speaker:'Narrator', text:'Bunny found a colorful butterfly in the garden.', uz:'Bunni bog\'da rangli kapalak topdi.', isUserLine:false },
      { id:'l2', speaker:'Bunny', text:'Wow! Look at that beautiful butterfly!', uz:'Voy! O\'sha chiroyli kapalakka qarang!', isUserLine:true },
      { id:'l3', speaker:'Narrator', text:'The butterfly danced on a flower.', uz:'Kapalak gulda raqs tushdi.', isUserLine:false },
      { id:'l4', speaker:'Bunny', text:'You are so beautiful! Please be my friend!', uz:'Siz juda chiroylisiz! Iltimos, do\'stim bo\'ling!', isUserLine:true },
    ]
  },
  {
    id: 'bbb-squirrels',
    title: 'The Naughty Squirrels',
    titleUz: 'Yovoyi Sincaplar',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 96, endSec: 145,
    difficulty: 'elementary', genre: '🐿️ Sarguzasht', emoji: '⚡',
    lines: [
      { id:'l1', speaker:'Frank', text:'Hey! Look at that big bunny over there!', uz:'Hey! U yerda katta bunniga qara!', isUserLine:false },
      { id:'l2', speaker:'Rinky', text:'Ha ha! Let\'s go and bother him today!', uz:'Ha ha! Borib uni bugun bezovta qilaylik!', isUserLine:true },
      { id:'l3', speaker:'Frank', text:'Good idea! Let\'s steal his apples!', uz:'Yaxshi fikr! Uning olmalarini o\'g\'irlab olaylik!', isUserLine:false },
      { id:'l4', speaker:'Rinky', text:'Run fast! Before the bunny sees us!', uz:'Tez yugur! Bunni bizni ko\'rmasidan oldin!', isUserLine:true },
    ]
  },
  {
    id: 'bbb-angry',
    title: 'Bunny Gets Angry',
    titleUz: 'Bunni G\'azablanadi',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 145, endSec: 198,
    difficulty: 'elementary', genre: '😤 Drama', emoji: '😤',
    lines: [
      { id:'l1', speaker:'Narrator', text:'Bunny watched the squirrels steal his apples.', uz:'Bunni sincaplarning olmalarini o\'g\'irlashini kuzatdi.', isUserLine:false },
      { id:'l2', speaker:'Bunny', text:'Hey! Those are MY apples! Give them back now!', uz:'Hey! Bular MENING olmalarim! Hozir qaytarib bering!', isUserLine:true },
      { id:'l3', speaker:'Narrator', text:'The squirrels just laughed and ran away.', uz:'Sincaplar shunchaki kulishdi va qochib ketishdi.', isUserLine:false },
      { id:'l4', speaker:'Bunny', text:'I am so angry! I will teach them a lesson!', uz:'Men juda g\'azablandim! Ularni saboq beraman!', isUserLine:true },
    ]
  },
  {
    id: 'bbb-plan',
    title: "Bunny's Big Plan",
    titleUz: "Bunnining Katta Rejasi",
    youtubeId: 'YE7VzlLtp-4',
    startSec: 199, endSec: 248,
    difficulty: 'elementary', genre: '🧠 Komediya', emoji: '💡',
    lines: [
      { id:'l1', speaker:'Bunny', text:'I have a great plan to stop those squirrels!', uz:'Men o\'sha sincaplarni to\'xtatish uchun ajoyib rejam bor!', isUserLine:true },
      { id:'l2', speaker:'Narrator', text:'Bunny started building traps in the forest.', uz:'Bunni o\'rmonda tuzoqlar qurishni boshladi.', isUserLine:false },
      { id:'l3', speaker:'Bunny', text:'This trap will be perfect! They will never escape!', uz:'Bu tuzoq mukammal bo\'ladi! Ular hech qachon qochib ketolmaydi!', isUserLine:true },
      { id:'l4', speaker:'Narrator', text:'After hours of hard work, Bunny smiled.', uz:'Soatlab qattiq ishlashdan so\'ng, Bunni kulib qo\'ydi.', isUserLine:false },
    ]
  },
  {
    id: 'bbb-traps',
    title: 'The Trap is Set!',
    titleUz: 'Tuzoq Qurildi!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 295, endSec: 345,
    difficulty: 'advanced', genre: '🎭 Aksiya', emoji: '🪤',
    lines: [
      { id:'l1', speaker:'Bunny', text:'Everything is ready. Now I just need to wait.', uz:'Hamma narsa tayyor. Endi faqat kutishim kerak.', isUserLine:true },
      { id:'l2', speaker:'Narrator', text:'Bunny hid behind a big tree and watched.', uz:'Bunni katta daraxt ortiga yashirinib, kuzatdi.', isUserLine:false },
      { id:'l3', speaker:'Frank', text:'Look! There are some lovely apples right there!', uz:'Qara! Tam u yerda ajoyib olmalar bor!', isUserLine:false },
      { id:'l4', speaker:'Bunny', text:'Yes, come closer! The apples are very delicious!', uz:'Ha, yaqinroq keling! Olmalar juda mazali!', isUserLine:true },
    ]
  },
  {
    id: 'bbb-victory',
    title: "Bunny's Victory!",
    titleUz: "Bunnining G'alabasi!",
    youtubeId: 'YE7VzlLtp-4',
    startSec: 365, endSec: 420,
    difficulty: 'advanced', genre: '🏆 Final', emoji: '🎉',
    lines: [
      { id:'l1', speaker:'Narrator', text:'The squirrels fell right into the traps!', uz:'Sincaplar tuzoqlarga tushib ketdi!', isUserLine:false },
      { id:'l2', speaker:'Bunny', text:'Ha ha ha! I got you! That was my plan all along!', uz:'Ha ha ha! Ushladim! Bu boshidanoyoq mening rejam edi!', isUserLine:true },
      { id:'l3', speaker:'Squirrels', text:'We are sorry, Bunny! We will never do it again!', uz:'Kechirasiz, Bunni! Biz buni hech qachon qayta qilmaymiz!', isUserLine:false },
      { id:'l4', speaker:'Bunny', text:'Okay, I forgive you. But always be kind to others!', uz:'Xo\'p, sizni kechirdim. Lekin doimo boshqalarga mehribon bo\'ling!', isUserLine:true },
    ]
  },
  {
    id: 'sintel-brave',
    title: 'The Brave Journey',
    titleUz: 'Mard Sayohat',
    youtubeId: 'eRsGyueVLvQ',
    startSec: 25, endSec: 75,
    difficulty: 'advanced', genre: '⚔️ Fantastika', emoji: '🌌',
    lines: [
      { id:'l1', speaker:'Narrator', text:'A brave girl set out on a long and dangerous journey.', uz:'Mard qiz uzoq va xavfli sayohatga yo\'l oldi.', isUserLine:false },
      { id:'l2', speaker:'Sintel', text:'I must be strong. Nothing will stop me from my goal!', uz:'Men kuchli bo\'lishim kerak. Hech narsa meni maqsadimdan to\'xtata olmaydi!', isUserLine:true },
      { id:'l3', speaker:'Narrator', text:'She crossed mountains and forests without stopping.', uz:'U to\'xtamasdan tog\'lar va o\'rmonlarni kesib o\'tdi.', isUserLine:false },
      { id:'l4', speaker:'Sintel', text:'I will find what I am looking for. I promise!', uz:'Men qidirayotgan narsani topaman. Va\'da beraman!', isUserLine:true },
    ]
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

type WM = { word: string; match: 'exact' | 'close' | 'miss' };

function compareText(target: string, spoken: string): WM[] {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z\s']/g, '').trim();
  const tw = clean(target).split(/\s+/).filter(Boolean);
  const sw = clean(spoken).split(/\s+/).filter(Boolean);
  return tw.map(t =>
    sw.some(s => s === t) ? { word: t, match: 'exact' as const }
    : sw.some(s => levenshtein(t, s) <= 1) ? { word: t, match: 'close' as const }
    : { word: t, match: 'miss' as const }
  );
}

function calcScore(m: WM[]): number {
  if (!m.length) return 0;
  return Math.round(m.reduce((a, x) => a + (x.match === 'exact' ? 2 : x.match === 'close' ? 1 : 0), 0) / (m.length * 2) * 100);
}

function playTTS(text: string, rate = 0.85) {
  window.speechSynthesis?.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = rate;
  window.speechSynthesis?.speak(u);
}

function ytCmd(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}

const DIFF_STYLE = {
  beginner: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  elementary: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  advanced: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
};
const DIFF_LABEL = { beginner: 'Oson', elementary: "O'rta", advanced: 'Murakkab' };

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onBack: () => void; }

export default function DubbingGame({ onBack }: Props) {
  const [phase, setPhase] = useState<AppPhase>('select');
  const [scene, setScene] = useState<DubScene | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [linePhase, setLinePhase] = useState<LinePhase>('ready');
  const [spokenText, setSpokenText] = useState('');
  const [matches, setMatches] = useState<WM[]>([]);
  const [lineScore, setLineScore] = useState(0);
  const [allScores, setAllScores] = useState<(number | null)[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { recRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }, []);

  const currentLine = scene?.lines[lineIdx] ?? null;

  const userLineScores = allScores.filter((s): s is number => s !== null);
  const avgScore = userLineScores.length > 0
    ? Math.round(userLineScores.reduce((a, b) => a + b, 0) / userLineScores.length)
    : 0;

  const startScene = (s: DubScene) => {
    setScene(s);
    setPhase('watch');
    setLineIdx(0);
    setLinePhase('ready');
    setSpokenText('');
    setMatches([]);
    setAllScores(Array(s.lines.length).fill(null));
    sound.playTap();
  };

  const startDubbing = () => {
    setPhase('dub');
    setLineIdx(0);
    setLinePhase('ready');
    setSpokenText('');
    setMatches([]);
  };

  const stopRec = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
  }, []);

  const finishRec = useCallback((transcript: string) => {
    stopRec();
    if (!currentLine) return;
    const m = compareText(currentLine.text, transcript);
    const s = calcScore(m);
    setSpokenText(transcript);
    setMatches(m);
    setLineScore(s);
    setAllScores(prev => { const n = [...prev]; n[lineIdx] = s; return n; });
    setLinePhase('scored');
    if (s >= 85) sound.playCorrect();
    else if (s >= 50) sound.playTap();
    else sound.playIncorrect();
  }, [currentLine, lineIdx, stopRec]);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { finishRec(''); return; }
    setLinePhase('recording');
    window.speechSynthesis?.cancel();
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    recRef.current = r;
    r.onresult = (e: SpeechRecognitionEvent) => finishRec(e.results[0]?.[0]?.transcript || '');
    r.onerror = () => finishRec('');
    r.onend = () => { if (recRef.current) finishRec(''); };
    try { r.start(); } catch { finishRec(''); return; }
    timerRef.current = setTimeout(() => { try { r.stop(); } catch {} }, 7000);
  }, [finishRec]);

  const nextLine = useCallback(() => {
    if (!scene) return;
    if (lineIdx < scene.lines.length - 1) {
      setLineIdx(i => i + 1);
      setLinePhase('ready');
      setSpokenText('');
      setMatches([]);
    } else {
      setPhase('result');
    }
  }, [scene, lineIdx]);

  const handleListen = () => {
    if (!currentLine) return;
    setLinePhase('tts');
    playTTS(currentLine.text);
    const dur = Math.max(1800, currentLine.text.length * 75);
    setTimeout(() => setLinePhase('ready'), dur);
  };

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (phase === 'select') return (
    <div className="max-w-5xl mx-auto px-4 py-6 select-none">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> O'yinlarga
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">🎬 DUBLYAJ STUDIO</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Haqiqiy kinolarga o'z ovozingizni bering</p>
        </div>
        <div className="w-24" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCENES.map(s => {
          const thumb = `https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg`;
          return (
            <button key={s.id} onClick={() => startScene(s)}
              className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all cursor-pointer text-left shadow-xl hover:shadow-indigo-500/10 active:scale-[0.97]">
              <div className="relative overflow-hidden bg-slate-800" style={{ paddingTop: '56.25%' }}>
                <img src={thumb} alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm rounded-md text-[8px] font-black text-white">
                  {s.genre}
                </div>
                <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black border ${DIFF_STYLE[s.difficulty]}`}>
                  {DIFF_LABEL[s.difficulty]}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                    <Play className="w-4 h-4 text-slate-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-1.5 right-1.5 text-xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>
                  {s.emoji}
                </div>
              </div>
              <div className="p-2.5">
                <h3 className="font-black text-white text-[11px] group-hover:text-indigo-300 transition-colors leading-tight">{s.title}</h3>
                <p className="text-[8px] text-slate-500 mt-0.5 italic truncate">{s.titleUz}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[8px] text-slate-600 font-bold">{s.endSec - s.startSec}s klip</span>
                  <span className="text-[8px] text-indigo-400 font-black">{s.lines.filter(l => l.isUserLine).length} gap siz</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!scene) return null;

  const ytSrc = `https://www.youtube.com/embed/${scene.youtubeId}?start=${scene.startSec}&end=${scene.endSec}&autoplay=0&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`;

  // ── WATCH ─────────────────────────────────────────────────────────────────
  if (phase === 'watch') return (
    <div className="max-w-3xl mx-auto px-4 py-4 select-none">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setPhase('select')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Sahnalar
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs font-black text-white">{scene.title}</p>
          <p className="text-[9px] text-slate-500">{scene.genre} · {DIFF_LABEL[scene.difficulty]}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* YouTube player */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingTop: '56.25%' }}>
        <iframe
          ref={iframeRef}
          src={ytSrc}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={scene.title}
        />
      </div>

      <div className="mt-3 px-4 py-2 bg-indigo-950/40 border border-indigo-500/20 rounded-xl">
        <p className="text-[10px] text-indigo-300 font-bold text-center">
          👁️ Avval klipni ko'ring va pastdagi scriptni o'qing. Keyin dublyaj boshlang!
        </p>
      </div>

      {/* Script */}
      <div className="mt-4 space-y-2">
        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">📋 Dialog scripti</p>
        {scene.lines.map((l, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
            l.isUserLine ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-slate-900/50 border-slate-800'
          }`}>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap ${
              l.isUserLine ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-700 text-slate-400'
            }`}>{l.isUserLine ? '🎤 SIZ' : l.speaker}</span>
            <div className="min-w-0">
              <p className={`text-xs font-bold ${l.isUserLine ? 'text-indigo-100' : 'text-slate-300'}`}>{l.text}</p>
              <p className="text-[9px] text-slate-500 italic mt-0.5">{l.uz}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={startDubbing}
        className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase rounded-2xl cursor-pointer transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]">
        <Film className="w-5 h-5" /> 🎬 Dublyaj Boshlash!
      </button>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const stars = avgScore >= 90 ? 3 : avgScore >= 65 ? 2 : avgScore >= 35 ? 1 : 0;
    return (
      <div className="max-w-xl mx-auto px-4 py-8 text-center select-none">
        <Film className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h2 className="text-2xl font-black text-white uppercase">Dublyaj Tugadi!</h2>
        <p className="text-slate-400 text-sm mt-1">"{scene.title}"</p>

        <div className="flex justify-center gap-2 mt-5">
          {[1, 2, 3].map(n => (
            <Star key={n} className={`w-10 h-10 ${n <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
          ))}
        </div>

        <p className={`text-5xl font-black mt-4 ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
          {avgScore}%
        </p>
        <p className="text-slate-500 text-xs mt-1">O'rtacha aniqlik (sizning gaplar)</p>
        <p className={`text-sm font-black mt-3 ${avgScore >= 90 ? 'text-emerald-400' : avgScore >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
          {avgScore >= 90 ? '🏆 Mukammal aktyor!' : avgScore >= 65 ? '🎬 Yaxshi dublyaj!' : avgScore >= 35 ? '📈 Mashq qiling!' : '🔄 Yana bir bor urining!'}
        </p>

        <div className="mt-6 space-y-2 text-left">
          {scene.lines.map((l, i) => {
            const s = allScores[i];
            if (!l.isUserLine) return (
              <div key={i} className="flex items-center gap-2.5 bg-slate-900/50 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[8px] text-slate-500 font-black uppercase bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0">{l.speaker}</span>
                <p className="text-[9px] text-slate-500 italic flex-1 truncate">{l.text}</p>
              </div>
            );
            return (
              <div key={i} className="flex items-center gap-2.5 bg-slate-900 border border-indigo-800/40 rounded-xl p-2.5">
                <span className="text-[8px] text-indigo-400 font-black uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full flex-shrink-0">SIZ</span>
                <p className="text-[9px] text-slate-300 flex-1 truncate">{l.text}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(s ?? 0) >= 80 ? 'bg-emerald-500' : (s ?? 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${s ?? 0}%` }} />
                  </div>
                  <span className={`text-xs font-black ${(s ?? 0) >= 80 ? 'text-emerald-400' : (s ?? 0) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{s ?? 0}%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => startScene(scene)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-black text-xs uppercase rounded-2xl cursor-pointer transition-all active:scale-95">
            <RotateCcw className="w-4 h-4" /> Qayta
          </button>
          <button onClick={() => setPhase('select')}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
            <Film className="w-4 h-4" /> Boshqa sahna
          </button>
        </div>
        <button onClick={onBack} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-all cursor-pointer">
          O'yinlarga qaytish
        </button>
      </div>
    );
  }

  // ── DUB ──────────────────────────────────────────────────────────────────
  if (!currentLine) return null;

  const userLinesSoFar = scene.lines.slice(0, lineIdx + 1).filter(l => l.isUserLine).length;
  const totalUserLines = scene.lines.filter(l => l.isUserLine).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => { stopRec(); window.speechSynthesis?.cancel(); setPhase('watch'); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Sahna
        </button>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-black uppercase truncate max-w-[150px]">{scene.title}</p>
          <p className="text-xs font-bold text-white">
            {currentLine.isUserLine ? `Sizning gap ${userLinesSoFar}/${totalUserLines}` : `Gap ${lineIdx + 1}/${scene.lines.length}`}
          </p>
        </div>
        {userLineScores.length > 0 ? (
          <div className="text-right">
            <p className="text-[9px] text-slate-500">O'rtacha</p>
            <p className={`text-sm font-black ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{avgScore}%</p>
          </div>
        ) : <div className="w-16" />}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((lineIdx + 1) / scene.lines.length) * 100}%` }} />
      </div>

      {/* YouTube player (compact) */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-xl mb-4" style={{ paddingTop: '38%' }}>
        <iframe
          ref={iframeRef}
          src={ytSrc}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={scene.title}
        />
      </div>

      {/* Previous lines context */}
      {lineIdx > 0 && (
        <div className="mb-3 space-y-1">
          {scene.lines.slice(Math.max(0, lineIdx - 2), lineIdx).map((l, i) => (
            <div key={i} className="flex items-center gap-2 opacity-35">
              <span className="text-[8px] text-slate-600 font-black uppercase bg-slate-800/50 px-1.5 py-0.5 rounded flex-shrink-0">{l.speaker}</span>
              <p className="text-[9px] text-slate-500 italic truncate">{l.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Current line card */}
      <div className={`rounded-2xl border p-4 space-y-3 transition-all duration-300 ${
        linePhase === 'recording' ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-500/10' :
        linePhase === 'tts' ? 'border-cyan-500/40 bg-cyan-950/20' :
        linePhase === 'scored' && lineScore >= 80 ? 'border-emerald-500/40 bg-emerald-950/20' :
        linePhase === 'scored' ? 'border-amber-500/30 bg-slate-900/60' :
        currentLine.isUserLine ? 'border-indigo-500/40 bg-indigo-950/20' :
        'border-slate-800 bg-slate-900/60'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {currentLine.isUserLine ? (
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase rounded-full">
              🎤 {currentLine.speaker} — Sizning navbatingiz!
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase rounded-full">
              {currentLine.speaker}
            </span>
          )}
        </div>

        {linePhase === 'scored' && matches.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {matches.map((m, i) => (
              <span key={i} className={`text-sm font-black px-2 py-0.5 rounded-lg border ${
                m.match === 'exact' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                m.match === 'close' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                'text-rose-400 border-rose-500/30 bg-rose-500/10'
              }`}>{m.word}</span>
            ))}
          </div>
        ) : (
          <p className={`text-base font-black leading-snug ${
            linePhase === 'recording' ? 'text-rose-200' :
            linePhase === 'tts' ? 'text-cyan-300' :
            currentLine.isUserLine ? 'text-indigo-100' : 'text-slate-300'
          }`}>{currentLine.text}</p>
        )}

        <p className="text-xs text-slate-400 italic">{currentLine.uz}</p>

        {linePhase === 'recording' && (
          <div className="flex items-end gap-0.5 h-8">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="flex-1 bg-rose-500 rounded-full animate-pulse"
                style={{ height: `${10 + Math.abs(Math.sin(i * 0.7)) * 18}px`, animationDelay: `${i * 0.04}s` }} />
            ))}
          </div>
        )}

        {linePhase === 'tts' && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-2 bg-cyan-500 rounded-full animate-bounce"
                style={{ height: `${12 + i * 3}px`, animationDelay: `${i * 0.08}s` }} />
            ))}
            <span className="text-[10px] text-cyan-400 font-bold ml-1">Aytilmoqda...</span>
          </div>
        )}

        {spokenText && linePhase === 'scored' && (
          <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase font-black mb-0.5">Eshitildi:</p>
            <p className="text-xs text-slate-300 italic">"{spokenText}"</p>
          </div>
        )}

        {linePhase === 'scored' && currentLine.isUserLine && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-[9px] font-bold uppercase">
                <span className="text-emerald-400">✅ To'g'ri</span>
                <span className="text-amber-400">〰️ Yaqin</span>
                <span className="text-rose-400">❌ Xato</span>
              </div>
              <span className={`text-xl font-black ${lineScore >= 80 ? 'text-emerald-400' : lineScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{lineScore}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                lineScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                lineScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`} style={{ width: `${lineScore}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <button onClick={handleListen} disabled={linePhase === 'recording'}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
            linePhase === 'tts'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse'
              : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
          }`}>
          <Volume2 className="w-3.5 h-3.5" />
          {linePhase === 'tts' ? 'Aytilmoqda...' : 'Eshit'}
        </button>

        {currentLine.isUserLine && linePhase !== 'scored' && (
          <button
            onClick={linePhase === 'recording' ? () => { stopRec(); finishRec(''); } : startRec}
            disabled={linePhase === 'tts'}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
              linePhase === 'recording'
                ? 'bg-rose-500 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500'
            }`}>
            {linePhase === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {linePhase === 'recording' ? "To'xtatish ■" : '🎤 Ovoz Bering'}
          </button>
        )}

        {(linePhase === 'scored' || (!currentLine.isUserLine && linePhase === 'ready')) && (
          <button onClick={nextLine}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400 font-black text-xs uppercase transition-all cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/20">
            {lineIdx < scene.lines.length - 1
              ? <><ChevronRight className="w-4 h-4" /> Keyingi</>
              : <><Play className="w-4 h-4" /> Natija</>}
          </button>
        )}

        {currentLine.isUserLine && linePhase === 'ready' && (
          <button onClick={nextLine}
            className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-slate-500 hover:border-slate-600 font-black text-[10px] uppercase transition-all cursor-pointer active:scale-95">
            O'tkazib
          </button>
        )}
      </div>

      {/* Line dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {scene.lines.map((l, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i === lineIdx ? 'w-6 bg-indigo-500' :
            allScores[i] !== null ? (allScores[i]! >= 80 ? 'w-3 bg-emerald-500' : allScores[i]! >= 50 ? 'w-3 bg-amber-500' : 'w-3 bg-rose-500') :
            i < lineIdx ? 'w-3 bg-slate-600' :
            'w-3 bg-slate-800'
          }`} />
        ))}
      </div>
    </div>
  );
}
