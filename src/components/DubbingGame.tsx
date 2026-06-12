import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff, Volume2, ChevronRight, Star, RotateCcw, Film, CheckCircle } from 'lucide-react';
import { sound } from '../utils/audio';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DubLine {
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
  difficulty: 'beginner' | 'elementary' | 'advanced';
  genre: string;
  emoji: string;
  description: string;
  lines: DubLine[];
}

type AppPhase = 'select' | 'watch' | 'dub' | 'result';
type LinePhase = 'ready' | 'tts' | 'recording' | 'scored';

// ─── Scenes ───────────────────────────────────────────────────────────────────
// Big Buck Bunny: CC BY 3.0, Blender Foundation (youtu.be/YE7VzlLtp-4)
// Sintel: CC BY 3.0, Blender Foundation
const SCENES: DubScene[] = [
  {
    id: 'bbb-morning',
    title: 'Good Morning!',
    titleUz: 'Xayrli Tong!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 10,
    difficulty: 'beginner',
    genre: 'Multfilm · Blender',
    emoji: '🌅',
    description: 'Bunni chiroyli ertalabda uyg\'onadi',
    lines: [
      { speaker: 'Narrator', text: 'One beautiful morning, Bunny woke up in the garden.', uz: 'Bir chiroyli ertalab, Bunni bog\'da uyg\'ondi.', isUserLine: false },
      { speaker: 'Bunny', text: 'Oh! What a wonderful morning!', uz: 'Oh! Qanday ajoyib tong!', isUserLine: true },
      { speaker: 'Narrator', text: 'He stretched and smiled at the bright blue sky.', uz: 'U cho\'zilib, moviy osmonga kulimsirab qaradi.', isUserLine: false },
      { speaker: 'Bunny', text: 'I love this beautiful garden! Today will be perfect!', uz: 'Men bu chiroyli bog\'ni yaxshi ko\'raman! Bugun mukammal bo\'ladi!', isUserLine: true },
    ]
  },
  {
    id: 'bbb-butterfly',
    title: 'Beautiful Butterfly!',
    titleUz: 'Chiroyli Kapalak!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 55,
    difficulty: 'beginner',
    genre: 'Multfilm · Blender',
    emoji: '🦋',
    description: 'Bunni kapalak bilan uchrashadi',
    lines: [
      { speaker: 'Narrator', text: 'Bunny found a colorful butterfly near the flowers.', uz: 'Bunni gullar yonida rangli kapalak topdi.', isUserLine: false },
      { speaker: 'Bunny', text: 'Wow! Look at that beautiful butterfly!', uz: 'Voy! O\'sha chiroyli kapalakka qarang!', isUserLine: true },
      { speaker: 'Narrator', text: 'The butterfly danced slowly on a big flower.', uz: 'Kapalak katta gulda sekin raqs tushdi.', isUserLine: false },
      { speaker: 'Bunny', text: 'You are so pretty! Please be my friend today!', uz: 'Siz juda chiroylisiz! Iltimos, bugun mening do\'stim bo\'ling!', isUserLine: true },
    ]
  },
  {
    id: 'bbb-squirrels',
    title: 'Naughty Squirrels!',
    titleUz: 'Yovoyi Sincaplar!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 96,
    difficulty: 'elementary',
    genre: 'Sarguzasht · Blender',
    emoji: '🐿️',
    description: 'Yovoyi sincaplar muammo qilmoqchi',
    lines: [
      { speaker: 'Frank', text: 'Hey! Look at that big bunny over there!', uz: 'Hey! U yerda katta bunniga qara!', isUserLine: false },
      { speaker: 'Rinky', text: 'Ha ha! Let\'s go and bother him right now!', uz: 'Ha ha! Borib uni hoziroq bezovta qilaylik!', isUserLine: true },
      { speaker: 'Frank', text: 'Great idea! I will steal his big apple first!', uz: 'Ajoyib fikr! Avval uning katta olmasini o\'g\'irlayman!', isUserLine: false },
      { speaker: 'Rinky', text: 'Run fast! Before the bunny sees us coming!', uz: 'Tez yugur! Bunni bizni kelayotganimizni ko\'rmasidan!', isUserLine: true },
    ]
  },
  {
    id: 'bbb-angry',
    title: 'Bunny is Angry!',
    titleUz: 'Bunni G\'azablanadi!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 145,
    difficulty: 'elementary',
    genre: 'Drama · Blender',
    emoji: '😤',
    description: 'Sincaplar olmalarni o\'g\'irlaydi',
    lines: [
      { speaker: 'Narrator', text: 'Bunny saw the squirrels steal all his apples.', uz: 'Bunni sincaplarning barcha olmalarini o\'g\'irlashini ko\'rdi.', isUserLine: false },
      { speaker: 'Bunny', text: 'Hey! Those are MY apples! Give them back right now!', uz: 'Hey! Bular MENING olmalarim! Hozir qaytarib bering!', isUserLine: true },
      { speaker: 'Narrator', text: 'The naughty squirrels just laughed and ran away fast.', uz: 'Yovoyi sincaplar shunchaki kulishdi va tez qochib ketishdi.', isUserLine: false },
      { speaker: 'Bunny', text: 'I am so angry right now! I will make a clever plan!', uz: 'Men hozir juda g\'azablandim! Men aqlli reja tuzaman!', isUserLine: true },
    ]
  },
  {
    id: 'bbb-plan',
    title: "Bunny's Big Plan",
    titleUz: "Bunnining Katta Rejasi",
    youtubeId: 'YE7VzlLtp-4',
    startSec: 199,
    difficulty: 'elementary',
    genre: 'Komediya · Blender',
    emoji: '💡',
    description: 'Bunni sincaplarga tuzoq quradi',
    lines: [
      { speaker: 'Bunny', text: 'I have the perfect plan to stop those naughty squirrels!', uz: 'Men o\'sha yovoyi sincaplarni to\'xtatish uchun mukammal rejam bor!', isUserLine: true },
      { speaker: 'Narrator', text: 'Bunny quickly started building traps deep in the forest.', uz: 'Bunni tezda o\'rmonda chuqur tuzoqlar qurishni boshladi.', isUserLine: false },
      { speaker: 'Bunny', text: 'This trap is going to be perfect! They will never escape!', uz: 'Bu tuzoq mukammal bo\'ladi! Ular hech qachon qochib ketolmaydi!', isUserLine: true },
      { speaker: 'Narrator', text: 'After hours of hard work, Bunny stood up and smiled.', uz: 'Soatlab qattiq ishlashdan so\'ng, Bunni turib kulimsirab qo\'ydi.', isUserLine: false },
    ]
  },
  {
    id: 'bbb-victory',
    title: "Bunny's Victory!",
    titleUz: "Bunnining G'alabasi!",
    youtubeId: 'YE7VzlLtp-4',
    startSec: 365,
    difficulty: 'advanced',
    genre: 'Final · Blender',
    emoji: '🏆',
    description: 'Bunni g\'alaba qozonadi',
    lines: [
      { speaker: 'Narrator', text: 'The squirrels fell right into all three of Bunny\'s traps!', uz: 'Sincaplar Bunnining barcha uchta tuzoqlariga tushib ketdi!', isUserLine: false },
      { speaker: 'Bunny', text: 'Ha ha ha! I got you all! That was my plan from the beginning!', uz: 'Ha ha ha! Hammangiizni ushladim! Bu boshidanoyoq mening rejam edi!', isUserLine: true },
      { speaker: 'Squirrels', text: 'We are very sorry, Bunny! We will never steal again! We promise!', uz: 'Juda kechirasiz, Bunni! Biz hech qachon qayta o\'g\'irlamaymiz! Va\'da beramiz!', isUserLine: false },
      { speaker: 'Bunny', text: 'Okay, I forgive you all. But from now on, always be kind to others!', uz: 'Xo\'p, hammangiizni kechirdim. Lekin bundan keyin, doimo boshqalarga mehribon bo\'ling!', isUserLine: true },
    ]
  },
  {
    id: 'bbb-traps',
    title: 'Setting The Trap!',
    titleUz: 'Tuzoq O\'rnatildi!',
    youtubeId: 'YE7VzlLtp-4',
    startSec: 295,
    difficulty: 'advanced',
    genre: 'Aksiya · Blender',
    emoji: '🪤',
    description: 'Bunni tuzoqni faollashtiradi',
    lines: [
      { speaker: 'Bunny', text: 'Everything is ready now. I just need to wait patiently.', uz: 'Hamma narsa endi tayyor. Faqat sabr bilan kutishim kerak.', isUserLine: true },
      { speaker: 'Narrator', text: 'Bunny carefully hid behind a big old tree and waited quietly.', uz: 'Bunni ehtiyotkorlik bilan katta eski daraxt ortiga yashirinib, jimgina kutdi.', isUserLine: false },
      { speaker: 'Frank', text: 'Hey look! There are some delicious apples right over there!', uz: 'Hey qara! Tam u yerda juda mazali olmalar bor!', isUserLine: false },
      { speaker: 'Bunny', text: 'Come on, come closer! These apples are very delicious indeed!', uz: 'Keling, yaqinroq keling! Bu olmalar haqiqatan ham juda mazali!', isUserLine: true },
    ]
  },
  {
    id: 'sintel-brave',
    title: 'The Brave Journey',
    titleUz: 'Mard Sayohat',
    youtubeId: 'eRsGyueVLvQ',
    startSec: 25,
    difficulty: 'advanced',
    genre: 'Fantastika · Blender',
    emoji: '🌌',
    description: 'Sintel uzoq va xavfli sayohatga otlanadi',
    lines: [
      { speaker: 'Narrator', text: 'A young brave girl set out on a very long and dangerous journey.', uz: 'Yosh mard qiz juda uzoq va xavfli sayohatga yo\'l oldi.', isUserLine: false },
      { speaker: 'Sintel', text: 'I must be strong and brave. Nothing in this world will stop me!', uz: 'Men kuchli va mard bo\'lishim kerak. Dunyoda hech narsa meni to\'xtata olmaydi!', isUserLine: true },
      { speaker: 'Narrator', text: 'She crossed high mountains and dark forests without ever stopping.', uz: 'U hech qachon to\'xtamasdan baland tog\'lar va qorong\'u o\'rmonlarni kesib o\'tdi.', isUserLine: false },
      { speaker: 'Sintel', text: 'I will find what I am looking for, no matter what! I promise!', uz: 'Nima bo\'lishidan qat\'iy nazar, qidirayotgan narsani topaman! Va\'da beraman!', isUserLine: true },
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
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
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

function playTTS(text: string, rate = 0.82) {
  window.speechSynthesis?.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = rate;
  window.speechSynthesis?.speak(u);
}

const DIFF_STYLE = {
  beginner: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/50',
  elementary: 'text-amber-400 border-amber-500/40 bg-amber-950/50',
  advanced: 'text-rose-400 border-rose-500/40 bg-rose-950/50',
};
const DIFF_LABEL = { beginner: 'Oson', elementary: "O'rta", advanced: 'Murakkab' };

// ─── Component ───────────────────────────────────────────────────────────────
export default function DubbingGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<AppPhase>('select');
  const [scene, setScene] = useState<DubScene | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [linePhase, setLinePhase] = useState<LinePhase>('ready');
  const [spokenText, setSpokenText] = useState('');
  const [matches, setMatches] = useState<WM[]>([]);
  const [lineScore, setLineScore] = useState(0);
  const [scores, setScores] = useState<(number | null)[]>([]);
  const [noSpeech, setNoSpeech] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    recRef.current = null;
    window.speechSynthesis?.cancel();
  }, []);

  // Auto-TTS narrator lines when entering dub mode or advancing
  useEffect(() => {
    if (phase !== 'dub' || !scene) return;
    const line = scene.lines[lineIdx];
    if (!line || line.isUserLine) return;
    const t = setTimeout(() => {
      setLinePhase('tts');
      playTTS(line.text);
      const dur = Math.max(2200, line.text.length * 72);
      const t2 = setTimeout(() => setLinePhase('ready'), dur);
      return () => clearTimeout(t2);
    }, 250);
    return () => clearTimeout(t);
  }, [lineIdx, phase, scene]);

  const currentLine = scene?.lines[lineIdx] ?? null;
  const userScores = scores.filter((s): s is number => s !== null);
  const avgScore = userScores.length > 0 ? Math.round(userScores.reduce((a, b) => a + b, 0) / userScores.length) : 0;

  const startScene = (s: DubScene) => {
    window.speechSynthesis?.cancel();
    setScene(s);
    setPhase('watch');
    setLineIdx(0);
    setLinePhase('ready');
    setSpokenText('');
    setMatches([]);
    setScores(Array(s.lines.length).fill(null));
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
    const r = recRef.current;
    recRef.current = null;
    try { r?.stop(); } catch { /* ignore */ }
  }, []);

  const finishRec = useCallback((transcript: string) => {
    if (!recRef.current && linePhase !== 'recording') return;
    stopRec();
    if (!currentLine) return;
    const m = compareText(currentLine.text, transcript);
    const s = calcScore(m);
    setSpokenText(transcript);
    setMatches(m);
    setLineScore(s);
    setScores(prev => { const n = [...prev]; n[lineIdx] = s; return n; });
    setLinePhase('scored');
    if (s >= 85) sound.playCorrect();
    else if (s >= 50) sound.playTap();
    else sound.playIncorrect();
  }, [currentLine, lineIdx, linePhase, stopRec]);

  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setNoSpeech(true); finishRec(''); return; }
    setLinePhase('recording');
    setSpokenText('');
    setMatches([]);
    window.speechSynthesis?.cancel();

    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false;
    recRef.current = r;

    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0]?.[0]?.transcript || '';
      if (recRef.current === r) finishRec(t);
    };
    r.onerror = () => { if (recRef.current === r) finishRec(''); };
    r.onend = () => { if (recRef.current === r) finishRec(''); };

    try { r.start(); } catch { finishRec(''); return; }
    timerRef.current = setTimeout(() => { try { r.stop(); } catch { /* ignore */ } }, 7000);
  }, [finishRec]);

  const handleListen = useCallback(() => {
    if (!currentLine || linePhase === 'recording') return;
    setLinePhase('tts');
    playTTS(currentLine.text);
    const dur = Math.max(2000, currentLine.text.length * 72);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLinePhase('ready'), dur);
  }, [currentLine, linePhase]);

  const nextLine = useCallback(() => {
    if (!scene) return;
    window.speechSynthesis?.cancel();
    if (lineIdx < scene.lines.length - 1) {
      setLineIdx(i => i + 1);
      setLinePhase('ready');
      setSpokenText('');
      setMatches([]);
    } else {
      setPhase('result');
    }
  }, [scene, lineIdx]);

  // ── SELECT ────────────────────────────────────────────────────────────────
  if (phase === 'select') return (
    <div className="max-w-5xl mx-auto px-4 py-6 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">🎬 DUBLYAJ STUDIO</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Haqiqiy kinolarga o'z ovozingizni bering</p>
        </div>
        <div className="w-20" />
      </div>

      {/* Scene grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCENES.map(s => (
          <button key={s.id} onClick={() => startScene(s)}
            className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden transition-all cursor-pointer text-left active:scale-[0.97] shadow-lg hover:shadow-indigo-500/10">
            {/* Thumbnail */}
            <div className="relative bg-slate-800" style={{ paddingTop: '56.25%' }}>
              <img
                src={`https://img.youtube.com/vi/${s.youtubeId}/hqdefault.jpg`}
                alt={s.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Overlay badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
              <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black border ${DIFF_STYLE[s.difficulty]}`}>
                {DIFF_LABEL[s.difficulty]}
              </div>
              <div className="absolute bottom-1.5 left-1.5 text-xl" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))' }}>
                {s.emoji}
              </div>
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                  <Film className="w-4 h-4 text-slate-900" />
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="p-2.5">
              <h3 className="font-black text-white text-[11px] group-hover:text-indigo-300 transition-colors leading-tight line-clamp-1">{s.title}</h3>
              <p className="text-[8px] text-slate-500 mt-0.5 line-clamp-1">{s.description}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[8px] text-slate-600">{s.genre}</span>
                <span className="text-[8px] text-indigo-400 font-black">{s.lines.filter(l => l.isUserLine).length} gap 🎤</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (!scene) return null;

  const ytSrc = `https://www.youtube.com/embed/${scene.youtubeId}?start=${scene.startSec}&controls=1&rel=0&modestbranding=1&enablejsapi=1`;

  // ── WATCH ─────────────────────────────────────────────────────────────────
  if (phase === 'watch') return (
    <div className="max-w-3xl mx-auto px-4 py-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { window.speechSynthesis?.cancel(); setPhase('select'); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Sahnalar
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-black text-white">{scene.emoji} {scene.title}</p>
          <p className="text-[9px] text-slate-500">{scene.genre} · {DIFF_LABEL[scene.difficulty]}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* YouTube player */}
      <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800" style={{ paddingTop: '56.25%' }}>
        <iframe ref={iframeRef} src={ytSrc}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title={scene.title}
        />
      </div>

      {/* How it works tip */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: '👁️', label: 'Klipni ko\'ring', sub: 'Videoni to\'liq tomosha qiling' },
          { icon: '📖', label: 'Scriptni o\'qing', sub: 'Pastdagi dialogni o\'rganib oling' },
          { icon: '🎤', label: 'Ovoz bering', sub: 'O\'z ovozingizni yozib oling' },
        ].map((step, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-xl mb-1">{step.icon}</div>
            <p className="text-[9px] font-black text-white">{step.label}</p>
            <p className="text-[8px] text-slate-500 mt-0.5 leading-tight">{step.sub}</p>
          </div>
        ))}
      </div>

      {/* Script */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">📋 Dialog Scripti</p>
          <span className="text-[9px] text-indigo-400 font-black bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
            {scene.lines.filter(l => l.isUserLine).length} gap — SIZNIKI 🎤
          </span>
        </div>
        <div className="space-y-2">
          {scene.lines.map((l, i) => (
            <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
              l.isUserLine
                ? 'bg-indigo-950/40 border-indigo-500/40 shadow-sm shadow-indigo-500/5'
                : 'bg-slate-900/50 border-slate-800'
            }`}>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap ${
                l.isUserLine ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/30' : 'bg-slate-700/80 text-slate-400'
              }`}>
                {l.isUserLine ? '🎤 SIZ' : l.speaker}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold leading-snug ${l.isUserLine ? 'text-indigo-100' : 'text-slate-300'}`}>{l.text}</p>
                <p className="text-[9px] text-slate-500 italic mt-1">{l.uz}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button onClick={startDubbing}
        className="mt-5 w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase rounded-2xl cursor-pointer transition-all shadow-xl shadow-indigo-500/25 active:scale-[0.98] border border-indigo-500/40">
        <Film className="w-5 h-5" /> 🎬 Dublyaj Boshlash!
      </button>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const stars = avgScore >= 90 ? 3 : avgScore >= 65 ? 2 : avgScore >= 35 ? 1 : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center select-none">
        <div className="text-5xl mb-3">🎬</div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Dublyaj Tugadi!</h2>
        <p className="text-slate-400 text-sm mt-1">{scene.emoji} {scene.title}</p>

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map(n => (
            <Star key={n} className={`w-10 h-10 transition-all ${n <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
          ))}
        </div>

        <p className={`text-6xl font-black mt-4 ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
          {avgScore}%
        </p>
        <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-wide">O'rtacha aniqlik</p>

        <p className={`text-sm font-black mt-4 ${avgScore >= 90 ? 'text-emerald-400' : avgScore >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
          {avgScore >= 90 ? '🏆 Mukammal aktyor!' : avgScore >= 65 ? '🎬 Ajoyib dublyaj!' : avgScore >= 35 ? '📈 Yaxshi urinish, davom eting!' : '🔄 Yana bir bor urining!'}
        </p>

        {/* Per-line results */}
        <div className="mt-6 space-y-2 text-left">
          {scene.lines.map((l, i) => {
            const s = scores[i];
            if (!l.isUserLine) return (
              <div key={i} className="flex items-center gap-2.5 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[8px] text-slate-600 font-black uppercase bg-slate-800 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">{l.speaker}</span>
                <p className="text-[9px] text-slate-500 italic flex-1 line-clamp-1">{l.text}</p>
              </div>
            );
            return (
              <div key={i} className="flex items-center gap-2.5 bg-slate-900 border border-indigo-900/60 rounded-xl px-3 py-2">
                <span className="text-[8px] text-indigo-300 font-black uppercase bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full flex-shrink-0">🎤 SIZ</span>
                <p className="text-[9px] text-slate-300 flex-1 line-clamp-1">{l.text}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${(s ?? 0) >= 80 ? 'bg-emerald-500' : (s ?? 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s ?? 0}%` }} />
                  </div>
                  <span className={`text-xs font-black w-8 text-right ${(s ?? 0) >= 80 ? 'text-emerald-400' : (s ?? 0) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{s ?? 0}%</span>
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
          <button onClick={() => { window.speechSynthesis?.cancel(); setPhase('select'); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-500/20 border border-indigo-500/40">
            <Film className="w-4 h-4" /> Boshqa Sahna
          </button>
        </div>
        <button onClick={onBack} className="mt-4 text-xs text-slate-600 hover:text-slate-300 transition-all cursor-pointer uppercase font-bold tracking-wide">
          ← O'yinlarga Qaytish
        </button>
      </div>
    );
  }

  // ── DUB ──────────────────────────────────────────────────────────────────
  if (!currentLine) return null;

  const isNarrator = !currentLine.isUserLine;
  const userLinesTotal = scene.lines.filter(l => l.isUserLine).length;
  const userLinesDone = scores.filter((s, i) => s !== null && scene.lines[i].isUserLine).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => { stopRec(); window.speechSynthesis?.cancel(); setPhase('watch'); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Sahna
        </button>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-black uppercase">{scene.emoji} {scene.title}</p>
          <p className="text-xs font-bold text-white">
            Gap <span className="text-indigo-400">{lineIdx + 1}</span>/{scene.lines.length}
          </p>
        </div>
        <div className="text-right min-w-[48px]">
          {userScores.length > 0 && (
            <>
              <p className="text-[8px] text-slate-600 uppercase font-bold">Ball</p>
              <p className={`text-sm font-black ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{avgScore}%</p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((lineIdx + 1) / scene.lines.length) * 100}%` }} />
      </div>

      {/* YouTube player (compact) */}
      <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-xl mb-4 border border-slate-800/60" style={{ height: '180px' }}>
        <iframe ref={iframeRef} src={ytSrc}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title={scene.title}
        />
        {/* Score badge overlay */}
        {userScores.length > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400">{userLinesDone}/{userLinesTotal}</span>
          </div>
        )}
      </div>

      {/* Previous lines (context) */}
      {lineIdx > 0 && (
        <div className="mb-3 space-y-1">
          {scene.lines.slice(Math.max(0, lineIdx - 2), lineIdx).map((l, i) => (
            <div key={i} className="flex items-start gap-2 opacity-30">
              <span className="text-[8px] font-black text-slate-600 uppercase bg-slate-800/40 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 whitespace-nowrap">
                {l.isUserLine ? '🎤' : l.speaker}
              </span>
              <p className="text-[9px] text-slate-600 italic line-clamp-1">{l.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Current line card ── */}
      <div className={`rounded-2xl border p-4 transition-all duration-300 ${
        linePhase === 'recording'
          ? 'border-rose-500/70 bg-rose-950/25 shadow-lg shadow-rose-500/10'
          : linePhase === 'tts'
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : linePhase === 'scored' && lineScore >= 80
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : linePhase === 'scored'
                ? 'border-amber-500/40 bg-amber-950/10'
                : isNarrator
                  ? 'border-slate-700 bg-slate-900/70'
                  : 'border-indigo-500/50 bg-indigo-950/25 shadow-sm shadow-indigo-500/10'
      }`}>
        {/* Speaker tag */}
        <div className="flex items-center gap-2 mb-3">
          {isNarrator ? (
            <span className="px-2.5 py-1 bg-slate-700/80 text-slate-300 text-[9px] font-black uppercase rounded-full border border-slate-600/50">
              {currentLine.speaker}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-indigo-500/25 border border-indigo-500/50 text-indigo-300 text-[9px] font-black uppercase rounded-full">
              🎤 {currentLine.speaker} — Sizning navbatingiz!
            </span>
          )}
          {linePhase === 'tts' && (
            <span className="text-[9px] text-cyan-400 font-bold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              Aytilmoqda...
            </span>
          )}
          {linePhase === 'recording' && (
            <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1 animate-pulse">
              <span className="inline-block w-2 h-2 bg-rose-500 rounded-full" />
              Yozilmoqda...
            </span>
          )}
        </div>

        {/* Text display */}
        {linePhase === 'scored' && matches.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {matches.map((m, i) => (
              <span key={i} className={`text-sm font-black px-2 py-0.5 rounded-lg border ${
                m.match === 'exact' ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
                  : m.match === 'close' ? 'text-amber-300 border-amber-500/40 bg-amber-500/15'
                    : 'text-rose-300 border-rose-500/40 bg-rose-500/15'
              }`}>{m.word}</span>
            ))}
          </div>
        ) : (
          <p className={`text-base font-bold leading-snug mb-3 ${
            linePhase === 'tts' ? 'text-cyan-200'
              : linePhase === 'recording' ? 'text-rose-200'
                : isNarrator ? 'text-slate-200'
                  : 'text-indigo-100'
          }`}>{currentLine.text}</p>
        )}

        <p className="text-[10px] text-slate-400 italic">{currentLine.uz}</p>

        {/* Recording waveform */}
        {linePhase === 'recording' && (
          <div className="flex items-end gap-0.5 h-7 mt-3">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="flex-1 bg-rose-500 rounded-sm animate-pulse"
                style={{ height: `${8 + Math.abs(Math.sin(i * 0.6)) * 16}px`, animationDelay: `${i * 0.035}s` }} />
            ))}
          </div>
        )}

        {/* Spoken text feedback */}
        {spokenText && linePhase === 'scored' && (
          <div className="mt-3 px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl">
            <p className="text-[8px] text-slate-500 uppercase font-black mb-0.5">Eshitildi:</p>
            <p className="text-xs text-slate-400 italic">"{spokenText}"</p>
          </div>
        )}

        {/* Score bar */}
        {linePhase === 'scored' && currentLine.isUserLine && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex gap-3 text-[8px] font-bold uppercase">
                <span className="text-emerald-400">✅ To'g'ri</span>
                <span className="text-amber-400">〰️ Yaqin</span>
                <span className="text-rose-400">❌ Xato</span>
              </div>
              <span className={`text-lg font-black ${lineScore >= 80 ? 'text-emerald-400' : lineScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{lineScore}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                lineScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : lineScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`} style={{ width: `${lineScore}%` }} />
            </div>
          </div>
        )}

        {/* No speech support warning */}
        {noSpeech && (
          <p className="mt-2 text-[9px] text-amber-400 font-bold">⚠️ Brauzeringiz ovoz tanishni qo'llamaydi. Chrome yoki Edge ishlatib ko'ring.</p>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="mt-3 flex gap-2">
        {/* Listen button */}
        <button onClick={handleListen}
          disabled={linePhase === 'recording'}
          className={`flex items-center gap-1.5 px-4 py-3 rounded-xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
            linePhase === 'tts'
              ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/60 hover:text-cyan-300'
          }`}>
          <Volume2 className="w-3.5 h-3.5" />
          {linePhase === 'tts' ? 'Aytilmoqda...' : 'Eshit'}
        </button>

        {/* Record button (user lines only, not scored yet) */}
        {!isNarrator && linePhase !== 'scored' && (
          <button
            onClick={linePhase === 'recording'
              ? () => { stopRec(); }
              : startRec}
            disabled={linePhase === 'tts'}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
              linePhase === 'recording'
                ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/25 hover:border-rose-500/70'
            }`}>
            {linePhase === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {linePhase === 'recording' ? "To'xtatish ■" : '🎤 Ovoz Bering'}
          </button>
        )}

        {/* Next button */}
        {(linePhase === 'scored' || (isNarrator && linePhase === 'ready')) && (
          <button onClick={nextLine}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 font-black text-xs uppercase transition-all cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/20">
            {lineIdx < scene.lines.length - 1
              ? <><ChevronRight className="w-4 h-4" /> Keyingi</>
              : <><Film className="w-4 h-4" /> Natija</>}
          </button>
        )}

        {/* Skip (user line, ready state) */}
        {!isNarrator && linePhase === 'ready' && (
          <button onClick={nextLine}
            className="px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400 font-black text-[10px] uppercase transition-all cursor-pointer active:scale-95">
            O'tkazib
          </button>
        )}
      </div>

      {/* Retry button after scored */}
      {linePhase === 'scored' && !isNarrator && (
        <button onClick={() => { setLinePhase('ready'); setSpokenText(''); setMatches([]); setScores(prev => { const n = [...prev]; n[lineIdx] = null; return n; }); }}
          className="mt-2 w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-all cursor-pointer font-bold uppercase tracking-wide">
          ↩ Bu gapni qayta yozing
        </button>
      )}

      {/* Dot progress */}
      <div className="flex justify-center gap-1.5 mt-4">
        {scene.lines.map((l, i) => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === lineIdx ? 'w-6 h-1.5 bg-indigo-500'
              : scores[i] !== null
                ? `w-3 h-1.5 ${scores[i]! >= 80 ? 'bg-emerald-500' : scores[i]! >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`
                : i < lineIdx ? 'w-3 h-1.5 bg-slate-600' : 'w-3 h-1.5 bg-slate-800'
          }`} />
        ))}
      </div>
    </div>
  );
}
