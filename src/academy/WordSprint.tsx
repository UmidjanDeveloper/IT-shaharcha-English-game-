import { ArrowLeft, ArrowRight, Check, RefreshCw, Timer, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Level } from './lessons';
import { vocabulary } from './vocabulary';

const secondsPerRound = 30;

type Round = {
  index: number;
  order: number[];
  deadline: number | null;
  matched: number[];
  mistakes: [word: number, translation: number][];
};

function shuffledOrder(length: number) {
  const order = Array.from({ length }, (_, index) => index);
  for (let end = length - 1; end > 0; end--) {
    const other = Math.floor(Math.random() * (end + 1));
    [order[end], order[other]] = [order[other], order[end]];
  }
  if (order.every((value, index) => value === index)) order.push(order.shift()!);
  return order;
}

export function WordSprint({ level, levelTitle, onExit, award }: {
  level: Level;
  levelTitle: string;
  onExit: () => void;
  award: (index: number, points: number) => void;
}) {
  const sets = vocabulary[level];
  const [round, setRound] = useState<Round | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(secondsPerRound);
  const [status, setStatus] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [timed, setTimed] = useState(true);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const pairs = round ? sets[round.index] : [];
  const score = round ? Math.max(0, Math.round(round.matched.length * 10 / pairs.length) - round.mistakes.length) : 0;
  const complete = round?.matched.length === pairs.length;
  const deadline = round?.deadline;

  useEffect(() => {
    if (status !== 'playing' || deadline == null) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setStatus('finished');
    };
    const id = window.setInterval(tick, 150);
    return () => window.clearInterval(id);
  }, [deadline, status]);

  useEffect(() => {
    if (status !== 'finished' || !round) return;
    award(round.index, score);
    resultsHeading.current?.focus();
  }, [award, round, score, status]);

  function start(index: number) {
    setRound({
      index,
      order: shuffledOrder(sets[index].length),
      deadline: timed ? performance.now() + secondsPerRound * 1000 : null,
      matched: [],
      mistakes: [],
    });
    setSelection(null);
    setRemaining(secondsPerRound);
    setMessage('');
    setStatus('playing');
    heading.current?.focus();
  }

  function match(translation: number) {
    if (!round || status !== 'playing' || selection === null || round.matched.includes(translation)) return;
    if (round.deadline !== null && performance.now() >= round.deadline) {
      setRemaining(0);
      setStatus('finished');
      return;
    }
    if (selection === translation) {
      const matched = [...round.matched, selection];
      setRound({ ...round, matched });
      setMessage(`To‘g‘ri juftlik! ${matched.length} / ${pairs.length}`);
      if (matched.length === pairs.length) setStatus('finished');
    } else {
      setRound({ ...round, mistakes: [...round.mistakes, [selection, translation]] });
      setMessage(`${pairs[selection][0]} va ${pairs[translation][1]} mos kelmadi. Yana urinib ko‘ring.`);
    }
    setSelection(null);
  }

  return (
    <section className="practice sprint">
      <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> Mashqlarga qaytish</button>
      <div className="practice-heading sprint-heading">
        <div className="practice-kicker"><Timer size={18} /> {levelTitle}</div>
        <h1 ref={heading} tabIndex={-1}>So‘z sprinti</h1>
        <p>Inglizcha so‘zni bosing, keyin uning o‘zbekcha tarjimasini tanlang.</p>
      </div>
      {status === 'ready' && (
        <div className="practice-card sprint-intro">
          <h2>{sets[0].length} ta juftlik</h2>
          <p>Har bir to‘g‘ri juftlik 2 ball. Har xato urinish 1 ball ayiradi.</p>
          <label><input type="checkbox" checked={timed} onChange={event => setTimed(event.target.checked)} /> 30 soniyalik vaqt chegarasi</label>
          <button className="primary-button" onClick={() => start(0)}>Raundni boshlash <ArrowRight size={18} /></button>
        </div>
      )}
      {status === 'playing' && round && (
        <div className="practice-card sprint-board">
          <div className="sprint-meta">
            <strong>{round.index + 1} / {sets.length} raund</strong>
            <span>{round.matched.length} / {pairs.length} juftlik</span>
            {timed && <span className="sprint-clock" aria-label={`Qolgan vaqt ${remaining} soniya`}><Timer size={18} /> {remaining} s</span>}
          </div>
          <div className="sprint-columns">
            <div>
              <h2>Inglizcha</h2>
              {pairs.map(([word], index) => (
                <button key={word} type="button" lang="en" disabled={round.matched.includes(index)} aria-pressed={selection === index} onClick={() => setSelection(selection === index ? null : index)}>
                  {word}{round.matched.includes(index) && <Check size={16} />}
                </button>
              ))}
            </div>
            <div>
              <h2>O‘zbekcha</h2>
              {round.order.map(index => (
                <button key={index} type="button" disabled={round.matched.includes(index)} aria-disabled={selection === null || undefined} onClick={() => match(index)}>
                  {pairs[index][1]}{round.matched.includes(index) && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
          <p className="sprint-message" aria-live="polite">{message}</p>
        </div>
      )}
      {status === 'finished' && round && (
        <section className="practice-card sprint-results">
          <h2 ref={resultsHeading} tabIndex={-1}><Trophy size={22} /> {complete ? 'Barcha juftliklar topildi!' : 'Vaqt tugadi!'}</h2>
          <p><strong>{score} / 10 ball</strong> · {round.matched.length} / {pairs.length} juftlik · {round.mistakes.length} xato urinish</p>
          <ul>
            {pairs.map(([word, translation], index) => {
              const misses = [...new Set(round.mistakes.filter(([item]) => item === index).map(([, guess]) => pairs[guess][1]))];
              return (
                <li key={word}>
                  <strong lang="en">{word}</strong><span>{translation}</span>
                  {misses.length > 0 ? <small>Tanlangan: {misses.join(', ')}</small> : !round.matched.includes(index) && <small>Juftlanmadi</small>}
                </li>
              );
            })}
          </ul>
          <div className="result-actions">
            <button className="secondary-button" onClick={() => start(round.index)}><RefreshCw size={17} /> Qayta o‘ynash</button>
            {round.index + 1 < sets.length ? (
              <button className="primary-button" onClick={() => start(round.index + 1)}>Keyingi raund <ArrowRight size={18} /></button>
            ) : (
              <button className="primary-button" onClick={onExit}>Sprintni tugatish <ArrowRight size={18} /></button>
            )}
          </div>
        </section>
      )}
    </section>
  );
}
