// "Eshit va takrorla": the useful core of shadowing, inside each lesson. The teacher reads a model
// sentence, the learner repeats it, and every word they said correctly is marked.
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';
import { getCapabilities, speak, transcribe } from '../ai';
import { AnswerRecorder, recordingSupported } from '../ielts/recorder';

// Contractions are expanded so "I'm" and "I am" count as the same thing.
function tokens(word: string) {
  const w = word.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, '');
  if (!w) return [];
  const special: Record<string, string> = { "can't": 'can not', cannot: 'can not', "won't": 'will not', "shan't": 'shall not' };
  const expanded = special[w] ?? w.replace(/n't$/, ' not').replace(/'m$/, ' am').replace(/'re$/, ' are').replace(/'ve$/, ' have').replace(/'ll$/, ' will').replace(/'d$/, ' would').replace(/'s$/, ' is');
  return expanded.split(' ').filter(Boolean);
}

/** Marks which words of the model sentence appear, in order, in what the learner said. */
export function compareSpoken(target: string, heard: string) {
  const shown = target.split(/\s+/).filter(Boolean);
  const owner: number[] = [];
  const a = shown.flatMap((w, i) => tokens(w).map(t => { owner.push(i); return t; }));
  const b = heard.split(/\s+/).flatMap(tokens);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Array<boolean>(a.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  const ok = shown.map((_, i) => owner.some((o, k) => o === i) && owner.every((o, k) => o !== i || hit[k]));
  const score = shown.length ? Math.round((ok.filter(Boolean).length / shown.length) * 100) : 0;
  return { words: shown.map((w, i) => ({ w, ok: ok[i] })), score };
}

type Recognition = { start(): void; stop(): void; abort(): void; lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export function RepeatAfterMe({ sentences, voice }: { sentences: string[]; voice: boolean }) {
  const [canTranscribe, setCanTranscribe] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, ReturnType<typeof compareSpoken>>>({});
  const stop = useRef<() => void>(() => {});
  const Speech = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition });
  const Native = Speech.SpeechRecognition ?? Speech.webkitSpeechRecognition;
  useEffect(() => { getCapabilities().then(c => setCanTranscribe(c.transcribe)); return () => stop.current(); }, []);
  const canListen = !!Native || (canTranscribe && recordingSupported());

  async function record(i: number) {
    if (active !== null) { stop.current(); return; }
    setActive(i);
    const done = (heard: string) => { setActive(null); if (heard.trim()) setResults(r => ({ ...r, [i]: compareSpoken(sentences[i], heard) })); };
    if (Native) {
      const rec = new Native(); rec.lang = 'en-GB'; rec.interimResults = false;
      let heard = '';
      rec.onresult = e => { heard = Array.from(e.results).map(r => r[0].transcript).join(' '); };
      rec.onend = () => done(heard); rec.onerror = () => done(heard);
      stop.current = () => rec.stop();
      try { rec.start(); } catch { done(''); }
      return;
    }
    const recorder = new AnswerRecorder();
    let finished = false;
    stop.current = () => { finished = true; };
    try { await recorder.start(); } catch { setActive(null); return; }
    const until = performance.now() + 9000;
    while (!finished && performance.now() < until && !(recorder.elapsed > 1.5 && recorder.trailingSilence > 1.4)) await new Promise(r => setTimeout(r, 150));
    const audio = await recorder.stop();
    try { done((await transcribe(audio.blob, 'en')).text); } catch { done(''); }
  }

  return <section className="repeat-card">
    <h3><Volume2 size={18} /> Eshit va takrorla</h3>
    <p className="grading-note">Ustozni tinglang, so‘ng gapni ovoz chiqarib takrorlang. To‘g‘ri aytilgan so‘zlar yashil bo‘ladi.</p>
    <ol className="repeat-list">{sentences.map((s, i) => {
      const r = results[i];
      return <li key={s}>
        <p lang="en">{r ? r.words.map((x, k) => <span key={k} className={x.ok ? 'said' : 'missed'}>{x.w} </span>) : s}</p>
        <div className="repeat-actions">
          <button className="icon-button" aria-label="Tinglash" onClick={() => speak(s, 'en', { voice, slow: true })}><Volume2 size={16} /></button>
          {canListen && <button className={`icon-button mic ${active === i ? 'on' : ''}`} aria-label={active === i ? 'To‘xtatish' : 'Takrorlash'} disabled={active !== null && active !== i} onClick={() => record(i)}>{active === i ? <Square size={15} /> : <Mic size={16} />}</button>}
          {r && <b className={r.score >= 80 ? 'ok' : 'warn'}>{r.score}%</b>}
        </div>
      </li>;
    })}</ol>
    {!canListen && <p className="grading-note">Bu brauzer ovozni taniy olmaydi: gapni tinglab, ovoz chiqarib takrorlang.</p>}
  </section>;
}
