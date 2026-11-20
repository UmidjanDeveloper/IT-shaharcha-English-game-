import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock, Headphones, Mic, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { ask, explain, getCapabilities, speak, stopSpeaking, transcribe } from '../ai';
import type { Capabilities, Lang } from '../ai';
import { AnswerRecorder, recordingSupported } from './recorder';
import type { Recording } from './recorder';
import { buildSpeakingTest, overallBand } from './questionBank';
import type { CueCard, Part1Topic } from './questionBank';
import { estimateBands, wordsPerMinute } from './speakingScore';
import type { AnswerEvidence } from './speakingScore';

const Mentor = lazy(() => import('../Mentor'));

export type ExamPlan =
  | { mode: 'full' }
  | { mode: 'part1'; topics: Part1Topic[] }
  | { mode: 'part2'; card: CueCard }
  | { mode: 'part3'; topic: Part1Topic };

type Step = { part: 'Intro' | 'Part 1' | 'Part 2' | 'Part 3' | 'End'; say: string; topic: string; question?: string; dynamic?: boolean; limit?: number; silence?: number; prep?: number; card?: CueCard };
type Answer = AnswerEvidence & { pending?: Promise<void>; error?: string };
export type SpeakingReport = {
  overall: number; fluency: number; lexical: number; grammar: number; pronunciation: number; summary: string;
  criteria: { fluency: string; lexical: string; grammar: string; pronunciation: string };
  answers: { index: number; comment: string; corrections: { original: string; better: string; why: string }[]; upgrades: { basic: string; advanced: string }[]; improved: string }[];
  plan: string[];
};
type Saved = { id: string; date: number; mode: string; report: SpeakingReport; answers: AnswerEvidence[]; ai: boolean };

const historyKey = 'shaharcha-speaking-v1';
export function readSpeakingHistory(): Saved[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
    return Array.isArray(rows) ? rows.filter(r => r && typeof r.report?.overall === 'number').slice(0, 12) : [];
  } catch { return []; }
}
function saveHistory(entry: Saved) {
  try { localStorage.setItem(historyKey, JSON.stringify([entry, ...readSpeakingHistory()].slice(0, 12))); } catch { /* storage optional */ }
}

export function buildSteps(plan: ExamPlan): Step[] {
  const steps: Step[] = [];
  const p1 = (topic: string, question: string, first: boolean): Step => ({ part: 'Part 1', topic, question, say: (first ? `Let's talk about ${topic.toLowerCase()}. ` : '') + question, limit: 40, silence: 3 });
  const p2 = (card: CueCard): Step[] => [
    { part: 'Part 2', topic: card.topic, card, prep: 60, say: "Now I'm going to give you a topic, and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. You can make some notes if you wish. Here is your topic." },
    { part: 'Part 2', topic: card.topic, card, question: card.prompt + ' You should say: ' + card.cues.join('; '), say: "All right? Remember, you have one to two minutes for this, so don't worry if I stop you. I'll tell you when the time is up. Can you start speaking now, please?", limit: 120, silence: 6 },
    { part: 'Part 2', topic: card.topic, question: card.rounding[0], say: 'Thank you. ' + card.rounding[0], limit: 25, silence: 3 },
  ];
  const p3 = (topic: Part1Topic, intro: string): Step[] => [
    { part: 'Part 3', topic: topic.topic, question: topic.questions[0], say: intro + topic.questions[0], limit: 75, silence: 4 },
    { part: 'Part 3', topic: topic.topic, question: topic.questions[1], dynamic: true, say: '', limit: 75, silence: 4 },
    { part: 'Part 3', topic: topic.topic, question: topic.questions[2], say: topic.questions[2], limit: 75, silence: 4 },
    { part: 'Part 3', topic: topic.topic, question: topic.questions[3], dynamic: true, say: '', limit: 75, silence: 4 },
  ];
  if (plan.mode === 'full') {
    const test = buildSpeakingTest();
    steps.push({ part: 'Intro', topic: 'Introduction', question: 'Can you tell me your full name, please?', say: "Good afternoon. My name is Geno, and I'll be your examiner today. This test is recorded. Can you tell me your full name, please?", limit: 12, silence: 2 });
    steps.push({ part: 'Part 1', topic: test.opening.topic, question: test.opening.questions[0], say: "Thank you. Now, in this first part, I'd like to ask you some questions about yourself. " + test.opening.questions[0], limit: 40, silence: 3 });
    test.opening.questions.slice(1).forEach(q => steps.push(p1(test.opening.topic, q, false)));
    test.part1.forEach(t => t.questions.forEach((q, i) => steps.push(p1(t.topic, q, i === 0))));
    steps.push(...p2(test.card));
    steps.push(...p3(test.card.part3, `We've been talking about ${test.card.topic.toLowerCase()}, and I'd like to discuss with you one or two more general questions related to this. `));
  } else if (plan.mode === 'part1') {
    plan.topics.forEach((t, n) => t.questions.forEach((q, i) => steps.push({ ...p1(t.topic, q, i === 0), say: (n === 0 && i === 0 ? "In this part, I'd like to ask you some questions about yourself. " : '') + p1(t.topic, q, i === 0).say })));
  } else if (plan.mode === 'part2') {
    steps.push(...p2(plan.card));
  } else {
    steps.push(...p3(plan.topic, `Let's discuss ${plan.topic.topic.toLowerCase()}. `));
  }
  steps.push({ part: 'End', topic: 'End', say: 'Thank you. That is the end of the speaking test.' });
  return steps;
}

