import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, ChevronRight, ChevronLeft, Star, RotateCcw, ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { sound } from '../utils/audio';

// ─── Typings for Web Speech API ───
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ShadowExercise {
  id: string;
  en: string;
  uz: string;
  category: 'greetings' | 'school' | 'daily' | 'tech' | 'food';
  difficulty: 'beginner' | 'elementary' | 'advanced';
  tip?: string;
}

type ShadowPhase = 'ready' | 'listening' | 'recording' | 'result';
type ShadowCategory = 'all' | 'greetings' | 'school' | 'daily' | 'tech' | 'food';
type ShadowDifficulty = 'beginner' | 'elementary' | 'advanced';

// ─── Exercises ───────────────────────────────────────────────────────────────
const EXERCISES: ShadowExercise[] = [
  // ── Greetings (beginner)
  { id:'g1', en:'Hello!', uz:'Salom!', category:'greetings', difficulty:'beginner', tip:'"H" tovushini aniq aytib boshlang' },
  { id:'g2', en:'Good morning.', uz:'Xayrli tong.', category:'greetings', difficulty:'beginner', tip:'"Good" = "GUD" deb o\'qiladi' },
  { id:'g3', en:'How are you?', uz:'Qandaysiz?', category:'greetings', difficulty:'beginner', tip:'"are" = "ar" deb o\'qiladi' },
  { id:'g4', en:'Fine, thank you.', uz:'Yaxshi, rahmat.', category:'greetings', difficulty:'beginner', tip:'"thank" = "thengk" — "th" tish orqali' },
  { id:'g5', en:'See you later!', uz:'Ko\'rishguncha!', category:'greetings', difficulty:'beginner' },
  { id:'g6', en:'My name is...', uz:'Mening ismim...', category:'greetings', difficulty:'beginner', tip:'"name" = "NEYM" deb o\'qiladi' },
  { id:'g7', en:'Thank you very much!', uz:'Juda ko\'p rahmat!', category:'greetings', difficulty:'beginner' },
  { id:'g8', en:'You are welcome.', uz:'Iltimos, marhamat.', category:'greetings', difficulty:'beginner', tip:'"welcome" = "WELKIM" deb o\'qiladi' },
  // ── Greetings (elementary)
  { id:'g9', en:'Nice to meet you.', uz:'Tanishganimdan xursandman.', category:'greetings', difficulty:'elementary', tip:'"Nice" = "NAYS" deb o\'qiladi' },
  { id:'g10', en:'Good night, sleep well.', uz:'Xayrli tun, yaxshi uxlang.', category:'greetings', difficulty:'elementary' },
  { id:'g11', en:'It\'s nice to see you again.', uz:'Sizni yana ko\'rganimdan xursandman.', category:'greetings', difficulty:'elementary' },
  { id:'g12', en:'How was your weekend?', uz:'Dam olish kuningiz qanday o\'tdi?', category:'greetings', difficulty:'elementary', tip:'"weekend" bosimi birinchi bo\'g\'inda' },

  // ── School (beginner)
  { id:'s1', en:'Open your book.', uz:'Kitobingizni oching.', category:'school', difficulty:'beginner', tip:'"Open" = "OPIN" deb o\'qiladi' },
  { id:'s2', en:'Please sit down.', uz:'Iltimos, o\'tiring.', category:'school', difficulty:'beginner' },
  { id:'s3', en:'Listen and repeat.', uz:'Eshiting va takrorlang.', category:'school', difficulty:'beginner' },
  { id:'s4', en:'I have a question.', uz:'Menda savol bor.', category:'school', difficulty:'beginner' },
  { id:'s5', en:'I am a student.', uz:'Men o\'quvchiman.', category:'school', difficulty:'beginner' },
  { id:'s6', en:'One, two, three, go!', uz:'Bir, ikki, uch, yo\'l!', category:'school', difficulty:'beginner' },
  // ── School (elementary)
  { id:'s7', en:'Can you repeat that?', uz:'Takrorlaysizmi?', category:'school', difficulty:'elementary' },
  { id:'s8', en:'I don\'t understand.', uz:'Tushunmadim.', category:'school', difficulty:'elementary', tip:'"understand" = "UNDIRSTEND" deb o\'qiladi' },
  { id:'s9', en:'What does this word mean?', uz:'Bu so\'z nima degan ma\'no anglatadi?', category:'school', difficulty:'elementary' },
  { id:'s10', en:'How do you spell that?', uz:'Uni qanday harflab yozasiz?', category:'school', difficulty:'elementary', tip:'"spell" = "SPEL" deb o\'qiladi' },
  { id:'s11', en:'Can I go to the board?', uz:'Doskaga chiqsam bo\'ladimi?', category:'school', difficulty:'elementary' },
  // ── School (advanced)
  { id:'s12', en:'Learning English opens many opportunities.', uz:'Ingliz tilini o\'rganish ko\'plab imkoniyatlar ochadi.', category:'school', difficulty:'advanced', tip:'"opportunities" = "OPIRTUNITIZ" deb o\'qiladi' },
  { id:'s13', en:'Could you please explain that again more slowly?', uz:'Iltimos, buni yana sekinroq tushuntirib bera olasizmi?', category:'school', difficulty:'advanced' },
  { id:'s14', en:'I have been studying English for three years.', uz:'Men uch yildan beri ingliz tilini o\'rganyapman.', category:'school', difficulty:'advanced', tip:'"have been" — Present Perfect Continuous zamonini bildiradi' },
  { id:'s15', en:'The students were excited about the new project.', uz:'O\'quvchilar yangi loyiha haqida hayajonlangan edi.', category:'school', difficulty:'advanced' },

  // ── Daily life (beginner)
  { id:'d1', en:'What time is it?', uz:'Soat necha?', category:'daily', difficulty:'beginner' },
  { id:'d2', en:'I\'m hungry.', uz:'Qornim och.', category:'daily', difficulty:'beginner', tip:'"hungry" = "HANGRI" deb o\'qiladi' },
  { id:'d3', en:'Where is the library?', uz:'Kutubxona qayerda?', category:'daily', difficulty:'beginner', tip:'"library" = "LAYBRERI" deb o\'qiladi' },
  { id:'d4', en:'The weather is sunny today.', uz:'Bugun havo quyoshli.', category:'daily', difficulty:'beginner', tip:'"weather" = "WEZER" — "th" tish orqali' },
  { id:'d5', en:'I live in Uzbekistan.', uz:'Men O\'zbekistonda yashayman.', category:'daily', difficulty:'beginner' },
  // ── Daily life (elementary)
  { id:'d6', en:'I need some help, please.', uz:'Menga yordam kerak, iltimos.', category:'daily', difficulty:'elementary' },
  { id:'d7', en:'How much does it cost?', uz:'Bu qancha turadi?', category:'daily', difficulty:'elementary' },
  { id:'d8', en:'Can I have some water, please?', uz:'Bir oz suv bera olasizmi?', category:'daily', difficulty:'elementary', tip:'"water" = "WOTER" deb o\'qiladi' },
  { id:'d9', en:'Excuse me, where is the exit?', uz:'Kechirasiz, chiqish qayerda?', category:'daily', difficulty:'elementary' },
  // ── Daily life (advanced)
  { id:'d10', en:'I would like to make a reservation for two people.', uz:'Ikki kishi uchun joy band qilmoqchiman.', category:'daily', difficulty:'advanced', tip:'"reservation" = "REZERVEYŞIN" deb o\'qiladi' },
  { id:'d11', en:'In my opinion, communication skills are essential.', uz:'Mening fikrimcha, muloqot ko\'nikmalari juda muhim.', category:'daily', difficulty:'advanced', tip:'"essential" = "ISENSIL" deb o\'qiladi' },
  { id:'d12', en:'Could you help me find this address, please?', uz:'Kechirasiz, bu manzilni topishga yordam bera olasizmi?', category:'daily', difficulty:'advanced' },

  // ── Technology (beginner)
  { id:'t1', en:'Turn on the computer.', uz:'Kompyuterni yoqing.', category:'tech', difficulty:'beginner' },
  { id:'t2', en:'Click the button.', uz:'Tugmani bosing.', category:'tech', difficulty:'beginner' },
  { id:'t3', en:'Technology is amazing!', uz:'Texnologiya ajoyib!', category:'tech', difficulty:'beginner', tip:'"technology" = "TEKNOLIJI" deb o\'qiladi' },
  // ── Technology (elementary)
  { id:'t4', en:'Can you send me the file?', uz:'Faylni yuborib bera olasizmi?', category:'tech', difficulty:'elementary' },
  { id:'t5', en:'The internet is not working.', uz:'Internet ishlamayapti.', category:'tech', difficulty:'elementary', tip:'"internet" bosimi birinchi bo\'g\'inda: IN-ternet' },
  { id:'t6', en:'I need to charge my phone.', uz:'Telefonimni zaryadlashim kerak.', category:'tech', difficulty:'elementary', tip:'"charge" = "CHARJ" deb o\'qiladi' },
  { id:'t7', en:'Please download the application.', uz:'Iltimos, ilovani yuklab oling.', category:'tech', difficulty:'elementary', tip:'"download" = "DAWNLOD" deb o\'qiladi' },
  // ── Technology (advanced)
  { id:'t8', en:'Technology is transforming the way we live and work.', uz:'Texnologiya yashash va ishlash tarzimizni o\'zgartirmoqda.', category:'tech', difficulty:'advanced', tip:'"transforming" = "TRENSFÓRMING" deb o\'qiladi' },
  { id:'t9', en:'Artificial intelligence is becoming part of everyday life.', uz:'Sun\'iy intellekt kundalik hayotning bir qismiga aylanmoqda.', category:'tech', difficulty:'advanced', tip:'"artificial" = "ARTIFISH-ıl" deb o\'qiladi' },

  // ── Food (beginner)
  { id:'f1', en:'I like apples.', uz:'Men olmani yaxshi ko\'raman.', category:'food', difficulty:'beginner', tip:'"like" = "LAYK" deb o\'qiladi' },
  { id:'f2', en:'This food is delicious!', uz:'Bu taom juda mazali!', category:'food', difficulty:'beginner', tip:'"delicious" = "DILIŞIS" deb o\'qiladi' },
  { id:'f3', en:'I am thirsty.', uz:'Chanqadim.', category:'food', difficulty:'beginner', tip:'"thirsty" = "THURSTI" — "th" tish orqali' },
  // ── Food (elementary)
  { id:'f4', en:'Would you like some bread?', uz:'Bir oz non olasizmi?', category:'food', difficulty:'elementary' },
  { id:'f5', en:'The restaurant is open until midnight.', uz:'Restoran yarim tungicha ochiq.', category:'food', difficulty:'elementary', tip:'"restaurant" = "RESTRINT" deb o\'qiladi' },
  { id:'f6', en:'Can I see the menu, please?', uz:'Menyuni ko\'rsangiz bo\'ladimi?', category:'food', difficulty:'elementary' },
  // ── Food (advanced)
  { id:'f7', en:'I\'m on a diet and avoiding sugary drinks.', uz:'Men parhez qilaman va shirinli ichimliklardan saqlanaman.', category:'food', difficulty:'advanced', tip:'"avoiding" = "IVOYDING" deb o\'qiladi' },
  { id:'f8', en:'The chef prepared a wonderful three-course meal.', uz:'Oshpaz ajoyib uch taomli tushlik tayyorladi.', category:'food', difficulty:'advanced', tip:'"prepared" = "PRIPERD" deb o\'qiladi' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
  return dp[m][n];
}

type WordMatch = { word: string; match: 'exact' | 'close' | 'miss' };

function compareText(target: string, spoken: string): WordMatch[] {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z\s']/g, '').trim();
  const tWords = clean(target).split(/\s+/).filter(Boolean);
  const sWords = clean(spoken).split(/\s+/).filter(Boolean);
  return tWords.map(tw => {
    if (sWords.some(sw => sw === tw)) return { word: tw, match: 'exact' as const };
    if (sWords.some(sw => levenshtein(tw, sw) <= 1)) return { word: tw, match: 'close' as const };
    return { word: tw, match: 'miss' as const };
  });
}

function calcScore(matches: WordMatch[]): number {
  if (!matches.length) return 0;
  const pts = matches.reduce((a, m) => a + (m.match === 'exact' ? 2 : m.match === 'close' ? 1 : 0), 0);
  return Math.round((pts / (matches.length * 2)) * 100);
}

function playTTS(text: string, rate = 0.82) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US'; utt.rate = rate;
  window.speechSynthesis.speak(utt);
}

