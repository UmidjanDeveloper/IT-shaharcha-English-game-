// IELTS centre: everything happens inside the site — no links that take children away.
import { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpenText, Headphones, Mic, PencilLine, RefreshCw, Sparkles } from 'lucide-react';
import { ask, explain, getCapabilities } from './ai';
import { cueCards, part1Topics, openingTopics, task1, task2 } from './ielts/questionBank';
import type { CueCard, Part1Topic } from './ielts/questionBank';
import type { ExamPlan } from './ielts/SpeakingExam';
import { readSpeakingHistory } from './ielts/SpeakingExam';
import { Credits } from './Credits';
import BlurText from '../vendor/react-bits/BlurText';
import { RevealGroup, RevealItem } from './motion/Reveal';

const SpeakingExam = lazy(() => import('./ielts/SpeakingExam').then(m => ({ default: m.SpeakingExam })));
const WritingExam = lazy(() => import('./ielts/WritingExam').then(m => ({ default: m.WritingExam })));
const MockExam = lazy(() => import('./MockExam').then(m => ({ default: m.MockExam })));
const Mentor = lazy(() => import('./Mentor'));

type Fresh = { period: string; sets: { part: string; topic: string; questions: string[]; cues: string[]; reported: string; source: string }[] };
type Open = { kind: 'speaking'; plan: ExamPlan; title: string } | { kind: 'task1'; index: number } | { kind: 'task2'; index: number } | { kind: 'mock' } | null;
const freshKey = 'shaharcha-fresh-v1';

function readFresh(): { date: string; data: Fresh } | null {
  try { return JSON.parse(localStorage.getItem(freshKey) ?? 'null'); } catch { return null; }
}

