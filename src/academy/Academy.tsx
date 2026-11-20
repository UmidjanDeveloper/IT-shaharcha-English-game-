import {
  ArrowDown, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, BookOpenText,
  Check, CircleHelp, Headphones, Flame, Gamepad2, Languages, Maximize2, Mic, Minimize2, PencilLine, Sparkles,
  Square, Swords, Timer, Trophy, Volume2, X, Zap,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { quizzes, readings, writings } from './lessons';
import type { Level, Question } from './lessons';
import { scoreWriting } from './scoring';
import { vocabulary } from './vocabulary';
import { WordSprint } from './WordSprint';
import { SpeakingStudio } from './SpeakingStudio';
import { speakingPrompts } from './speaking';
import { LearningPath } from './LearningPath';
import { Library } from './Library';
import type { LaunchGame } from './Library';
import type { GameType } from '../types';
import { Workshop, workshops } from './Workshop';
import './academy.css';
import { MockHistory } from './MockHistory';

const OfficialIELTS = lazy(()=>import('./OfficialStudio').then(m=>({ default:m.OfficialIELTS })));
const MockExam = lazy(() => import('./MockExam').then(m => ({ default: m.MockExam })));
const BoardArena = lazy(() => import('./BoardArena').then(m => ({ default: m.BoardArena })));
const ClassicGames = lazy(() => import('../App'));

const levels = [
  { id: 'beginner', title: 'Boshlang‘ich', range: 'A1–A2', tag: 'Sodda gaplar va kundalik so‘zlar', color: 'mint' },
  { id: 'intermediate', title: 'O‘rta', range: 'B1–B2', tag: 'Grammatika va matnni tushunish', color: 'violet' },
  { id: 'ielts', title: 'IELTS', range: 'IELTS', tag: 'Reading, Writing va Speaking mashqlari', color: 'orange' },
] as const;

const activities = [
  { id: 'mock', title: '3D ustoz bilan mini-mock', detail: 'Listening, Reading, Writing va Speaking sinovi.', icon: Headphones, color: 'blue', label: '4 KO‘NIKMA' },
  { id: 'arena', title: 'Doska arenasi', detail: 'Ikki jamoa yoki ikki o‘quvchi bitta doskada bellashadi.', icon: Swords, color: 'orange', label: 'BELLASHUV' },
  { id: 'reading', title: 'Matn va tarjima', detail: 'Matnni o‘qing, tarjima qiling va savolga javob bering.', icon: BookOpenText, color: 'violet', label: 'READING' },
  { id: 'quiz', title: 'Tezkor savol-javob', detail: 'To‘g‘ri javobni tanlang va izoh orqali o‘rganing.', icon: Zap, color: 'mint', label: 'QUIZ' },
  { id: 'duel', title: 'Yozuv dueli', detail: 'Ikki o‘quvchi yozadi. Xatolarni toping va ballarni solishtiring.', icon: Swords, color: 'orange', label: '2 O‘QUVCHI' },
  { id: 'speaking', title: 'Speaking Studio', detail: 'Murabbiy savol beradi, siz inglizcha javob berasiz.', icon: Mic, color: 'pink', label: 'MIKROFON' },
  { id: 'sprint', title: 'So‘z sprinti', detail: 'So‘z va tarjimalarni vaqtga qarshi juftlang.', icon: Timer, color: 'blue', label: '30 SONIYA' },
] as const;

type Activity = typeof activities[number]['id'];
type Screen = 'home' | 'progress' | 'legacy';
type Awards = Record<string, number>;

const storageKey = 'it-shaharcha-academy-xp-v1';


function loadAwards(): Awards {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([key, value]) =>
      /^(beginner|intermediate|ielts)-(reading|quiz|duel|sprint|speaking|mock)-\d+$/.test(key) &&
      typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 10
    ));
  } catch {
    return {};
  }
}

