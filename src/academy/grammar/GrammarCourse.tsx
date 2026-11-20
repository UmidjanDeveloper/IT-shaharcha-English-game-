import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MessageCircle, RotateCcw, Sparkles, Timer, Trophy, Volume2, X } from 'lucide-react';
import { ask, explain, getCapabilities, speak } from '../ai';
import { allItems, cefrLevels, checkOrder, grammar } from './curriculum';
import type { CefrLevel, GrammarItem, GrammarTopic } from './curriculum';

const progressKey = 'shaharcha-grammar-v1';
type Progress = Record<string, number>;
function readProgress(): Progress {
  try { const p = JSON.parse(localStorage.getItem(progressKey) ?? '{}'); return p && typeof p === 'object' ? p : {}; } catch { return {}; }
}
function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

export const grammarGames = [
  { id: 'grammar-race', title: 'Grammatika poygasi', description: '60 soniyada imkon qadar ko‘p grammatik savolga javob bering.', icon: '⏱' },
  { id: 'grammar-hunter', title: 'Xato ovchisi', description: 'Xato gapni toping va to‘g‘ri variantni tanlang.', icon: '🔎' },
  { id: 'grammar-builder', title: 'Gap quruvchi', description: 'Aralash so‘zlardan grammatik to‘g‘ri gap tuzing.', icon: '🧱' },
] as const;
export type GrammarGameId = typeof grammarGames[number]['id'];

export function GrammarCourse({ startLevel = 'A1', onAskTeacher, onExit }: { startLevel?: CefrLevel; onAskTeacher?: (question: string) => void; onExit?: () => void }) {
  const [level, setLevel] = useState<CefrLevel>(startLevel);
  const [topic, setTopic] = useState<GrammarTopic | null>(null);
  const [game, setGame] = useState<GrammarGameId | null>(null);
  const [progress, setProgress] = useState(readProgress);
  useEffect(() => { try { localStorage.setItem(progressKey, JSON.stringify(progress)); } catch { /* optional */ } }, [progress]);
  useEffect(() => { window.scrollTo(0, 0); }, [topic, game]);
  const done = (id: string, score: number) => setProgress(p => score > (p[id] ?? 0) ? { ...p, [id]: score } : p);

  if (game) return <GrammarGame id={game} level={level} onExit={() => setGame(null)} />;
  if (topic) return <Lesson topic={topic} level={level} onDone={s => done(topic.id, s)} onAskTeacher={onAskTeacher} onExit={() => setTopic(null)} />;

  return <section className="practice grammar-course">
    {onExit && <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Orqaga</button>}
    <div className="practice-heading"><div className="practice-kicker">GRAMMATIKA KURSI · A1 → C1</div><h1>Grammatikani bosqichma-bosqich o‘rganing</h1>
      <p>Har bir mavzu: o‘zbekcha tushuntirish, inglizcha misollar, mashqlar va AI ustozdan cheksiz yangi topshiriqlar.</p></div>
    <div className="club-tabs" role="group" aria-label="Daraja">{cefrLevels.map(l => {
      const topics = grammar[l], completed = topics.filter(t => (progress[t.id] ?? 0) >= 80).length;
      return <button key={l} aria-pressed={level === l} onClick={() => setLevel(l)}>{l} <small>{completed}/{topics.length}</small></button>;
    })}</div>
    <div className="grammar-grid">{grammar[level].map((t, i) => <button key={t.id} className="grammar-topic" onClick={() => setTopic(t)}>
      <span className="tile-tag">{level} · {i + 1}</span><strong lang="en">{t.title}</strong><small>{t.uz}</small>
      <progress value={progress[t.id] ?? 0} max={100} aria-label={`${t.title} natijasi`} />{(progress[t.id] ?? 0) >= 80 && <Check className="topic-done" size={18} />}</button>)}</div>
    <h3 className="club-subtitle">Grammatika o‘yinlari ({level})</h3>
    <div className="library-grid">{grammarGames.map(g => <button key={g.id} onClick={() => setGame(g.id)}><span aria-hidden="true">{g.icon}</span><strong>{g.title}</strong><small>{g.description}</small></button>)}</div>
  </section>;
}