export function OfficialIELTS() {
  const [tab, setTab] = useState<'speaking' | 'writing' | 'lr' | 'fresh' | 'history'>('speaking');
  const [open, setOpen] = useState<Open>(null);
  const [fresh, setFresh] = useState(readFresh);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canFresh, setCanFresh] = useState(false);
  useEffect(() => { getCapabilities().then(c => setCanFresh(c.fresh)); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [open]);

  async function refresh() {
    setBusy(true); setMessage('');
    try {
      const data = await ask<Fresh>({ action: 'questions', part: 'speaking', language: 'en' });
      const entry = { date: new Date().toISOString().slice(0, 10), data };
      setFresh(entry);
      try { localStorage.setItem(freshKey, JSON.stringify(entry)); } catch { /* optional */ }
    } catch (error) { setMessage(explain(error)); }
    finally { setBusy(false); }
  }

  function practiseFresh(set: Fresh['sets'][number]) {
    if (set.part === 'Part 2') {
      const card: CueCard = { topic: set.topic, prompt: set.questions[0], cues: set.cues.length ? set.cues : ['what it is', 'when it happened', 'who was involved', 'and explain how you felt about it'], rounding: ['Would you like to experience this again?'],
        part3: { topic: set.topic, questions: cueCards[0].part3.questions } };
      setOpen({ kind: 'speaking', plan: { mode: 'part2', card }, title: 'Part 2 · ' + set.topic });
    } else if (set.part === 'Part 3') {
      const qs = [...set.questions, ...cueCards[0].part3.questions].slice(0, 4);
      setOpen({ kind: 'speaking', plan: { mode: 'part3', topic: { topic: set.topic, questions: qs } }, title: 'Part 3 · ' + set.topic });
    } else {
      setOpen({ kind: 'speaking', plan: { mode: 'part1', topics: [{ topic: set.topic, questions: set.questions.slice(0, 5) }] }, title: 'Part 1 · ' + set.topic });
    }
  }

  const back = () => setOpen(null);
  if (open) return <Suspense fallback={<p>Yuklanmoqda…</p>}>
    {open.kind === 'speaking' && <SpeakingExam key={open.title} plan={open.plan} title={open.title} onExit={back} />}
    {open.kind === 'task1' && <WritingExam task={{ kind: 'Task 1', data: task1[open.index] }} onExit={back} />}
    {open.kind === 'task2' && <WritingExam task={{ kind: 'Task 2', data: task2[open.index] }} onExit={back} />}
    {open.kind === 'mock' && <MockExam level="ielts" onExit={back} award={() => {}} />}
  </Suspense>;

  const history = readSpeakingHistory();
  return <section className="official-hub ielts-centre">
    <div className="ielts-hero">
      <div className="coach-stage"><Suspense fallback="Examiner yuklanmoqda…"><Mentor pose="idle" /></Suspense></div>
      <div><span className="tile-tag">IELTS MARKAZI</span><h2><BlurText text="Haqiqiy imtihon formatida tayyorlaning" animateBy="words" delay={70} trigger="load" /></h2>
        <p>3D examiner bilan to‘liq Speaking imtihoni (Part 1–2–3), band ball va har bir javob tahlili. Writing Task 1/2 uchun AI examiner bahosi. Savollar 2025–2026 yillarda imtihonda tushgani haqida nomzodlar xabar bergan mavzular asosida tuzilgan.</p>
        <button className="primary-button" onClick={() => setOpen({ kind: 'speaking', plan: { mode: 'full' }, title: 'To‘liq Speaking imtihoni' })}><Mic size={17} /> To‘liq Speaking imtihoni (11–14 daqiqa)</button>
      </div>
    </div>
    <div className="club-tabs" role="tablist">{([['speaking', 'Speaking'], ['writing', 'Writing'], ['lr', 'Listening & Reading'], ['fresh', 'Yangi tushgan savollar'], ['history', 'Natijalarim']] as const).map(([id, label]) =>
      <button key={id} role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>

    {tab === 'speaking' && <>
      <h3 className="club-subtitle">Part 1 · Intervyu (mavzu tanlang)</h3>
      <RevealGroup className="topic-grid" stagger={.025}>{[...openingTopics, ...part1Topics].map(t => <RevealItem key={t.topic}><button onClick={() => setOpen({ kind: 'speaking', plan: { mode: 'part1', topics: [t] }, title: 'Part 1 · ' + t.topic })}>
        <strong>{t.topic}</strong><small>{t.questions.length} savol</small></button></RevealItem>)}</RevealGroup>
      <h3 className="club-subtitle">Part 2 · Cue card + Part 3 muhokama</h3>
      <div className="topic-grid cards">{cueCards.map(c => <article key={c.topic} className="cue-mini"><strong lang="en">{c.prompt}</strong>
        <div><button className="secondary-button" onClick={() => setOpen({ kind: 'speaking', plan: { mode: 'part2', card: c }, title: 'Part 2 · ' + c.topic })}>Part 2</button>
          <button className="secondary-button" onClick={() => setOpen({ kind: 'speaking', plan: { mode: 'part3', topic: c.part3 }, title: 'Part 3 · ' + c.part3.topic })}>Part 3</button></div></article>)}</div>
    </>}

    {tab === 'writing' && <>
      <h3 className="club-subtitle"><PencilLine size={18} /> Academic Task 1 · grafik, jadval, diagramma (20 daqiqa)</h3>
      <div className="topic-grid cards">{task1.map((t, i) => <button key={t.id} className="cue-mini" onClick={() => setOpen({ kind: 'task1', index: i })}><span className="tile-tag">{t.kind.toUpperCase()}</span><strong lang="en">{t.prompt.split('.')[0]}.</strong></button>)}</div>
      <h3 className="club-subtitle"><PencilLine size={18} /> Task 2 · esse (40 daqiqa)</h3>
      <div className="topic-grid cards">{task2.map((t, i) => <button key={t.id} className="cue-mini" onClick={() => setOpen({ kind: 'task2', index: i })}><span className="tile-tag">{t.type}</span><strong lang="en">{t.prompt}</strong></button>)}</div>
    </>}

    {tab === 'lr' && <div className="practice-card"><h3><Headphones size={18} /> Listening va <BookOpenText size={18} /> Reading</h3>
      <p>IELTS formatidagi mini-mock: audio tinglab javob yozish, matn o‘qib savollarga javob berish, so‘ng Writing va Speaking. Natijalar saqlanadi.</p>
      <button className="primary-button" onClick={() => setOpen({ kind: 'mock' })}>Mini-mockni boshlash</button></div>}

    {tab === 'fresh' && <div className="fresh-panel">
      <div className="practice-card"><h3><Sparkles size={18} /> Oxirgi oylarda imtihonda tushgan savollar</h3>
        <p>AI internetdan nomzodlar so‘nggi 12 oyda imtihondan keyin xabar bergan Speaking savollarini qidiradi va shu yerga olib keladi. Savollar sayt ichida ochiladi — boshqa saytga o‘tilmaydi.</p>
        <p className="grading-note">IELTS jonli imtihon savollarini rasman e’lon qilmaydi. Bu savollar nomzodlar xotirasidan yozilgan, norasmiy manbalardan olingan.</p>
        <button className="primary-button" disabled={!canFresh || busy} onClick={refresh}><RefreshCw size={17} /> {busy ? 'Qidirilmoqda… (1 daqiqagacha)' : 'Savollarni yangilash'}</button>
        {!canFresh && <p className="grading-note">Bu funksiya uchun serverda OpenAI kaliti kerak.</p>}
        <p role="status">{message}</p></div>
      {fresh && <><p className="grading-note">Yangilangan: {fresh.date} · Davr: {fresh.data.period}</p>
        <div className="topic-grid cards">{fresh.data.sets.map((s, i) => <article key={i} className="cue-mini"><span className="tile-tag">{s.part} · {s.reported}</span><strong>{s.topic}</strong>
          <ul lang="en">{s.questions.slice(0, 4).map(q => <li key={q}>{q}</li>)}</ul>{!!s.cues.length && <ul lang="en" className="cues">{s.cues.map(c => <li key={c}>{c}</li>)}</ul>}
          <small>Manba: {s.source}</small><button className="secondary-button" onClick={() => practiseFresh(s)}><Mic size={15} /> Mashq qilish</button></article>)}</div></>}
    </div>}

    {tab === 'history' && <div className="practice-card"><h3>Speaking natijalari</h3>
      {!history.length ? <p>Hali imtihon topshirilmagan.</p> : <><div className="band-trend">{[...history].reverse().map(h => <span key={h.id} style={{ height: `${(h.report.overall / 9) * 100}%` }} title={`${h.mode}: ${h.report.overall}`}><b>{h.report.overall.toFixed(1)}</b></span>)}</div>
        <table className="history-table"><thead><tr><th>Sana</th><th>Mashq</th><th>Overall</th><th>FC</th><th>LR</th><th>GRA</th><th>P</th></tr></thead>
          <tbody>{history.map(h => <tr key={h.id}><td>{new Date(h.date).toLocaleDateString('uz-UZ')}</td><td>{h.mode}{h.ai ? '' : ' (taxminiy)'}</td><td><b>{h.report.overall.toFixed(1)}</b></td><td>{h.report.fluency}</td><td>{h.report.lexical}</td><td>{h.report.grammar}</td><td>{h.report.pronunciation}</td></tr>)}</tbody></table></>}
    </div>}
    <Credits />
  </section>;
}

export type { Part1Topic };
