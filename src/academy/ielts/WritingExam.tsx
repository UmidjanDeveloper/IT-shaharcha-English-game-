import { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { ask, explain, getCapabilities } from '../ai';
import type { Lang } from '../ai';
import type { Task1, Task2 } from './questionBank';

type WritingReport = {
  overall: number; task: number; coherence: number; lexical: number; grammar: number; summary: string;
  criteria: { task: string; coherence: string; lexical: string; grammar: string };
  corrections: { original: string; better: string; why: string }[]; improved: string; plan: string[];
};

const palette = ['#5528a8', '#e2733d', '#1f8a70', '#c2417f', '#2f6fd6'];

export function Chart({ task }: { task: Task1 }) {
  const max = Math.max(...task.series.flatMap(s => s.values)) * 1.15;
  const w = 560, h = 260, left = 44, bottom = 30, plotW = w - left - 10, plotH = h - bottom - 14;
  if (task.kind === 'table') return <div className="chart-table"><table><thead><tr><th>{task.unit}</th>{task.labels.map(l => <th key={l}>{l}</th>)}</tr></thead>
    <tbody>{task.series.map(s => <tr key={s.name}><th>{s.name}</th>{s.values.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody></table></div>;
  if (task.kind === 'pie') {
    const total = task.series[0].values.reduce((a, b) => a + b, 0);
    let angle = -Math.PI / 2;
    return <svg viewBox="0 0 560 260" className="chart" role="img" aria-label="Pie chart">
      {task.series[0].values.map((v, i) => {
        const a2 = angle + (v / total) * Math.PI * 2;
        const large = a2 - angle > Math.PI ? 1 : 0;
        const p = (a: number) => `${130 + 105 * Math.cos(a)} ${130 + 105 * Math.sin(a)}`;
        const d = `M130 130 L${p(angle)} A105 105 0 ${large} 1 ${p(a2)} Z`;
        angle = a2;
        return <path key={i} d={d} fill={palette[i % palette.length]} stroke="#fff" strokeWidth={2} />;
      })}
      {task.labels.map((l, i) => <g key={l} transform={`translate(290 ${50 + i * 34})`}><rect width={16} height={16} rx={3} fill={palette[i % palette.length]} /><text x={24} y={13} fontSize={14}>{l} — {task.series[0].values[i]}%</text></g>)}
    </svg>;
  }
  const y = (v: number) => 14 + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(max * t));
  return <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label={`${task.kind} chart`}>
    {ticks.map(t => <g key={t}><line x1={left} x2={w - 10} y1={y(t)} y2={y(t)} stroke="#e6e0e9" /><text x={left - 6} y={y(t) + 4} fontSize={11} textAnchor="end">{t}</text></g>)}
    {task.kind === 'bar' ? task.labels.map((label, i) => {
      const group = plotW / task.labels.length, bw = (group * 0.7) / task.series.length;
      return <g key={label}>{task.series.map((s, k) => <rect key={s.name} x={left + i * group + group * 0.15 + k * bw} y={y(s.values[i])} width={bw - 2} height={y(0) - y(s.values[i])} fill={palette[k]} rx={2} />)}
        <text x={left + i * group + group / 2} y={h - 10} fontSize={12} textAnchor="middle">{label}</text></g>;
    }) : <>{task.series.map((s, k) => <polyline key={s.name} fill="none" stroke={palette[k]} strokeWidth={3} points={s.values.map((v, i) => `${left + (i / (task.labels.length - 1)) * plotW},${y(v)}`).join(' ')} />)}
      {task.labels.map((l, i) => <text key={l} x={left + (i / (task.labels.length - 1)) * plotW} y={h - 10} fontSize={12} textAnchor="middle">{l}</text>)}</>}
    {task.series.map((s, k) => <g key={s.name} transform={`translate(${left + 8 + k * 120} 4)`}><rect width={12} height={12} fill={palette[k]} rx={2} /><text x={17} y={11} fontSize={12}>{s.name}</text></g>)}
  </svg>;
}

export function WritingExam({ task, onExit }: { task: { kind: 'Task 1'; data: Task1 } | { kind: 'Task 2'; data: Task2 }; onExit: () => void }) {
  const minutes = task.kind === 'Task 1' ? 20 : 40, minWords = task.kind === 'Task 1' ? 150 : 250;
  const [answer, setAnswer] = useState('');
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [lang, setLang] = useState<Lang>('uz');
  const [report, setReport] = useState<WritingReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canAssess, setCanAssess] = useState(false);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  useEffect(() => { getCapabilities().then(c => setCanAssess(c.assess)); }, []);
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setLeft(l => { if (l <= 1) { setRunning(false); return 0; } return l - 1; }), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  async function assess() {
    setBusy(true); setMessage(''); setRunning(false);
    try { setReport(await ask<WritingReport>({ action: 'writing', language: lang, task: task.kind, prompt: task.data.prompt, answer })); }
    catch (error) { setMessage(explain(error)); }
    finally { setBusy(false); }
  }

  const criteria = [['task', task.kind === 'Task 1' ? 'Task Achievement' : 'Task Response'], ['coherence', 'Coherence & Cohesion'], ['lexical', 'Lexical Resource'], ['grammar', 'Grammatical Range & Accuracy']] as const;
  return <section className="practice">
    <button className="back-button" onClick={onExit}><ArrowLeft size={17} /> IELTS bo‘limiga qaytish</button>
    <div className="practice-heading"><div className="practice-kicker">IELTS Academic Writing · {task.kind}</div><h1>{task.kind === 'Task 1' ? 'Grafikni tasvirlang' : (task.data as Task2).type}</h1>
      <p>Tavsiya etilgan vaqt {minutes} daqiqa · kamida {minWords} so‘z.</p></div>
    <article className="practice-card writing-task"><p lang="en"><strong>{task.data.prompt}</strong></p>
      {task.kind === 'Task 1' && <><Chart task={task.data} /><p className="grading-note">Birlik: {task.data.unit}</p></>}
      {task.kind === 'Task 2' && <p className="grading-note" lang="en">Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.</p>}
    </article>
    <article className="practice-card">
      <div className="writing-toolbar"><span className={words >= minWords ? 'ok' : 'warn'}>{words} / {minWords} so‘z</span>
        <button className="secondary-button" onClick={() => setRunning(!running)}><Clock size={16} /> {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')} {running ? '· pauza' : '· boshlash'}</button></div>
      <textarea className="mock-input writing-area" rows={16} lang="en" spellCheck={false} maxLength={8000} value={answer} onChange={e => { setAnswer(e.target.value); if (!running && !report) setRunning(true); }} placeholder="Write your answer here…" />
      <div className="result-actions">
        <label className="inline-select">Hisobot tili <select value={lang} onChange={e => setLang(e.target.value as Lang)}><option value="uz">O‘zbekcha</option><option value="en">English</option></select></label>
        <button className="primary-button" disabled={!canAssess || busy || words < 40} onClick={assess}><Sparkles size={17} /> {busy ? 'Examiner tekshiryapti…' : 'Band ball olish'}</button>
      </div>
      {!canAssess && <p className="grading-note">AI examiner ulanmagan: o‘qituvchi server sozlamalariga OpenAI kalitini qo‘shishi kerak.</p>}
      <p role="status">{message}</p>
    </article>
    {report && <section className="exam-report">
      <div className="band-hero"><div className="band-circle"><small>Overall</small><strong>{report.overall.toFixed(1)}</strong><small>AI examiner</small></div>
        <div><h2>Writing natijasi</h2><p lang={lang}>{report.summary}</p><p className="grading-note">Rasmiy natija emas — band descriptorlari asosida taxmin.</p></div></div>
      <div className="band-grid">{criteria.map(([key, label]) => <article className="practice-card band-card" key={key}>
        <div className="band-row"><strong>{label}</strong><b>{report[key].toFixed(1)}</b></div><progress value={report[key]} max={9} aria-label={label} /><p lang={lang}>{report.criteria[key]}</p></article>)}</div>
      {!!report.corrections.length && <article className="practice-card"><h3>Xatolar va tuzatishlar</h3><ul className="corrections">{report.corrections.map((c, i) => <li key={i}><del lang="en">{c.original}</del> → <ins lang="en">{c.better}</ins><small lang={lang}>{c.why}</small></li>)}</ul></article>}
      <article className="practice-card translation-box"><strong>Band 8 varianti</strong><p lang="en" className="improved-essay">{report.improved}</p></article>
      <article className="practice-card"><h3>Keyingi qadamlar</h3><ol lang={lang}>{report.plan.map(p => <li key={p}>{p}</li>)}</ol></article>
    </section>}
  </section>;
}