type Phase = 'setup' | 'exam' | 'scoring' | 'report';

export function SpeakingExam({ plan, title, onExit }: { plan: ExamPlan; title: string; onExit: () => void }) {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [phase, setPhase] = useState<Phase>('setup');
  const [lang, setLang] = useState<Lang>('uz');
  const [steps] = useState(() => buildSteps(plan));
  const [index, setIndex] = useState(0);
  const [pose, setPose] = useState('idle');
  const [caption, setCaption] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [state, setState] = useState<'speaking' | 'prep' | 'recording' | 'typing' | 'thinking' | ''>('');
  const [clock, setClock] = useState(0);
  const [level, setLevel] = useState(0);
  const [notes, setNotes] = useState('');
  const [typed, setTyped] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [report, setReport] = useState<SpeakingReport | null>(null);
  const [aiReport, setAiReport] = useState(false);
  const [message, setMessage] = useState('');
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const cancelled = useRef(false);
  const finish = useRef<(() => void) | null>(null);
  const recorder = useRef<AnswerRecorder | null>(null);
  const answersRef = useRef<Answer[]>([]);
  const canRecord = recordingSupported();

  useEffect(() => { getCapabilities().then(setCaps); }, []);
  useEffect(() => () => { cancelled.current = true; stopSpeaking(); recorder.current?.release(); }, []);

  async function micTest() {
    try {
      const test = new AnswerRecorder();
      await test.start();
      let peak = 0;
      const until = performance.now() + 2500;
      while (performance.now() < until) { peak = Math.max(peak, test.level); setLevel(test.level); await wait(100); }
      await test.stop();
      setLevel(0);
      setMicOk(peak > 0.02);
    } catch { setMicOk(false); }
  }

  async function say(text: string) {
    if (!text || cancelled.current) return;
    setCaption(text); setState('speaking'); setPose('talking');
    await speak(text, 'en', { voice: caps?.voice }).done;
    setPose('idle');
  }

  function updateAnswers(next: Answer[]) { answersRef.current = next; setAnswers(next); }

  async function capture(step: Step): Promise<void> {
    const limit = step.limit ?? 40, silence = step.silence ?? 3;
    let done = false;
    finish.current = () => { done = true; };
    setClock(limit);
    if (!canRecord) {
      setState('typing'); setTyped('');
      await new Promise<void>(resolve => { finish.current = resolve; });
      return;
    }
    const rec = new AnswerRecorder();
    recorder.current = rec;
    try { await rec.start(); } catch { setMessage('Mikrofon ishlamadi. Javobni yozib yuboring.'); setState('typing'); await new Promise<void>(r => { finish.current = r; }); return; }
    setState('recording'); setPose('attentive');
    const minimum = step.part === 'Part 2' && limit > 60 ? 45 : 4;
    while (!done && !cancelled.current) {
      await wait(200);
      setLevel(rec.level);
      setClock(Math.max(0, Math.ceil(limit - rec.elapsed)));
      if (rec.elapsed >= limit) break;
      if (rec.elapsed > minimum && rec.trailingSilence >= silence) break;
      if (!rec.hasSpeech && rec.elapsed > (limit >= 120 ? 12 : 8)) break; // silent candidate: the examiner moves on
    }
    const recording = await rec.stop();
    recorder.current = null;
    setLevel(0); setPose('idle');
    if (cancelled.current) return;
    addRecording(step, recording);
  }

  function addRecording(step: Step, recording: Recording) {
    const answer: Answer = { part: step.part, question: step.question ?? '', transcript: '', seconds: recording.seconds, pauses: recording.pauses, longestPause: recording.longestPause, unclear: [] };
    const position = answersRef.current.length;
    answer.pending = caps?.transcribe ? transcribe(recording.blob, 'en').then(r => {
      const list = [...answersRef.current];
      list[position] = { ...list[position], transcript: r.text, unclear: r.unclear };
      updateAnswers(list);
    }).catch(error => {
      const list = [...answersRef.current];
      list[position] = { ...list[position], error: explain(error) };
      updateAnswers(list);
    }) : Promise.resolve();
    updateAnswers([...answersRef.current, answer]);
  }

  function submitTyped(step: Step) {
    const text = typed.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    updateAnswers([...answersRef.current, { part: step.part, question: step.question ?? '', transcript: text, seconds: Math.max(5, Math.round(words / 2)), pauses: 0, longestPause: 0, unclear: [] }]);
    finish.current?.();
  }

  async function dynamicQuestion(step: Step) {
    if (!caps?.chat) return step.question!;
    setState('thinking');
    const last = answersRef.current.at(-1);
    await last?.pending;
    const history = answersRef.current.filter(a => a.part === step.part).map(a => ({ q: a.question, a: a.transcript || '(no answer)' }));
    try {
      const turn = await Promise.race([
        ask<{ question: string }>({ action: 'examiner', language: 'en', part: step.part, topic: step.topic, history }),
        wait(9000).then(() => null),
      ]);
      return turn?.question?.trim() || step.question!;
    } catch { return step.question!; }
  }

  async function run() {
    cancelled.current = false;
    setPhase('exam');
    for (let i = 0; i < steps.length && !cancelled.current; i++) {
      const step = steps[i];
      setIndex(i); setMessage('');
      if (step.dynamic) {
        const question = await dynamicQuestion(step);
        step.question = question; step.say = question;
      }
      await say(step.say);
      if (cancelled.current) return;
      if (step.prep) {
        setState('prep'); setNotes('');
        let skip = false;
        finish.current = () => { skip = true; };
        const end = performance.now() + step.prep * 1000;
        while (!skip && !cancelled.current && performance.now() < end) { setClock(Math.ceil((end - performance.now()) / 1000)); await wait(200); }
        continue;
      }
      if (step.limit) await capture(step);
      if (step.limit && step.limit >= 120 && !cancelled.current) setCaption('Thank you.');
    }
    if (!cancelled.current) score();
  }

  async function score() {
    setPhase('scoring'); setState(''); setPose('idle');
    await Promise.all(answersRef.current.map(a => a.pending));
    const evidence: AnswerEvidence[] = answersRef.current.map(({ pending: _p, error: _e, ...a }) => a);
    const local = estimateBands(evidence.filter(a => a.part !== 'Intro'));
    let result: SpeakingReport | null = null;
    if (caps?.assess && evidence.some(a => a.transcript.trim())) {
      try {
        result = await ask<SpeakingReport>({ action: 'assess', language: lang, answers: evidence.map(a => ({ ...a, wpm: wordsPerMinute(a.transcript, a.seconds) })) });
        result.overall = overallBand([result.fluency, result.lexical, result.grammar, result.pronunciation]);
        setAiReport(true);
      } catch (error) { setMessage(explain(error) + ' Taxminiy hisobot ko‘rsatildi.'); }
    }
    result ??= {
      ...local,
      summary: evidence.some(a => a.transcript.trim()) ? 'Bu taxminiy baho: AI examiner ulanmagan, shuning uchun ball faqat so‘zlar soni, tezlik, pauzalar va oddiy grammatik xatolar asosida hisoblandi.' : 'Javoblar matnga aylantirilmadi. AI xizmatini ulang yoki javoblarni yozing.',
      criteria: { fluency: 'Tezlik va pauzalar asosida.', lexical: 'So‘z xilma-xilligi asosida.', grammar: 'Gap uzunligi va keng tarqalgan xatolar asosida.', pronunciation: 'Talaffuzni AI’siz baholab bo‘lmaydi; bu juda taxminiy.' },
      answers: [], plan: ['Har bir Part 1 javobini 2–3 gapga yetkazing: javob + sabab + misol.', 'Part 2 da 1 daqiqalik reja tuzing va 2 daqiqa to‘xtamasdan gapiring.', 'Part 3 da fikr + izoh + misol + xulosa tuzilmasidan foydalaning.', '“because, however, for instance” kabi bog‘lovchilarni mashq qiling.'],
    };
    setReport(result);
    saveHistory({ id: String(Date.now()), date: Date.now(), mode: title, report: result, answers: evidence, ai: !!caps?.assess && !!result.answers.length });
    setPhase('report');
  }

  function stopExam() {
    cancelled.current = true; stopSpeaking(); finish.current?.();
    recorder.current?.release(); recorder.current = null;
    setState(''); setPose('idle');
    if (answersRef.current.length) score(); else onExit();
  }

  const step = steps[index];
  const progress = Math.round((index / Math.max(1, steps.length - 1)) * 100);

  if (phase === 'setup') return <section className="practice exam-room">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Orqaga</button>
    <div className="practice-heading"><div className="practice-kicker"><Mic size={18} /> IELTS Speaking · Examiner bilan</div><h1>{title}</h1>
      <p>Haqiqiy imtihon tartibi: examiner savol beradi, siz mikrofonga inglizcha javob berasiz. Javoblar avtomatik yozib olinadi, oxirida 4 mezon bo‘yicha band ball va har bir javob uchun tahlil chiqadi.</p></div>
    <div className="exam-setup">
      <div className="coach-stage exam-stage"><Suspense fallback="Examiner yuklanmoqda…"><Mentor pose="idle" /></Suspense></div>
      <div className="practice-card">
        <h2>Imtihonga tayyorgarlik</h2>
        <ul className="exam-checklist">
          <li><Check size={16} /> Tinch xona toping, quloqchin taqing.</li>
          <li><Check size={16} /> Savol tugagach 1–2 soniyada gapirishni boshlang. Jim qolsangiz, keyingi savolga o‘tiladi.</li>
          <li><Check size={16} /> Part 2: 1 daqiqa tayyorgarlik, 2 daqiqa gapirish.</li>
        </ul>
        <div className="exam-status-grid">
          <span className={caps?.voice ? 'ok' : 'warn'}>{caps?.voice ? 'ElevenLabs examiner ovozi' : 'Brauzer ovozi (ElevenLabs ulanmagan)'}</span>
          <span className={caps?.transcribe ? 'ok' : 'warn'}>{caps?.transcribe ? 'OpenAI nutqni matnga aylantirish' : canRecord ? 'Transkripsiya ulanmagan' : 'Yozma javob rejimi'}</span>
          <span className={caps?.assess ? 'ok' : 'warn'}>{caps?.assess ? 'AI band baholash' : 'Taxminiy baholash'}</span>
        </div>
        {canRecord && <div className="mic-test"><button className="secondary-button" onClick={micTest}><Mic size={17} /> Mikrofonni tekshirish</button>
          <meter min={0} max={0.3} value={level} aria-label="Mikrofon ovoz darajasi" />
          {micOk !== null && <span role="status">{micOk ? 'Mikrofon ishlayapti ✓' : 'Ovoz eshitilmadi. Ruxsat va mikrofonni tekshiring.'}</span>}</div>}
        <label className="inline-select">Hisobot tili <select value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="uz">O‘zbekcha</option><option value="en">English</option></select></label>
        <button className="primary-button" onClick={run}><Play size={17} /> Imtihonni boshlash</button>
      </div>
    </div>
  </section>;

  if (phase === 'exam') return <section className="practice exam-room">
    <div className="exam-bar"><strong>{step.part === 'Intro' ? 'Introduction' : step.part}</strong><span>{step.topic}</span>
      <progress value={progress} max={100} aria-label="Imtihon jarayoni" /><button className="secondary-button" onClick={stopExam}><Square size={15} /> Tugatish</button></div>
    <div className="exam-layout">
      <div className={`coach-stage exam-stage ${state}`} data-pose={pose}>
        <Suspense fallback="Examiner yuklanmoqda…"><Mentor pose={pose} /></Suspense>
        <strong>{({ speaking: 'Examiner gapiryapti…', prep: 'Tayyorlaning', recording: 'Sizni tinglayapman', typing: 'Javobingizni yozing', thinking: 'Examiner keyingi savolni tayyorlayapti…', '': '' })[state]}</strong>
      </div>
      <div className="exam-panel">
        {step.card && (state === 'prep' || step.limit === 120) && <article className="cue-card" lang="en">
          <h2>{step.card.prompt}</h2><p>You should say:</p><ul>{step.card.cues.map(c => <li key={c}>{c}</li>)}</ul>
        </article>}
        {state === 'prep' && <div className="practice-card"><div className="exam-clock"><Clock size={18} /> {clock} s</div>
          <label>Qoralama (faqat sizga ko‘rinadi)<textarea className="mock-input" rows={5} value={notes} onChange={e => setNotes(e.target.value)} lang="en" /></label>
          <button className="primary-button" onClick={() => finish.current?.()}>Tayyorman</button></div>}
        {state === 'recording' && <div className="practice-card recording-card">
          <div className="rec-dot" aria-hidden="true" /><div><strong>Yozib olinmoqda</strong><span>{clock} s qoldi</span></div>
          <meter min={0} max={0.3} value={level} aria-label="Ovoz darajasi" />
          {notes && step.limit === 120 && <p className="exam-notes" lang="en">{notes}</p>}
          <button className="primary-button" onClick={() => finish.current?.()}><Check size={17} /> Javobni tugatdim</button></div>}
        {state === 'typing' && <div className="practice-card"><label>Javobingiz (inglizcha)<textarea className="mock-input" rows={5} value={typed} onChange={e => setTyped(e.target.value)} lang="en" /></label>
          <button className="primary-button" disabled={!typed.trim()} onClick={() => submitTyped(step)}>Yuborish</button></div>}
        <label className="caption-toggle"><input type="checkbox" checked={showCaption} onChange={e => setShowCaption(e.target.checked)} /> Examiner gapini matnda ko‘rsatish (haqiqiy imtihonda yo‘q)</label>
        {showCaption && <p className="exam-caption" lang="en">{caption}</p>}
        <p className="grading-note">{answers.length} ta javob yozib olindi · {message}</p>
      </div>
    </div>
  </section>;

  if (phase === 'scoring') return <section className="practice exam-room"><div className="practice-card scoring-card">
    <div className="spinner" aria-hidden="true" /><h2>Examiner javoblaringizni baholayapti…</h2>
    <p>Nutq matnga aylantirilmoqda va 4 mezon bo‘yicha tahlil qilinmoqda. Bu 20–60 soniya davom etishi mumkin.</p></div></section>;

  return <SpeakingReportView report={report!} answers={answers} ai={aiReport} message={message} lang={lang} voice={!!caps?.voice}
    onRetry={() => { setAnswers([]); answersRef.current = []; setReport(null); setPhase('setup'); setIndex(0); }} onExit={onExit} />;
}