// ─── Category & difficulty labels ────────────────────────────────────────────
const CAT_LABELS: Record<ShadowCategory, string> = {
  all: 'Barchasi', greetings: 'Salomlashish', school: 'Maktab',
  daily: 'Kundalik', tech: 'Texnologiya', food: 'Taom',
};
const CAT_ICONS: Record<ShadowCategory, string> = {
  all: '📋', greetings: '👋', school: '📚', daily: '🌍', tech: '💻', food: '🍎',
};
const DIFF_LABELS = { beginner: 'Beginner', elementary: 'Elementary', advanced: 'Advanced' };
const DIFF_COLORS = { beginner: 'text-emerald-400', elementary: 'text-amber-400', advanced: 'text-rose-400' };

// ─── Component ────────────────────────────────────────────────────────────────
interface ShadowingGameProps {
  onBack: () => void;
}

export default function ShadowingGame({ onBack }: ShadowingGameProps) {
  const [category, setCategory] = useState<ShadowCategory>('all');
  const [difficulty, setDifficulty] = useState<ShadowDifficulty>('beginner');
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<ShadowPhase>('ready');
  const [spokenText, setSpokenText] = useState('');
  const [matches, setMatches] = useState<WordMatch[]>([]);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recError, setRecError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered exercise list
  const filtered = EXERCISES.filter(e =>
    (category === 'all' || e.category === category) && e.difficulty === difficulty
  );
  const exercise = filtered[Math.min(index, filtered.length - 1)];

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  // Reset index when filter changes
  useEffect(() => {
    setIndex(0);
    resetPhase();
  }, [category, difficulty]);

  // Reset when exercise changes
  useEffect(() => {
    resetPhase();
  }, [index]);

  const resetPhase = () => {
    setPhase('ready');
    setSpokenText('');
    setMatches([]);
    setScore(0);
    setShowTip(false);
    setRecError(null);
    stopRecognition();
    window.speechSynthesis?.cancel();
  };

  const stopRecognition = () => {
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const playAudio = useCallback((rate?: number) => {
    if (!exercise) return;
    setPhase('listening');
    playTTS(exercise.en, rate);
    // After estimated audio duration, go back to ready (or keep ready)
    const dur = Math.max(1500, exercise.en.length * 80);
    setTimeout(() => setPhase('ready'), dur);
  }, [exercise]);

  const startRecording = useCallback(() => {
    if (!exercise) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setRecError('Brauzeringiz ovoz tanishni qo\'llamaydi. Chrome yoki Edge ishlatib ko\'ring.'); return; }

    setRecError(null);
    setPhase('recording');
    setIsListening(true);
    window.speechSynthesis?.cancel();

    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      finishRecording(transcript);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'no-speech') finishRecording('');
      else if (e.error === 'not-allowed') setRecError('Mikrofon ruxsati berilmagan. Brauzer sozlamalarida ruxsat bering.');
      else finishRecording('');
    };

    rec.onend = () => {
      if (phase === 'recording') finishRecording('');
    };

    try { rec.start(); } catch { setRecError('Mikrofon ochilmadi. Qayta urinib ko\'ring.'); setPhase('ready'); return; }

    // Safety timeout — stop after 8 seconds
    recTimerRef.current = setTimeout(() => {
      try { rec.stop(); } catch {}
    }, 8000);
  }, [exercise, phase]);

  const finishRecording = useCallback((transcript: string) => {
    stopRecognition();
    if (!exercise) return;
    const m = compareText(exercise.en, transcript);
    const s = calcScore(m);
    setSpokenText(transcript);
    setMatches(m);
    setScore(s);
    setTotalAttempts(t => t + 1);
    setTotalScore(t => t + s);
    setPhase('result');
    if (s >= 90) sound.playCorrect();
    else if (s >= 50) sound.playTap();
    else sound.playIncorrect();
  }, [exercise]);

  const goNext = () => {
    if (index < filtered.length - 1) { setIndex(i => i + 1); }
    else { setIndex(0); }
  };

  const goPrev = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  const stars = score >= 90 ? 3 : score >= 65 ? 2 : score >= 35 ? 1 : 0;
  const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

  if (!exercise) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <p className="text-sm">Bu kategoriyada hali mashqlar yo'q.</p>
      <button onClick={() => setCategory('all')} className="mt-3 text-cyan-400 hover:underline text-xs">Barchasini ko'ring</button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 select-none animate-fade-in">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-bold uppercase transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> O'yinlarga qaytish
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black text-white uppercase tracking-tight">🎤 SHADOWING MASHQI</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Tinglang → Gapirib ko'ring → Baholang</p>
        </div>
        {totalAttempts > 0 ? (
          <div className="text-right">
            <p className="text-[9px] text-slate-500 uppercase font-black">O'rtacha ball</p>
            <p className={`text-xl font-black ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{avgScore}%</p>
          </div>
        ) : <div className="w-20"/>}
      </div>

      {/* ── Difficulty tabs ── */}
      <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit mx-auto">
        {(['beginner','elementary','advanced'] as ShadowDifficulty[]).map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              difficulty === d ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
            }`}>
            {DIFF_LABELS[d]}
          </button>
        ))}
      </div>

      {/* ── Category tabs ── */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {(['all','greetings','school','daily','tech','food'] as ShadowCategory[]).map(c => {
          const count = c === 'all' ? EXERCISES.filter(e => e.difficulty === difficulty).length
            : EXERCISES.filter(e => e.category === c && e.difficulty === difficulty).length;
          return (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition-all cursor-pointer flex items-center gap-1 ${
                category === c
                  ? 'bg-slate-800 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}>
              {CAT_ICONS[c]} {CAT_LABELS[c]}
              <span className="text-[8px] opacity-60 ml-0.5">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Main exercise card ── */}
      <div className={`bg-slate-900/80 border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 transition-all duration-300 ${
        phase === 'recording' ? 'border-rose-500/50 shadow-rose-500/10' :
        phase === 'result' && score >= 90 ? 'border-emerald-500/40 shadow-emerald-500/10' :
        phase === 'result' && score >= 50 ? 'border-amber-500/30' :
        phase === 'result' ? 'border-rose-500/30' :
        phase === 'listening' ? 'border-cyan-500/30 shadow-cyan-500/10' :
        'border-slate-800'
      }`}>

        {/* Progress + index */}
        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={index === 0}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase">{CAT_ICONS[category]} {CAT_LABELS[category]} — {DIFF_LABELS[difficulty]}</p>
            <p className="text-xs font-black text-slate-400">{index + 1} / {filtered.length}</p>
          </div>
          <button onClick={goNext}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white transition-all cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / filtered.length) * 100}%` }} />
        </div>

        {/* Target sentence */}
        <div className="text-center space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Inglizcha mashq matni</p>

            {/* Word display — colored in result phase */}
            {phase === 'result' && matches.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {matches.map((m, i) => (
                  <span key={i} className={`text-2xl md:text-3xl font-black px-2 py-1 rounded-xl border ${
                    m.match === 'exact' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                    m.match === 'close' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                    'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  }`}>{m.word}</span>
                ))}
              </div>
            ) : (
              <p className={`text-2xl md:text-3xl font-black transition-all ${
                phase === 'listening' ? 'text-cyan-400' :
                phase === 'recording' ? 'text-rose-300' : 'text-white'
              }`}>{exercise.en}</p>
            )}
          </div>

          <p className="text-sm text-slate-400 font-medium italic">{exercise.uz}</p>

          {/* Pronunciation tip */}
          {exercise.tip && (
            <div>
              <button onClick={() => setShowTip(v => !v)}
                className="flex items-center gap-1 mx-auto text-[10px] text-amber-400/80 hover:text-amber-400 cursor-pointer transition-all">
                <Lightbulb className="w-3 h-3" />
                {showTip ? 'Maslahatni yopish' : 'Talaffuz maslahat'}
              </button>
              {showTip && (
                <div className="mt-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
                  💡 {exercise.tip}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Waveform animation (recording) */}
        {phase === 'recording' && (
          <div className="flex items-end justify-center gap-1 h-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.sin(i * 0.8) * 15}px`,
                  animationDelay: `${i * 0.05}s`,
                  animationDuration: `${0.4 + Math.random() * 0.4}s`
                }} />
            ))}
          </div>
        )}

        {/* Listening animation */}
        {phase === 'listening' && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-2 bg-cyan-500 rounded-full animate-bounce"
                style={{ height: `${12 + i * 6}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
            <span className="text-xs text-cyan-400 font-bold ml-2">Eshitayotgansiz...</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Play button */}
          <button onClick={() => playAudio()} disabled={phase === 'recording'}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border font-black text-sm uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
              phase === 'listening'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 animate-pulse'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
            }`}>
            <Volume2 className="w-4 h-4" />
            {phase === 'listening' ? 'Aytilmoqda...' : 'Eshiting 🔊'}
          </button>

          {/* Play slow */}
          <button onClick={() => playAudio(0.55)} disabled={phase === 'recording'}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 font-black text-xs uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40">
            <Volume2 className="w-3.5 h-3.5" /> Sekin
          </button>

          {/* Record button */}
          <button onClick={phase === 'recording' ? stopRecognition : startRecording}
            disabled={phase === 'listening'}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border font-black text-sm uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
              phase === 'recording'
                ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500'
            }`}>
            {phase === 'recording' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {phase === 'recording' ? 'To\'xtatish ■' : 'Gapirib ko\'ring 🎤'}
          </button>
        </div>

        {/* Speech not supported warning */}
        {!speechSupported && (
          <div className="text-center px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-400 font-bold">⚠️ Brauzeringiz ovoz tanishni qo'llamaydi. Eshitish va TTS ishlaydi. Chrome yoki Edge ishlatib ko'ring.</p>
          </div>
        )}
        {recError && (
          <div className="text-center px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <p className="text-xs text-rose-400 font-bold">⚠️ {recError}</p>
          </div>
        )}

        {/* Result section */}
        {phase === 'result' && (
          <div className="space-y-4 border-t border-slate-800 pt-4">
            {/* Score bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-500 uppercase font-black">Aniqlik darajangiz</p>
                <p className={`text-xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{score}%</p>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${
                  score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                  score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                  'bg-gradient-to-r from-rose-600 to-rose-500'
                }`} style={{ width: `${score}%` }} />
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1,2,3].map(s => (
                <Star key={s} className={`w-7 h-7 transition-all ${s <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
              ))}
            </div>

            {/* Feedback message */}
            <p className={`text-center text-sm font-black ${
              score >= 90 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : score >= 35 ? 'text-orange-400' : 'text-rose-400'
            }`}>
              {score >= 90 ? '🏆 Mukammal! Talaffuzingiz ajoyib!' :
               score >= 65 ? '✅ Yaxshi! Davom eting!' :
               score >= 35 ? '📈 Yaxshi urinish! Yana bir bor mashq qiling' :
               spokenText ? '🔄 Avval eshiting, so\'ng gapirib ko\'ring' :
               '🎤 Ovoz aniqlanmadi. Qayta urinib ko\'ring'}
            </p>

            {/* What was heard */}
            {spokenText && (
              <div className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl">
                <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Eshitilgan:</p>
                <p className="text-xs text-slate-300 italic">"{spokenText}"</p>
              </div>
            )}

            {/* Legend */}
            <div className="flex justify-center gap-4 text-[9px] font-bold uppercase">
              <span className="text-emerald-400">✅ To'g'ri</span>
              <span className="text-amber-400">〰️ Yaqin</span>
              <span className="text-rose-400">❌ Xato</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={resetPhase}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-300 font-black text-xs uppercase rounded-2xl cursor-pointer transition-all active:scale-95">
                <RotateCcw className="w-4 h-4" /> Qayta mashq
              </button>
              <button onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                Keyingisi <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Legend / Info card ── */}
      {phase === 'ready' && (
        <div className="mt-6 bg-slate-950/60 border border-slate-900 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase font-black flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Qanday o'ynash kerak?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-400">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-black">1.</span>
              <span><b className="text-white">Eshiting</b> — "Eshiting 🔊" tugmasini bosib to'liq gapni tinglang. Sekin versiyasini ham tinglashingiz mumkin.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-black">2.</span>
              <span><b className="text-white">Gapirib ko'ring</b> — "Gapirib ko'ring 🎤" tugmasini bosib xuddi o'sha gapni inglizcha takrorlang.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-black">3.</span>
              <span><b className="text-white">Baholang</b> — Har bir so'z bo'yicha rang bilan natija chiqadi: 🟢 to'g'ri, 🟡 yaqin, 🔴 xato.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