export default function Academy() {
  const [level, setLevel] = useState<Level>('beginner');
  const [screen, setScreen] = useState<Screen>('home');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [launched, setLaunched] = useState<LaunchGame | null>(null);
  const workshop = workshops.find(g => g.id === launched?.id);
  const [board, setBoard] = useState(false);
  const [dailyRound, setDailyRound] = useState<number | null>(null);
  const [awards, setAwards] = useState(loadAwards);
  const levelsSection = useRef<HTMLDivElement>(null);
  const activitiesSection = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const selectedLevel = levels.find(item => item.id === level)!;
  const xp = Object.values(awards).reduce((total, points) => total + points, 0);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(awards)); } catch { /* Practice still works without storage. */ }
  }, [awards]);

  useEffect(() => {
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [screen, activity]);

  function navigate(next: Screen) {
    setLaunched(null);
    setScreen(next);
    setActivity(null);
    setDailyRound(null);
    if (screen === next) window.scrollTo(0, 0);
  }

  const award = useCallback((index: number, points: number) => {
    const key = `${level}-${activity}-${index}`;
    setAwards(previous => points > (previous[key] ?? 0) ? { ...previous, [key]: points } : previous);
  }, [activity, level]);

  function openExercise(kind: Activity, daily: number | null = null) {
    setDailyRound(daily);
    setActivity(kind);
  }

  function openActivities() {
    navigate('home');
    requestAnimationFrame(() => {
      activitiesSection.current?.scrollIntoView({ block: 'start' });
      activitiesSection.current?.focus({ preventScroll: true });
    });
  }

  function showLibrary() {
    navigate('home');
    requestAnimationFrame(()=>document.getElementById('club-library')?.scrollIntoView());
  }
  function official() {
    navigate('home'); setLevel('ielts');
    requestAnimationFrame(()=>activitiesSection.current?.scrollIntoView());
  }
  return (
    <div className={`academy ${board ? 'academy-board' : ''}`}>
      <header className="academy-header">
        <div className="academy-top">
          <button className="academy-brand" onClick={() => navigate('home')} aria-label="IT Shaharcha bosh sahifasi">
            <span className="brand-mark"><Sparkles size={21} strokeWidth={2.6} /></span>
            <span><strong>Shaharcha<span>.</span></strong><small>ENGLISH CLUB</small></span>
          </button>
          <nav className="academy-nav" aria-label="Asosiy menyu">
            <button aria-current={screen === 'home' && !activity ? 'page' : undefined} onClick={() => navigate('home')}>Bosh sahifa</button>
            <button aria-current={activity ? 'page' : undefined} onClick={openActivities}>Mashqlar</button>
            <button onClick={showLibrary}>O‘yinlar</button>
            <button onClick={official}>IELTS</button>
            <button aria-current={screen === 'progress' ? 'page' : undefined} onClick={() => navigate('progress')}>Natijalar</button>
          </nav>
          <div className="academy-tools">
            <button className="board-button" aria-label="Doska rejimi" aria-pressed={board} onClick={() => setBoard(!board)}>
              {board ? <Minimize2 size={17} /> : <Maximize2 size={17} />} <span>Doska</span>
            </button>
            <button className="xp-pill" onClick={() => navigate('progress')} aria-label={`Natijalar, ${xp} XP`}><Zap size={16} fill="currentColor" /> {xp} XP</button>
          </div>
        </div>
      </header>

      <main className={`academy-main ${screen === 'legacy' ? 'academy-legacy' : ''}`} ref={main} tabIndex={-1}>
        {screen === 'legacy' && launched && (workshop ?
          <Workshop game={workshop} onExit={showLibrary}/> :
          <><button className="back-button archive-back" onClick={showLibrary}>← O‘yinlarga qaytish</button>
          <Suspense fallback="O‘yin yuklanmoqda…"><ClassicGames key={launched.id}
            initialGame={launched.id === 'shadowing' || launched.id === 'dubbing' ? undefined : launched.id as GameType}
            difficulty={level === 'beginner' ? 'beginner' : level === 'intermediate' ? 'elementary' : 'advanced'}
            section={launched.id === 'shadowing' || launched.id === 'dubbing' ? launched.id : 'games'} onLeave={showLibrary}/></Suspense></>)}

        {screen === 'progress' && (
          <section className="progress-panel">
            <div className="progress-hero">
              <div><h1>Natijalar</h1><p>Eng yaxshi mashq ballaringiz shu brauzerda XP sifatida saqlanadi.</p></div>
              <div className="progress-total"><Trophy size={30} /><strong>{xp} XP</strong></div>
            </div>
            <div className="level-grid">
              {levels.map(item => {
                const completed = Object.keys(awards).filter(key => key.startsWith(`${item.id}-`)).length;
                const total = readings[item.id].length + quizzes[item.id].length + writings[item.id].length + vocabulary[item.id].length + speakingPrompts[item.id].length + 1;
                return (
                  <article className={`progress-level ${item.color}`} key={item.id}>
                    <div className="progress-label"><h2>{item.title}</h2><strong>{completed} / {total}</strong></div>
                    <progress value={Math.min(completed, total)} max={total} aria-label={`${item.title} darajasida ball olingan mashqlar`} />
                    <p>Ball olingan mashqlar</p>
                  </article>
                );
              })}
            </div>
            <button className="primary-button" onClick={openActivities}>Mashqlarga o‘tish <ArrowRight size={18} /></button>
            <MockHistory />
          </section>
        )}

        {screen === 'home' && !activity && (
          <>
            <section className="club-cover">
              <div className="club-cover-copy"><span>IT SHAHARCHA · XATIRCHI</span>
                <h1>Ingliz tilini<br/>qayerdan boshlaymiz?</h1>
                <p>Darajangizni tanlang, sinfdoshlar bilan o‘ynang yoki IELTS ko‘nikmalarini mashq qiling.</p>
                <div><button className="primary-button" onClick={openActivities}>Dars tanlash <ArrowDown size={17}/></button>
                <button className="cover-link" onClick={showLibrary}>O‘yin tanlash →</button></div>
              </div>
            </section>

            <section className="academy-section" ref={activitiesSection} tabIndex={-1} aria-labelledby="activity-title">
              <div className="section-head">
                <div><h2 id="activity-title">Darajangizni tanlang</h2><p>{selectedLevel.tag}</p></div>
                <div className="level-selector" ref={levelsSection} tabIndex={-1} aria-label="Darajani tanlang" role="group">
                  {levels.map(item => (
                    <button key={item.id} className={item.color} onClick={() => setLevel(item.id)} aria-pressed={item.id === level}>
                      {item.title}{item.id !== 'ielts' && <small>{item.range}</small>}
                    </button>
                  ))}
                </div>
              </div>
              {level === 'ielts' ? <Suspense fallback="Rasmiy mashqlar yuklanmoqda…"><OfficialIELTS/></Suspense> : <>
              <LearningPath key={level} beginner={level === 'beginner'}/>
              <h3 className="club-subtitle">Shaharcha mashqlari</h3>
              <div className="level-grid activity-grid">
                {activities.map(item => (
                  <button key={item.id} className={`activity-card ${item.color}`} onClick={() => openExercise(item.id)}>
                    <span className="activity-top"><span className="tile-icon"><item.icon size={24} /></span><span className="tile-tag">{item.label}</span></span>
                    <span className="activity-text"><strong>{item.title}</strong><span>{item.detail}</span></span>
                    <span className="activity-go" aria-hidden="true"><ArrowUpRight size={20} /></span>
                    <item.icon className="activity-watermark" size={144} strokeWidth={1} aria-hidden="true" />
                  </button>
                ))}
              </div></>}
            </section>
            <Library onStart={game=>{setLaunched(game);setScreen('legacy');window.scrollTo(0,0);}}/>
          </>
        )}

        {screen === 'home' && activity === 'sprint' && (
          <WordSprint key={level} level={level} levelTitle={selectedLevel.title} onExit={openActivities} award={award} />
        )}

        {screen === 'home' && activity === 'speaking' && (
          <SpeakingStudio key={level} level={level} onExit={openActivities} award={award} />
        )}

        {activity === 'mock' && <Suspense fallback="Sinov yuklanmoqda…"><MockExam level={level} onExit={openActivities} award={()=>award(0,10)} /></Suspense>}
        {activity === 'arena' && <Suspense fallback="Arena yuklanmoqda…"><BoardArena level={level} onExit={openActivities} /></Suspense>}
        {screen === 'home' && activity && activity !== 'mock' && activity !== 'arena' && activity !== 'sprint' && activity !== 'speaking' && (
          <Practice key={`${level}-${activity}-${dailyRound}`} level={level} activity={activity} dailyRound={dailyRound} onExit={openActivities} award={award} />
        )}
      </main>

      <footer className="academy-footer">
        <span><Sparkles size={15} /> IT Shaharcha · Xatirchi</span>

      </footer>
    </div>
  );
}