export function SpeakingReportView({ report, answers, ai, message, lang, voice, onRetry, onExit }: { report: SpeakingReport; answers: AnswerEvidence[]; ai: boolean; message?: string; lang: Lang; voice: boolean; onRetry?: () => void; onExit: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const criteria = [['fluency', 'Fluency & Coherence', 'Ravonlik va izchillik'], ['lexical', 'Lexical Resource', 'So‘z boyligi'], ['grammar', 'Grammatical Range & Accuracy', 'Grammatika'], ['pronunciation', 'Pronunciation', 'Talaffuz']] as const;
  return <section className="practice exam-report">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> IELTS bo‘limiga qaytish</button>
    <div className="band-hero">
      <div className="band-circle"><small>Overall</small><strong>{report.overall.toFixed(1)}</strong><small>{ai ? 'AI examiner bahosi' : 'taxminiy'}</small></div>
      <div><h1>Speaking natijasi</h1><p lang={lang}>{report.summary}</p>{message && <p className="grading-note">{message}</p>}
        <p className="grading-note">Bu rasmiy IELTS natijasi emas. Ball ochiq band descriptorlari asosida taxmin qilinadi.</p></div>
    </div>
    <div className="band-grid">{criteria.map(([key, en, uz]) => <article key={key} className="practice-card band-card">
      <div className="band-row"><span><strong>{en}</strong><small>{uz}</small></span><b>{report[key].toFixed(1)}</b></div>
      <progress value={report[key]} max={9} aria-label={en} /><p lang={lang}>{report.criteria[key]}</p></article>)}</div>

    <h2 className="club-subtitle">Har bir javob tahlili</h2>
    <div className="answer-review">{answers.map((a, i) => {
      const fb = report.answers.find(x => x.index === i);
      const unclear = new Set(a.unclear.map(w => w.toLowerCase()));
      return <article className="practice-card" key={i}>
        <button className="answer-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
          <span className="tile-tag">{a.part}</span><strong lang="en">{a.question}</strong>
          <small>{a.seconds} s · {wordsPerMinute(a.transcript, a.seconds)} so‘z/daq · {a.pauses} pauza</small></button>
        {open === i && <div className="answer-body">
          <p className="transcript" lang="en">{a.transcript ? a.transcript.split(/(\s+)/).map((w, n) => unclear.has(w.replace(/[^\p{L}']/gu, '').toLowerCase()) ? <mark key={n} title="Aniq eshitilmadi — talaffuzni tekshiring">{w}</mark> : w) : <em>Matn yo‘q</em>}</p>
          {fb?.comment && <p lang={lang}>{fb.comment}</p>}
          {!!fb?.corrections.length && <ul className="corrections">{fb.corrections.map((c, n) => <li key={n}><del lang="en">{c.original}</del> → <ins lang="en">{c.better}</ins><small lang={lang}>{c.why}</small></li>)}</ul>}
          {!!fb?.upgrades.length && <p className="upgrades">{fb.upgrades.map((u, n) => <span key={n} lang="en">{u.basic} → <b>{u.advanced}</b></span>)}</p>}
          {fb?.improved && <div className="translation-box"><strong>Band 8 namunasi</strong><p lang="en">{fb.improved}</p>
            <button className="secondary-button" onClick={() => speak(fb.improved, 'en', { voice })}><Volume2 size={16} /> Tinglash</button></div>}
        </div>}
      </article>;
    })}</div>
    <div className="practice-card"><h2>Keyingi qadamlar</h2><ol lang={lang}>{report.plan.map(p => <li key={p}>{p}</li>)}</ol>
      <div className="result-actions">{onRetry && <button className="primary-button" onClick={onRetry}><RotateCcw size={17} /> Yana topshirish</button>}
        <button className="secondary-button" onClick={onExit}><Headphones size={17} /> Boshqa mashq</button></div></div>
  </section>;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