function Lesson({ topic, level, onDone, onAskTeacher, onExit }: { topic: GrammarTopic; level: CefrLevel; onDone: (score: number) => void; onAskTeacher?: (q: string) => void; onExit: () => void }) {
  const [items, setItems] = useState<GrammarItem[]>(topic.items);
  const [index, setIndex] = useState(-1);
  const [correct, setCorrect] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canGenerate, setCanGenerate] = useState(false);
  const [voice, setVoice] = useState(false);
  useEffect(() => { getCapabilities().then(c => { setCanGenerate(c.exercises); setVoice(c.voice); }); }, []);

  async function more() {
    setBusy(true); setMessage('');
    try {
      const data = await ask<{ items: GrammarItem[] }>({ action: 'exercises', language: 'uz', level, topic: topic.title, count: 6 });
      const valid = data.items.filter(it => it.kind === 'order' ? it.sentence.split(' ').length > 2 : it.options.length >= 2 && it.answer >= 0 && it.answer < it.options.length);
      if (!valid.length) throw new Error('empty');
      setItems(valid); setIndex(0); setCorrect(0);
    } catch (error) { setMessage(explain(error)); }
    finally { setBusy(false); }
  }

  const finished = index >= items.length;
  useEffect(() => { if (finished) onDone(Math.round((correct / items.length) * 100)); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  return <section className="practice grammar-lesson">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Mavzularga qaytish</button>
    <div className="practice-heading"><div className="practice-kicker">{level} · {topic.uz}</div><h1 lang="en">{topic.title}</h1></div>
    {index < 0 ? <article className="practice-card lesson-card">
      <p>{topic.rule}</p>
      <h3>Tuzilishi</h3><ul className="form-list" lang="en">{topic.form.map(f => <li key={f}>{f}</li>)}</ul>
      <h3>Misollar</h3><ul className="example-list">{topic.examples.map(e => <li key={e}><span lang="en">{e}</span><button className="icon-button" aria-label="Tinglash" onClick={() => speak(e, 'en', { voice })}><Volume2 size={16} /></button></li>)}</ul>
      <div className="result-actions"><button className="primary-button" onClick={() => setIndex(0)}>Mashqni boshlash <ArrowRight size={17} /></button>
        {onAskTeacher && <button className="secondary-button" onClick={() => onAskTeacher(`“${topic.title}” mavzusini menga oddiy misollar bilan tushuntirib bering va kichik mashq bering.`)}><MessageCircle size={17} /> 3D ustozdan so‘rash</button>}</div>
    </article> : finished ? <article className="practice-card lesson-card">
      <Trophy size={34} /><h2>{correct} / {items.length} to‘g‘ri</h2><p>{correct / items.length >= 0.8 ? 'Ajoyib! Mavzu o‘zlashtirildi.' : 'Yana bir bor mashq qiling — 80% dan yuqori natija mavzuni yopadi.'}</p>
      <div className="result-actions"><button className="secondary-button" onClick={() => { setItems(shuffle(topic.items)); setIndex(0); setCorrect(0); }}><RotateCcw size={17} /> Qaytadan</button>
        <button className="primary-button" disabled={!canGenerate || busy} onClick={more}><Sparkles size={17} /> {busy ? 'Tayyorlanmoqda…' : 'AI: yana 6 ta yangi mashq'}</button></div>
      {!canGenerate && <p className="grading-note">Cheksiz yangi mashqlar uchun serverda OpenAI kaliti kerak.</p>}
      <p role="status">{message}</p>
    </article> : <Exercise key={index + items[index].explanation} item={items[index]} number={index + 1} total={items.length} onAnswer={ok => ok && setCorrect(c => c + 1)} onNext={() => setIndex(index + 1)} />}
  </section>;
}

export function Exercise({ item, number, total, onAnswer, onNext, compact }: { item: GrammarItem; number: number; total?: number; onAnswer: (ok: boolean) => void; onNext: () => void; compact?: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  const tiles = useMemo(() => item.kind === 'order' ? shuffle(item.sentence.replace(/[.?!]$/, '').split(' ').map((w, i) => ({ w, i }))) : [], [item]);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  function pick(i: number) {
    if (choice !== null) return;
    setChoice(i); onAnswer(i === (item as { answer: number }).answer);
    if (compact) setTimeout(onNext, i === (item as { answer: number }).answer ? 450 : 1300);
  }
  function check() {
    if (item.kind !== 'order') return;
    const ok = checkOrder(picked.map(i => tiles[i].w), item.sentence);
    setChecked(ok); onAnswer(ok);
    if (compact) setTimeout(onNext, ok ? 450 : 1500);
  }
  const answered = choice !== null || checked !== null;
  const good = item.kind === 'order' ? checked : choice === item.answer;
  return <article className="practice-card exercise-card">
    <div className="question-label">{number}{total ? ` / ${total}` : ''} · {item.kind === 'choice' ? 'Bo‘sh joyni to‘ldiring' : item.kind === 'fix' ? 'Xatoni tuzating: to‘g‘ri variantni tanlang' : 'So‘zlardan gap tuzing'}</div>
    {item.kind === 'order' ? <>
      <h2 className="question-prompt">{item.prompt}</h2>
      <div className="club-tiles built" aria-label="Tuzilgan gap">{picked.map(i => <button key={i} disabled={answered} onClick={() => setPicked(picked.filter(n => n !== i))}>{tiles[i].w}</button>)}</div>
      <div className="club-tiles">{tiles.map((t, i) => <button key={i} disabled={picked.includes(i) || answered} onClick={() => setPicked([...picked, i])}>{t.w}</button>)}</div>
      {!answered && <button className="primary-button" disabled={picked.length !== tiles.length} onClick={check}>Tekshirish</button>}
    </> : <>
      <h2 className="question-prompt" lang="en">{item.kind === 'fix' ? <del>{item.prompt}</del> : item.prompt}</h2>
      <div className="answer-grid">{item.options.map((option, i) => {
        const isRight = choice !== null && i === item.answer, isWrong = choice === i && !isRight;
        return <button key={option + i} lang="en" className={`answer-option ${isRight ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} disabled={choice !== null} onClick={() => pick(i)}>
          <span className="answer-letter" aria-hidden="true">{isRight ? <Check size={17} /> : isWrong ? <X size={17} /> : 'ABCD'[i]}</span>{option}</button>;
      })}</div>
    </>}
    {answered && !compact && <div className={`feedback ${good ? 'feedback-good' : 'feedback-retry'}`} aria-live="polite">
      <strong>{good ? 'To‘g‘ri!' : item.kind === 'order' ? `To‘g‘ri gap: ${item.sentence}` : `To‘g‘ri javob: ${item.options[item.answer]}`}</strong><p>{item.explanation}</p></div>}
    {answered && compact && !good && <p className="feedback feedback-retry">{item.kind === 'order' ? item.sentence : item.options[item.answer]}</p>}
    {answered && !compact && <button className="primary-button" onClick={onNext}>Keyingisi <ArrowRight size={17} /></button>}
  </article>;
}

export function GrammarGame({ id, level, onExit }: { id: GrammarGameId; level: CefrLevel; onExit: () => void }) {
  const meta = grammarGames.find(g => g.id === id)!;
  const kind = id === 'grammar-race' ? null : id === 'grammar-hunter' ? 'fix' : 'order';
  const [gameLevel, setGameLevel] = useState(level);
  const deck = useMemo(() => shuffle(allItems(gameLevel).filter(it => !kind || it.kind === kind)), [gameLevel, kind]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [left, setLeft] = useState(60);
  const [started, setStarted] = useState(false);
  const best = (() => { try { return Number(localStorage.getItem('best-' + id + gameLevel) ?? 0); } catch { return 0; } })();
  const over = id === 'grammar-race' ? left === 0 : index >= Math.min(10, deck.length);
  useEffect(() => {
    if (!started || id !== 'grammar-race' || left === 0) return;
    const t = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(t);
  }, [started, left, id]);
  useEffect(() => { if (over && score > best) try { localStorage.setItem('best-' + id + gameLevel, String(score)); } catch { /* optional */ } }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  return <section className="practice grammar-game">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> O‘yinlarga qaytish</button>
    <div className="practice-heading"><div className="practice-kicker">{meta.icon} GRAMMATIKA O‘YINI</div><h1>{meta.title}</h1><p>{meta.description}</p></div>
    {!started ? <div className="practice-card"><div className="club-tabs">{cefrLevels.map(l => <button key={l} aria-pressed={gameLevel === l} onClick={() => setGameLevel(l)}>{l}</button>)}</div>
      <p>Eng yaxshi natija ({gameLevel}): {best}</p><button className="primary-button" onClick={() => setStarted(true)}>Boshlash</button></div> :
      over ? <div className="practice-card lesson-card"><Trophy size={36} /><h2>{score} ball</h2><p>{score > best ? 'Yangi rekord!' : `Rekord: ${best}`}</p>
        <button className="primary-button" onClick={() => { setIndex(0); setScore(0); setStreak(0); setLeft(60); }}><RotateCcw size={17} /> Yana o‘ynash</button></div> :
      <><div className="game-hud"><span><Trophy size={16} /> {score}</span><span>🔥 {streak}</span>{id === 'grammar-race' ? <span><Timer size={16} /> {left} s</span> : <span>{index + 1} / {Math.min(10, deck.length)}</span>}</div>
        <Exercise key={index} compact item={deck[index % deck.length]} number={index + 1} onAnswer={ok => { setScore(s => s + (ok ? 10 + Math.min(streak, 5) * 2 : 0)); setStreak(s => ok ? s + 1 : 0); }} onNext={() => setIndex(i => i + 1)} /></>}
  </section>;
}