function Practice({ level, activity, dailyRound, onExit, award }: { level: Level; activity: Exclude<Activity, 'sprint' | 'speaking' | 'mock' | 'arena'>; dailyRound: number | null; onExit: () => void; award: (index: number, points: number) => void }) {
  const [index, setIndex] = useState(dailyRound ?? 0);
  const items = activity === 'reading' ? readings[level] : activity === 'quiz' ? quizzes[level] : writings[level];
  const current = activities.find(item => item.id === activity)!;
  const levelInfo = levels.find(item => item.id === level)!;
  const total = dailyRound === null ? items.length : 1;
  const content = useRef<HTMLHeadingElement>(null);

  function advance(next: number) {
    setIndex(next);
    content.current?.scrollIntoView({ block: 'start' });
    content.current?.focus({ preventScroll: true });
  }

  return (
    <section className="practice">
      <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Mashqlarga qaytish</button>
      <div className="practice-heading">
        <div className={`practice-kicker ${current.color}`}><current.icon size={18} /> {levelInfo.title}</div>
        <h1 ref={content} tabIndex={-1}>{dailyRound === null ? current.title : 'Kunlik sinov'}</h1>
        <div className="round-header">
          <span><ArrowDownRight size={17} /> {dailyRound === null ? index + 1 : 1} / {total} mashq</span>
          {dailyRound === null && (
            <div className="round-control" aria-label="Mashq bosqichi">
              {Array.from({ length: total }, (_, step) => (
                <button key={step} aria-label={`${step + 1}-mashq`} aria-current={step === index ? 'step' : undefined} onClick={() => advance(step)}>{step + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {activity === 'duel' ? (
        <Duel key={index} level={level} index={index} award={points => award(index, points)} next={() => advance(index + 1)} onExit={onExit} />
      ) : (
        <QuestionRound key={index} level={level} kind={activity} index={index} daily={dailyRound !== null} award={points => award(index, points)} next={() => advance(index + 1)} onExit={onExit} />
      )}
    </section>
  );
}

function QuestionRound({ level, kind, index, daily, award, next, onExit }: {
  level: Level; kind: 'quiz' | 'reading'; index: number; daily: boolean; award: (points: number) => void; next: () => void; onExit: () => void;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [translation, setTranslation] = useState(false);
  const reading = kind === 'reading' ? readings[level][index] : null;
  const item: Question = reading?.question ?? quizzes[level][index];
  const isLast = daily || index === (reading ? readings[level].length : quizzes[level].length) - 1;

  function select(option: number) {
    if (choice !== null) return;
    setChoice(option);
    if (option === item.correct) award(10);
  }

  return (
    <div className="practice-stack">
      {reading && (
        <article className="practice-card reading-card">
          <h2 lang="en">{reading.title}</h2>
          <p className="reading-instruction">Matnni avval o‘zingiz tarjima qilib ko‘ring.</p>
          <p className="reading-text" lang="en">{reading.passage}</p>
          <div className="reading-actions">
            <button className="secondary-button" onClick={() => setTranslation(!translation)} aria-expanded={translation} aria-controls="text-translation"><Languages size={18} /> {translation ? 'Tarjimani yashirish' : 'Tarjimani ko‘rsatish'}</button>
            <ReadAloud passage={reading.passage} />
          </div>
          {translation && <div className="translation-box" id="text-translation"><strong>O‘zbekcha tarjima</strong><p>{reading.translation}</p></div>}
        </article>
      )}
      <article className="practice-card">
        <div className="question-label"><CircleHelp size={17} /> {daily ? 1 : index + 1}-savol</div>
        <h2 className="question-prompt">{item.prompt}</h2>
        <div className="answer-grid">
          {item.options.map((option, optionIndex) => {
            const correct = choice !== null && optionIndex === item.correct;
            const wrong = choice === optionIndex && !correct;
            return <button className={`answer-option ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`} disabled={choice !== null} key={option} onClick={() => select(optionIndex)}>
              <span className="answer-letter" aria-hidden="true">{correct ? <Check size={17} /> : wrong ? <X size={17} /> : 'ABCD'[optionIndex]}</span>{option}
            </button>;
          })}
        </div>
        <div aria-live="polite">
          {choice !== null && <div className={`feedback ${choice === item.correct ? 'feedback-good' : 'feedback-retry'}`}>
            <strong>{choice === item.correct ? 'To‘g‘ri! · 10 ball' : `To‘g‘ri javob — ${item.options[item.correct]}`}</strong>
            <p>{item.explanation}</p>
          </div>}
        </div>
        {choice !== null && <button className="primary-button" onClick={isLast ? onExit : next}>{isLast ? daily ? 'Sinovni tugatish' : 'Mashqni tugatish' : 'Keyingi savol'} <ArrowRight size={18} /></button>}
      </article>
    </div>
  );
}

function ReadAloud({ passage }: { passage: string }) {
  const [state, setState] = useState<'idle' | 'speaking' | 'error'>('idle');
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const available = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  function stop() {
    if (!current.current) return;
    current.current.onend = null;
    current.current.onerror = null;
    current.current = null;
    window.speechSynthesis.cancel();
  }

  useEffect(() => stop, []);

  function toggle() {
    if (current.current) {
      stop();
      setState('idle');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(passage);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.onend = () => {
      current.current = null;
      setState('idle');
    };
    utterance.onerror = () => {
      current.current = null;
      setState('error');
    };
    current.current = utterance;
    setState('speaking');
    window.speechSynthesis.speak(utterance);
  }

  if (!available) return null;
  return (
    <>
      <button className="secondary-button listen-button" onClick={toggle}>
        {state === 'speaking' ? <><Square size={17} /> To‘xtatish</> : <><Volume2 size={18} /> Tinglash</>}
      </button>
      {state === 'error' && <span className="listen-error" role="status">Brauzer inglizcha matnni ovoz chiqarib o‘qiy olmadi.</span>}
    </>
  );
}

function Duel({ level, index, award, next, onExit }: { level: Level; index: number; award: (points: number) => void; next: () => void; onExit: () => void }) {
  const [names, setNames] = useState(['', '']);
  const [answers, setAnswers] = useState(['', '']);
  const [results, setResults] = useState<ReturnType<typeof scoreWriting>[] | null>(null);
  const [model, setModel] = useState(false);
  const task = writings[level][index];
  const isLast = index === writings[level].length - 1;
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const playerName = (player: number) => names[player].trim() || `${player + 1}-o‘quvchi`;
  const winner = results && Math.sign(results[0].score - results[1].score);

  useEffect(() => {
    if (results) resultHeading.current?.focus();
  }, [results]);

  return (
    <div className="practice-stack">
      <article className="practice-card reading-card">
        <h2 lang="en">{task.title}</h2>
        <p>{task.instruction}</p>
        <p className="writing-prompt">{task.prompt}</p>
      </article>
      <form className="practice-card" onSubmit={event => {
        event.preventDefault();
        if (results || answers.some(answer => !answer.trim())) return;
        const scores = answers.map(answer => scoreWriting(answer, task));
        setResults(scores);
        award(Math.max(...scores.map(result => result.score)));
      }}>
        <div className="duel-grid">
          {answers.map((answer, player) => (
            <div className={`duel-player ${player === 0 ? 'violet' : 'orange'}`} key={player}>
              <label htmlFor={`duel-name-${player}`}><PencilLine size={17} /> {player + 1}-o‘quvchi</label>
              <input id={`duel-name-${player}`} placeholder="Ism (ixtiyoriy)" maxLength={32} value={names[player]} readOnly={!!results} onChange={event => setNames(names.map((name, i) => i === player ? event.target.value : name))} />
              <label className="duel-answer-label" htmlFor={`duel-answer-${player}`}>Inglizcha javob</label>
              <textarea id={`duel-answer-${player}`} placeholder="Javobingizni shu yerga yozing…" rows={5} maxLength={800} required value={answer} readOnly={!!results} onChange={event => setAnswers(answers.map((value, i) => i === player ? event.target.value : value))} />
            </div>
          ))}
        </div>
        {!results && <><p className="grading-note">Ball topshiriqdagi iboralar va keng tarqalgan xatolar asosida hisoblanadi. Boshqa to‘g‘ri variantlarni namuna bilan solishtiring.</p><button className="primary-button" disabled={answers.some(answer => !answer.trim())} type="submit">Javoblarni tekshirish <Check size={18} /></button></>}
      </form>

      {results && (
        <section className="practice-card result-card">
          <h2 ref={resultHeading} tabIndex={-1}><Trophy size={22} /> {winner === 0 ? 'Durrang!' : `${playerName(winner === 1 ? 0 : 1)} g‘olib!`}</h2>
          <p className="grading-note">Mashq balli · 10 ballik mezon. Rasmiy IELTS band bahosi o‘qituvchi yoki imtihon oluvchi baholashini talab qiladi.</p>
          <div className="duel-grid">
            {results.map((result, player) => (
              <div className="result-player" key={player}>
                <div className="player-score"><strong>{playerName(player)}</strong><span>{result.score} / 10</span></div>
                <ul className="result-list">
                  {result.criteria.map(criterion => <li key={criterion.label} className={criterion.passed ? 'criterion-good' : 'criterion-missing'}>
                    {criterion.passed ? <Check size={16} aria-label="Topildi" /> : <X size={16} aria-label="Topilmadi" />}
                    <div><strong>{criterion.label}</strong>{!criterion.passed && <p>{criterion.hint}</p>}</div>
                  </li>)}
                </ul>
                {result.errors.map(error => <p className="writing-error" key={error.note}><mark lang="en">{error.phrase}</mark> {error.note}</p>)}
              </div>
            ))}
          </div>
          <div className="result-actions">
            <button className="secondary-button" aria-expanded={model} aria-controls="model-answer" onClick={() => setModel(!model)}><BookOpen size={17} /> {model ? 'Namunani yashirish' : 'Namunaviy javob'}</button>
            <button className="primary-button" onClick={isLast ? onExit : next}>{isLast ? 'Mashqlarga qaytish' : 'Keyingi duel'} <ArrowRight size={18} /></button>
          </div>
          {model && <div id="model-answer" className="translation-box" lang="en">{task.model}</div>}
        </section>
      )}
    </div>
  );
}
